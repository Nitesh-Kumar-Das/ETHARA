# Team Task Manager (MongoDB Edition)

A premium, production-ready Team Task Manager application with role-based access control and a "Liquid Glass" design system.

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Vanilla CSS + Bun
- **Backend**: FastAPI + Motor (Async MongoDB Driver)
- **Database**: MongoDB
- **Auth**: JWT Authentication (UNIX timestamp compatible)
- **Roles**: ADMIN / TASKER (with real-time role switching)

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) installed
- [Python 3.11+](https://python.org) installed
- [MongoDB](https://www.mongodb.com/try/download/community) running locally

### 1. Environment Configuration
Create a `.env` file in the root directory (one is already provided in this workspace) with the following:
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=taskmanager
SECRET_KEY=your_super_secret_key_here
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Database Seeding (Optional)
To populate the database with test data (Admins, Taskers, Projects, and Tasks):
```bash
python seed_db.py
```
*Note: Default password for all seeded users is `password123`*

### 4. Frontend Setup
```bash
cd frontend
bun install
bun run dev
```

### 5. Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Features
- **JWT Authentication**: Secure signup and login flow.
- **RBAC**: Multi-tenant architecture with ADMIN and TASKER roles.
- **Liquid Glass UI**: Stunning, responsive interface with glassmorphism and smooth animations.
- **Real-time Role Switching**: Switch permissions dynamically without re-logging.
- **Advanced Dashboard**: Clickable stat cards with automatic task filtering.
- **Task Management**: Create, assign, update status, and track overdue tasks.
- **Project Portfolio**: Categorize tasks by project with custom color coding.
- **Notification System**: Functional notification center with "Mark as Read" capability.
