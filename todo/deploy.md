# CI/CD Deployment Guide: Hostinger VPS

This document outlines the automated deployment pipeline for containerizing the application, pushing to GitHub Container Registry (GHCR), and deploying to a Hostinger VPS using Docker Compose.

## 1. Architecture Overview

1. **Build & Push (GitHub Actions):** Whenever code is pushed to the `main` branch, a GitHub Action automatically builds the Docker image and pushes it to GHCR (`ghcr.io/magicarpy/ucladn-app:latest`).
2. **Deploy (Hostinger VPS):** The GitHub Action securely SSHs into the Hostinger VPS and triggers `docker compose pull && docker compose up -d`.
3. **Local Routing (Zero Latency):** Hostinger runs the Web App, MySQL, Redis, and an Open Source Routing Machine (OSRM) container locally to ensure 0ms latency for map routing and real-time tracking.

---

## 2. GitHub Actions Setup

In GitHub, go to your repository **Settings > Secrets and variables > Actions** and create these repository secrets:
* `VPS_HOST`: The public IP address of your Hostinger VPS.
* `VPS_USERNAME`: Your VPS login username (e.g., `root`).
* `VPS_SSH_KEY`: The private SSH key granting access to your VPS.

---

## 3. Hostinger Server Preparation

Before the CI/CD pipeline can work, you must prepare the Hostinger VPS once.

### Step A: Authenticate with GHCR
Your private images require authentication to pull. 
1. Create a **Personal Access Token (PAT)** in GitHub Developer Settings with the `read:packages` permission.
2. SSH into your Hostinger server and run:
   ```bash
   echo "YOUR_PAT_TOKEN" | docker login ghcr.io -u MagiCarpy --password-stdin
   ```

### Step B: Set up `docker-compose.yml`
Create a `docker-compose.yml` file on your Hostinger server. It must contain the 4 core services:
* **`app`**: Points to `image: ghcr.io/magicarpy/ucladn-app:latest`
* **`db`**: MySQL 8.4 container with persistent volumes (`db_data`)
* **`redis`**: Redis Alpine container with persistent volumes (`redis_data`)
* **`osrm-app`**: Open Source Routing Machine (OSRM) container for local routing (Requires a `.osm.pbf` map extract of UCLA/Westwood placed in a `map-data` folder).

### Step C: Set up `.env`
Create your `.env` file on the Hostinger server containing your production secrets (MySQL passwords, JWT secrets, etc.). The `.env` file is never pushed to GitHub.

---

## 4. The Workflow File

The deployment is orchestrated by `.github/workflows/deploy.yml`.

```yaml
name: Build and Deploy (Docker Compose via GHCR)

on:
  push:
    branches:
      - main

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Log in to GHCR
        run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin

      - name: Build and Push Docker Image
        run: |
          OWNER=$(echo "${{ github.repository_owner }}" | tr '[:upper:]' '[:lower:]')
          docker build -t ghcr.io/$OWNER/ucladn-app:latest .
          docker push ghcr.io/$OWNER/ucladn-app:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: SSH and Deploy to VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            # Navigate to the folder containing docker-compose.yml
            cd /path/to/your/project
            
            # Pull the newly pushed image and seamlessly reboot the containers
            docker compose pull
            docker compose up -d
```
