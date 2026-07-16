# CyberLearn: Scalable Hands-on Cybersecurity Learning Platform

CyberLearn is a modern, gamified, browser-accessible learning and hands-on practice platform designed to teach practical cybersecurity concepts through disposable, isolated sandbox environments.

---

## Key Features

- **Isolated Sandbox Environments:** One-click disposable Docker container topologies (Linux CLI, web targets) provisioned in seconds.
- **Interactive Labs & Flag Submissions:** In-browser terminal emulator executing commands in sandbox containers with automated flag validation.
- **AI Cyber Coach:** Real-time feedback, hint generation, and command-error analysis.
- **Structured Academy Paths:** Complete modules and lessons guiding users from security fundamentals to advanced concepts.
- **Gamified Engagement:** Progress dashboard tracks XP, badges, active courses, streaks, and global leaderboards.
- **Verified Certificates:** Public certificate URLs generated automatically upon course completion.

---

## Directory Structure

```text
CyberLearn/
├── backend/                  # FastAPI Application Layer
│   ├── app/                  # Router logic, schemas, and db models
│   ├── test_api_endpoints.py # Integration test suite for backend API
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js Web App
│   ├── src/                  # React components, pages, hooks, state
│   └── package.json          # Node dependencies
├── docker/                   # Docker network and orchestration resources
├── docker-compose.yml        # Multi-container local orchestration configuration
├── PRD.md                    # Product Requirements Document
├── TRD.md                    # Technical Requirements Document
├── DesignDescription.md      # UI/UX Specification Document
└── ProjectProposal.md        # Academic Proposal (BUBT Department of CSE)
```

---

## Tech Stack

- **Frontend:** Next.js (React), TailwindCSS, TypeScript, Zustand, Lucide Icons, Framer Motion
- **Backend:** FastAPI (Python), SQLAlchemy, SQLite (Development fallback) / PostgreSQL
- **Orchestration:** Docker, Docker Compose
- **Cache / Session:** Redis

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed.
- [Node.js](https://nodejs.org/) (v18+) and [Python 3.11](https://www.python.org/) installed for standalone development.

### Running with Docker Compose (Recommended)

To run the entire stack (relational database, caching, search engine, backend API, and frontend web client) in a single command:

1. Clone or copy the project files to your directory.
2. Run the compose environment:
   ```bash
   docker compose up --build
   ```
3. Open [http://localhost:3000](http://localhost:3000) to access the frontend dashboard.
4. The backend OpenAPI docs are available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## Individual Service Development Setup

### Backend API Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # On Windows (PowerShell):
   .\.venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Next.js Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser to [http://localhost:3000](http://localhost:3000).
