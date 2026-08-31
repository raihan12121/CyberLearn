# CyberLearn 🛡️
### Next-Generation Hands-On Cybersecurity Learning & Certification Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite/PostgreSQL](https://img.shields.io/badge/Database-SQLAlchemy-4479A1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.sqlalchemy.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**CyberLearn** is a comprehensive, production-ready cybersecurity education platform built to bridge the gap between theoretical knowledge and practical security operations. Inspired by the Cisco Networking Academy (NetAcad) design system, CyberLearn combines structured video curriculum, interactive web security tools, formal certification examinations, government ID verification, AI-driven tutoring, and gamified engagement into a unified browser experience.

---

## 🌟 Core Features & Modules

### 1. 📚 Course Curriculum & Video Syllabus
- **28+ Curated Security Tracks:** Web Application Security, Network Defense, Linux Administration, Cryptography, Digital Forensics, and DevSecOps.
- **Rich Lesson Modules:** Embedded video lectures, structured lecture notes, reading assignments, and module completion tracking.
- **Interactive Quizzes:** End-of-module formative assessments with real-time feedback and XP rewards.

### 2. 🔬 Interactive Practice Labs & Tooling
- **Web Security Proxy Inspector:** In-browser HTTP request interceptor, header tamper engine, and SQLi/XSS payload repeater.
- **Attack & Defense Topology Graph:** Interactive visual network graph displaying subnet nodes, discovered open ports, and pivot paths.
- **SOC Log Workbench:** SIEM incident response workstation for querying auth failures, firewall drops, and web attack logs.
- **Socratic Hint Drawer:** Multi-tiered guidance system providing progressive clues in exchange for XP without spoiling flag solutions.
- **HMAC Dynamic Flag Verification:** Cryptographically generated HMAC-SHA256 flags verified via secure backend endpoints.

### 3. 🎓 Certification Exam Engine & Anti-Cheat
- **5 Professional Certification Tracks:**
  - *WASCS:* Web Application Security Certified Specialist
  - *CCNA-SEC:* Cisco CCNA Security & Network Defense
  - *SECPLUS:* CompTIA Security+ (SY0-701) Prep
  - *CEH-ASSOC:* Certified Ethical Hacker Associate
  - *LINUX-SYS:* Linux Security & Systems Administration
- **Rigorous Question Banks:** 20–25 comprehensive scenario-based multiple-choice questions per exam.
- **Anti-Cheat Monitoring:** Fullscreen enforcement, tab-switch detection, automated timer countdowns, and immediate disqualification on policy violations.
- **70% Passing Threshold:** Enforces real mastery before issuing signed digital credentials.

### 4. 🪪 Government National ID (KYC) Verification
- **Recruiter-Grade Credential Integrity:** Mandatory ID verification workflow required before minting public course certificates.
- **Document Upload:** Secure upload of Government NID / Passport front and back document scans.
- **Administrative Review Queue:** Real-time admin review dashboard to inspect and approve or reject submissions with custom notes.
- **Retroactive Minting:** Once approved, all previously held certificate tokens are automatically minted.

### 5. 🤖 Multi-Session AI Cyber Coach (Jarvis)
- **Multi-Session Isolation:** Organize distinct chat sessions by topic (e.g. *OWASP Top 10*, *Buffer Overflows*, *Career Advice*).
- **Specialized Personas:** Switch between Offensive Red Teamer, Blue Team SOC Analyst, and Exam Mentor.
- **Context-Aware Responses:** Markdown code blocks, remediation recommendations, and Socratic hints.

### 6. 👥 Live Learning Batches & Cohorts
- **Instructor-Led Cohorts:** Join structured classes using shareable invite codes (`CYBER-XXXXXX`).
- **Schedules & Roster:** View live session schedules, assigned mentors, and batch progress.
- **Admin Cohort Controls:** Create batches, cap seat limits, enroll learners, and manage enrollment rosters.

### 7. 🛡️ Comprehensive Admin Command Center
- **Telemetry & Health:** Real-time platform metrics, active learner sessions, and service latency monitors.
- **User Governance:** Search, filter, edit roles (Student, Instructor, Admin), adjust XP, or delete accounts with cascading cleanup.
- **Curriculum Builder:** Create courses, organize modules, add lessons, and set pricing.
- **Exam Management:** Author questions, set pass marks, and configure certification requirements.
- **Certificate Registry:** View all minted certificates, download PDFs, or revoke credentials.
- **Financial Auditing:** Revenue analytics, invoice ledger, discount code generator, and subscription analytics.

