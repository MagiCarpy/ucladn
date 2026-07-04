# UCLA Delivery Network (35L Project)

> Deployed at: www.carpp.net (as of 12/21/2025)

UCLA specific, all-purpose delivery request service. Convenient for students that live on campus, especially apartments, that would like to avoid hours wasted traversing across campus by connecting them with students willing to assist in a variety of delivery services for a quick buck (or other incentive). These requests can include dorm or class specific food delivery, peer-to-peer package delivery, or even more general requests that can be described and then completed by anyone interested in the task.

## Features

- **Real-Time Map Interface**: View active delivery requests on an interactive map of the UCLA campus.
- **Live Tracking**: Track the status of your delivery from "Open" to "Accepted" to "Completed" in real-time.
- **Request Management**:
  - **Requesters**: Create new requests with pickup/dropoff locations and item details.
  - **Helpers**: Browse and accept open requests to help fellow students.
- **Delivery Confirmation**: Photo upload verification for completed deliveries.
- **Responsive Design**: UI that provides pleasant viewing on both desktop and mobile.

## Tech Stack

| Frontend                  | Backend             |
| ------------------------- | ------------------- |
| • React                   | • Node.js & Express |
| • Vite                    | • MySQL             |
| • Tailwind CSS            | • Sequelize         |
| • Leaflet / React-Leaflet | • OpenRouteService  |

## Project Structure

- **`frontend/`**: React application source code.
  - `src/pages/`: Main page components (Map, Login, Profile).
  - `src/components/`: Reusable UI components.
  - `src/context/`: React context for Auth and Toast notifications.
- **`backend/`**: Express server source code.
  - `models/`: Sequelize database models.
  - `controllers/`: Request handling logic.
  - `routes/`: API route definitions.

## Setup

The easiest way to run the application locally is using Docker.

### Prerequisites

- **Docker Desktop** (or Docker Engine + Docker Compose)
- **Git**

### 1. Clone the Repo

```bash
git clone https://github.com/MagiCarpy/35L_Project.git
cd 35L_Project
```

### 2. Environment Configuration

Copy the example environment file and create your own `.env` in the root directory:

```bash
cp .env.example .env
```

_(You will need to register for a free API key at [OpenRouteService](https://openrouteservice.org/) and add it to your `.env` file)._

### 3. Run the Application (Fully Dockerized)

To spin up the entire application (Frontend, Backend API, MySQL, and Redis) in a single command, run:

```bash
docker compose up --build
```

- **Web App**: http://localhost:5000

_Note: The frontend is statically built and served by the Express backend on port 5000 in this production-like environment._

### 4. Local Development Workflow (Writing Code)

If you want to edit code and see changes in real-time (Hot Reloading):

```bash
npm install
npm run dev
```

_(Behind the scenes, `npm run dev` automatically boots up your Docker databases in the background (`npm run predev`) before starting the frontend and backend servers!)_

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## Diagrams

![alt text](https://github.com/MagiCarpy/35L_Project/blob/main/Diagrams/ER_diagram.jpg?raw=true)
![alt text](https://github.com/MagiCarpy/35L_Project/blob/main/Diagrams/ReqDiagram.jpg?raw=true)
![alt text](https://github.com/MagiCarpy/35L_Project/blob/main/Diagrams/ChatStateDiagram.png?raw=true)
![alt text](https://github.com/MagiCarpy/35L_Project/blob/main/Diagrams/loginDiagram.jpg?raw=true)
![alt text](https://github.com/MagiCarpy/35L_Project/blob/main/Diagrams/ChatPollingSequenceDiagram.png?raw=true)
