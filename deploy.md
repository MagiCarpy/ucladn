# CI/CD Deployment Guide: VPS Optimization

When deploying to a resource-constrained VPS (like a Hostinger VPS or AWS EC2 `t2.micro` with 1GB RAM), running production builds like `npm run build` on the server can freeze the instance or trigger an Out of Memory (OOM) error.

Instead of committing built files (like `dist/`) directly to git or building them on the weak VPS, the industry-standard solution is to build your application inside a **GitHub Actions runner** (which is free and runs on powerful cloud virtual machines) and deploy only the compiled artifacts to your VPS.

Below are the two recommended options for setting up this pipeline.

---

## Option 1: GitHub Actions + SCP Transfer (Simplest)

This approach is best if you want to deploy a traditional Node/Vite app without Docker. GitHub Actions builds the assets and securely copies them to your VPS over SSH (SCP).

### Setup Steps
1. In GitHub, go to your repository **Settings > Secrets and variables > Actions** and create these repository secrets:
   * `VPS_HOST`: The public IP address of your VPS.
   * `VPS_USERNAME`: Your VPS login username (usually `root` or `ubuntu`).
   * `VPS_SSH_KEY`: The contents of your private SSH key (`~/.ssh/id_rsa`).

2. Create a workflow file in your project at `.github/workflows/deploy.yml` with the following configuration:

```yaml
name: Build and Deploy (SCP)

on:
  push:
    branches:
      - main  # Runs when you push to the main branch

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies & Build
        run: |
          npm ci
          npm run build --if-present

      - name: Copy build artifacts to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: "dist/,backend/" # Select only built files and backend source code
          target: "/var/www/ucladn"

      - name: Restart Application on VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/ucladn
            # Example restart command:
            # pm2 restart ucladn || pm2 start backend/server.js --name "ucladn"
```

---

## Option 2: GitHub Actions + Docker Registry (Recommended for Docker Apps)

If you use a Dockerfile, you should build the Docker image in GitHub Actions, push it to the GitHub Container Registry (GHCR), and then pull and run it on your VPS.

### Setup Steps
1. Add these Secrets to GitHub Repository Settings:
   * `VPS_HOST`: VPS public IP.
   * `VPS_USERNAME`: VPS username.
   * `VPS_SSH_KEY`: VPS private SSH key.

2. Create a workflow file in your project at `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy (Docker)

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

      - name: Log in to GitHub Container Registry (GHCR)
        run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin

      - name: Build and Push Docker Image
        run: |
          # Convert username to lowercase to satisfy Docker repository naming requirements
          OWNER=$(echo "${{ github.repository_owner }}" | tr '[:upper:]' '[:lower:]')
          docker build -t ghcr.io/$OWNER/ucladn:latest .
          docker push ghcr.io/$OWNER/ucladn:latest

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
            # Authenticate Docker on the VPS (requires a personal access token with package read permissions)
            echo "${{ secrets.VPS_GH_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            
            # Pull the new image
            OWNER=$(echo "${{ github.repository_owner }}" | tr '[:upper:]' '[:lower:]')
            docker pull ghcr.io/$OWNER/ucladn:latest
            
            # Stop and remove existing container
            docker stop ucladn || true
            docker rm ucladn || true
            
            # Run the new container
            docker run -d --name ucladn -p 80:5000 ghcr.io/$OWNER/ucladn:latest
```

---

## Comparison Summary

| Feature | Option 1: SCP | Option 2: Docker (Recommended) |
| :--- | :--- | :--- |
| **Complexity** | Low (simple file copy) | Medium (requires Docker setup on VPS) |
| **Server Overhead** | Low (files are run directly by Node/Nginx) | Low (Docker runs precompiled image) |
| **Environment Consistency** | Medium (depends on Node version installed on VPS) | High (identical container runs everywhere) |
| **Rollbacks** | Hard (requires rebuilding older commits) | Very Easy (pull older docker image tag) |