### 8. 🏆 Gamification, Leaderboards & Portfolios
- **Quantifiable XP & Streaks:** Earn XP on quizzes, lab flags, and exams to unlock level milestones.
- **Global Leaderboard:** Filter rankings by All Time, Monthly, or Weekly activity.
- **Public Cybersecurity Portfolios:** Shareable profile pages (`/portfolio/[username]`) showcasing completed labs, certifications, and writeups.
- **Cryptographic Certificate Verification:** Public validator (`/verify/[token]`) verifying certificate authenticity with SHA-256 signatures.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 16 (Turbopack)](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/), [Zustand](https://zustand-demo.pmnd.rs/) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+), [Uvicorn](https://www.uvicorn.org/), [Pydantic v2](https://docs.pydantic.dev/), [SQLAlchemy](https://www.sqlalchemy.org/) |
| **Database** | SQLite (zero-config local development) / PostgreSQL (production) |
| **Auth & Security** | Firebase Authentication, Google OAuth 2.0, Passlib (Bcrypt), PyJWT (HS256 tokens) |
| **Email & Comms** | Brevo (Sendinblue) API & SMTP Fallback for verification emails |
| **Testing** | Pytest, FastAPI TestClient, AnyIO, TypeScript Compiler (`tsc`) |

---

## 📁 Repository Structure

```text
CyberLearn/
├── backend/
│   ├── app/
│   │   ├── admin/             # Admin control center endpoints (users, metrics, courses, financials)
│   │   ├── ai/                # Multi-session AI Cyber Coach (Jarvis) & prompts
│   │   ├── auth/              # JWT token lifecycle, OAuth handlers, dependencies
│   │   ├── batches/           # Cohort batches, scheduling, enrollment
│   │   ├── billing/           # Subscriptions, invoices, promo discounts, checkout
│   │   ├── certificates/      # Certificate issuance, PDF generators, public validation
│   │   ├── community/         # Community forums, problem threads, replies, upvotes
│   │   ├── courses/           # Course curriculum, lesson progress, syllabus
│   │   ├── exams/             # 20-25 MCQ question banks, anti-cheat grading engine
│   │   ├── labs/              # Practice lab catalog, Web Proxy, HMAC flags, hints
│   │   ├── users/             # User profile, KYC National ID uploads, achievements
│   │   ├── config.py          # App settings and environment validation
│   │   ├── database.py        # SQLAlchemy engine and session management
│   │   ├── main.py            # FastAPI entrypoint, CORS middleware, route mounting
│   │   ├── models.py          # SQLAlchemy ORM database models
│   │   ├── schemas.py         # Pydantic validation schemas
│   │   └── seed_data.py       # Production-ready courses, questions, and lab fixtures
│   ├── requirements.txt       # Python dependencies
│   └── test_*.py              # Comprehensive Pytest suites
│
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router (pages & dynamic routes)
│   │   │   ├── (app)/         # Authenticated portal (dashboard, courses, labs, exams, batches, admin)
│   │   │   ├── (auth)/        # Authentication (login, signup, password reset)
│   │   │   ├── portfolio/     # Public student cyber portfolios (/portfolio/[username])
│   │   │   ├── verify/        # Public certificate verification portal (/verify/[token])
│   │   │   ├── page.tsx       # Marketing landing page with Web Proxy interactive preview
│   │   │   └── globals.css    # NetAcad design system tokens & theme variables
│   │   ├── components/        # Reusable React components (UI library, modals, layout)
│   │   │   ├── labs/          # WebProxyInspector, NetworkTopologyGraph, SocLogWorkbench
│   │   │   ├── layout/        # Sidebar, TopNav, AppLayout
│   │   │   └── ui/            # Button, Card, Badge, Modal, ProgressBar, ThemeToggle
│   │   ├── lib/               # API clients, Zustand auth store, Firebase SDK, utilities
│   │   └── types/             # Shared TypeScript interfaces
│   └── package.json           # Frontend dependencies and Next.js scripts
│
├── test_admin_control_panel.py # Admin integration test suite
├── test_id_verification_and_20_mcqs.py # Exam & KYC test suite
├── test_tasks_1_2_3.py        # Community & certification integration tests
└── README.md                  # Project documentation
```

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** & **npm** installed
- **Git** installed

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/raihan12121/CyberLearn.git
cd CyberLearn
```

---

### Step 2: Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (`backend/.env`):
   ```env
   SECRET_KEY=your-super-secret-jwt-key-minimum-32-chars-long
   FLAG_SECRET=your-ctf-hmac-sha256-secret-key
   DATABASE_URL=sqlite:///./cyberlearn.db
   ENVIRONMENT=development
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

5. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   > 📖 **API Docs:** Interactive Swagger UI is available at `http://127.0.0.1:8000/docs`.

---

### Step 3: Frontend Setup (Next.js)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## 🧪 Testing & Verification

The platform comes equipped with extensive automated test suites covering backend unit logic, security constraints, role-based access control, exam threshold evaluations, and KYC verification lifecycles.

### Run Pytest Suite (Backend)
```bash
cd backend
pytest -v
```

### Run Root Regression Test Suites
```bash
# Verify Admin Control Center (10 tests)
python test_admin_control_panel.py

# Verify KYC ID Verification & 20-25 MCQ Exam Engine
python test_id_verification_and_20_mcqs.py

# Verify Community Forum & Certificate Minting
python test_tasks_1_2_3.py
```

### Run Frontend Type Check & Production Build
```bash
cd frontend
npm run build
```

---

## 🔒 Security & Best Practices

- **Zero-Trust Access Control:** Protected API endpoints enforce role dependencies (`student`, `instructor`, `admin`) and subscription entitlements.
- **SQL Injection Prevention:** All database operations strictly utilize SQLAlchemy ORM parameterized statements.
- **HMAC Flag Signing:** Lab challenge flags are generated dynamically at runtime using HMAC-SHA256 with server-side secrets.
- **Anti-Tampering:** Certificate tokens are cryptographically generated with SHA-256 hashes verifying student identity, course, score, and timestamp.
- **CORS Protection:** Configurable whitelist restricting browser access to trusted frontend origins.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author & Contributions

Created and maintained by [Muhammad Raihan](https://github.com/raihan12121).  
Contributions, issue reports, and feature suggestions are always welcome via GitHub Issues and Pull Requests!
