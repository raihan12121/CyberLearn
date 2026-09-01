# A Project Report on
# **CYBERLEARN**
### *A Scalable Hands-on Cybersecurity Learning & Practice Platform*

**Course Code:** CSE 400  
**Course Title:** Software Development Project IV  

---

### **SUBMITTED BY:**

| Name | Student ID | Intake | Section |
| :--- | :--- | :--- | :--- |
| **Muhammad Raihan** | 22235103068 | 51 | 2 |
| **Asif Raihan Rafi** | 22235103281 | 51 | 2 |
| **Ehsanul Haque** | 22235103075 | 51 | 2 |
| **Sadia Noor** | 22235103286 | 51 | 2 |

---

### **SUPERVISED BY:**
**Shampa Banik**  
*Lecturer, Department of Computer Science and Engineering*  
*Bangladesh University of Business and Technology (BUBT)*  

**DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING**  
**BANGLADESH UNIVERSITY OF BUSINESS AND TECHNOLOGY (BUBT)**  
*Mirpur-2, Dhaka-1216, Bangladesh*  
**Date of Submission:** 27th August, 2026  

---

## Abstract

Cybersecurity education today is dominated by two extremes: theory-heavy classroom courses that leave learners unable to perform real security tasks, and steep, unguided Capture-The-Flag (CTF) platforms that assume prior command-line fluency and intimidate absolute beginners. CyberLearn was built to close this gap. It is a full-stack, browser-accessible learning and hands-on practice platform that interleaves structured video/reading lessons with interactive lab sandboxes, wraps the experience in a gamified progress system (XP, streaks, badges, and a global leaderboard), and embeds an AI Cyber Coach that a learner can consult for hints and error explanations without leaving the lesson.

The platform is implemented as a decoupled two-tier web application. The frontend is a Next.js 16 (React 19) application written in TypeScript, styled with Tailwind CSS v4 and managed with the Zustand state store. The backend is a modular FastAPI (Python 3.11+) REST service backed by a SQLAlchemy 2.0 ORM data layer that targets PostgreSQL 16 in production (SQLite as a zero-configuration development fallback). The system exposes twelve functional domains — authentication, users & KYC verification, courses, interactive labs, AI coaching, community discussion, gamified leaderboards, certificates, exams, batch/cohort management, billing/subscriptions, and an administrative command center — through 95 URL paths and 119 HTTP endpoint operations secured with JWT-based authentication, role-based access control (Student, Instructor, Admin), and IP-based sliding-window rate limiting.

This report documents the problem motivating the project, an analysis of existing platforms (TryHackMe, Hack The Box, and PortSwigger Web Security Academy), the chosen Agile/Scrum development model, the system's architecture and database design, the implementation of the front-end and back-end layers, a user manual describing every major screen of the deployed application, and a concluding discussion of the project's limitations and planned future work.

---

## List of Figures

| Sl. No. | Figure Name | Location |
| :--- | :--- | :--- |
| **1** | System Architecture Diagram | Chapter 3 |
| **2** | Use Case Diagram | Chapter 3 |
| **3** | Context Level Diagram (DFD-0) | Chapter 3 |
| **4** | Data Flow Diagram — Level 1 (DFD-1) | Chapter 3 |
| **5** | Entity–Relationship / Database Schema Diagram (20 Tables) | Chapter 3 |
| **6** | Lab Session Lifecycle & HMAC Verification Flowchart | Chapter 3 |
| **7** | Landing Page — Hero, Learning Paths & Interactive Tool Preview | Chapter 5 |
| **8** | Authentication Screens (Login, Signup, OAuth & Email Verification) | Chapter 5 |
| **9** | 4-Step Student Onboarding Flow | Chapter 5 |
| **10** | Student Dashboard with Skill Radar Chart & Progress Metrics | Chapter 5 |
| **11** | Course Catalogue, Syllabus Detail & Interactive Lesson Player | Chapter 5 |
| **12** | Interactive Lab Workspace (Web Proxy, Terminal, SOC Logs, Socratic Hints) | Chapter 5 |
| **13** | Multi-Session AI Cyber Coach with Persona Switcher | Chapter 5 |
| **14** | Industry-Standard Certification Exams Catalogue | Chapter 5 |
| **15** | Global Leaderboard & Community Discussion Forum | Chapter 5 |
| **16** | Admin Command Center — User Governance & System Telemetry | Chapter 5 |

---

## Table of Contents

- [Chapter 1: INTRODUCTION](#chapter-1-introduction)
  - [1.1 Problem Specification](#11-problem-specification)
  - [1.2 Objectives](#12-objectives)
  - [1.3 Scope (In-Scope vs. Out-of-Scope)](#13-scope)
  - [1.4 Organization of Project Report](#14-organization-of-project-report)
- [Chapter 2: BACKGROUND](#chapter-2-background)
  - [2.1 Existing System Analysis](#21-existing-system-analysis)
  - [2.2 Supporting Literatures & Methodologies](#22-supporting-literatures--methodologies)
- [Chapter 3: SYSTEM ANALYSIS & DESIGN](#chapter-3-system-analysis--design)
  - [3.1 Technology & Tools](#31-technology--tools)
  - [3.2 System Models & Diagrams](#32-system-models--diagrams)
    - [3.2.1 Development Model (SDLC — Agile/Scrum)](#321-development-model-sdlc--agilescrum)
    - [3.2.2 Layered System Architecture](#322-layered-system-architecture)
    - [3.2.3 Use Case Diagram](#323-use-case-diagram)
    - [3.2.4 Context Level Diagram (DFD-0)](#324-context-level-diagram-dfd-0)
    - [3.2.5 Data Flow Diagram (DFD-1)](#325-data-flow-diagram-dfd-1)
    - [3.2.6 Relational Database Schema (20 Tables)](#326-relational-database-schema-20-tables)
    - [3.2.7 Lab Lifecycle & HMAC Verification Algorithm](#327-lab-lifecycle--hmac-verification-algorithm)
- [Chapter 4: IMPLEMENTATION](#chapter-4-implementation)
  - [4.1 Frontend Architecture & Component Design](#41-frontend-architecture--component-design)
  - [4.2 Backend Architecture & Modular Routers](#42-backend-architecture--modular-routers)
  - [4.3 Feature Modules Delivered](#43-feature-modules-delivered)
- [Chapter 5: USER MANUAL](#chapter-5-user-manual)
  - [5.1 Hardware & Software Requirements](#51-hardware--software-requirements)
  - [5.2 Live Deployment & Screen Walkthrough](#52-live-deployment--screen-walkthrough)
- [Chapter 6: CONCLUSION & FUTURE WORK](#chapter-6-conclusion--future-work)
  - [6.1 Conclusion](#61-conclusion)
  - [6.2 Limitations](#62-limitations)
  - [6.3 Planned Future Works](#63-planned-future-works)
- [References](#references)
- [Appendix A: Repository, Directory Structure & Test Execution](#appendix-a)

---

## Chapter 1: INTRODUCTION

### 1.1. Problem Specification
Existing cybersecurity education resources exhibit critical limitations that hinder beginner onboarding and practical skill acquisition:
1. **Theory-Heavy Classroom Disconnect**: Traditional academic courses concentrate on slides and multiple-choice quizzes, leaving students unable to operate a Linux terminal, exploit a vulnerable web parameter, or analyze a packet capture.
2. **Steep CTF Learning Curves**: Established Capture-The-Flag (CTF) platforms such as Hack The Box assume the learner already knows how to configure a VPN, use a specialized hacking distribution, and navigate complex shells, leading to high beginner dropout rates.
3. **Setup and Infrastructure Barriers**: Building realistic lab environments traditionally requires local virtual machines, hypervisors, or paid cloud licenses, creating high cost and hardware hurdles.
4. **The "Stuck Alone" Bottleneck**: Independent learners frequently get blocked by syntax errors or conceptual hurdles with no real-time tutor available to provide progressive hints.

CyberLearn addresses these four problems simultaneously: it removes the local-setup barrier by provisioning disposable, interactive practice environments directly in the browser; it bridges the theory-practice gap by interleaving lessons with immediate exercises; it eliminates cost barriers using an open-source architecture; and it solves the isolation problem with an integrated AI Cyber Coach that provides contextual guidance without prematurely leaking flag solutions.

### 1.2. Objectives
The primary objectives of the CyberLearn project are to:
- Provide disposable, browser-based practice environments (Linux CLI, web security tooling, SOC logs, and network graphs) without local software installation.
- Interleave structured reading and video lessons with immediate hands-on challenges.
- Embed an AI Cyber Coach capable of generating contextual Socratic hints and explaining terminal errors in real time.
- Boost student retention through gamified progression: experience points (XP), daily streaks, milestone badges, and global leaderboards.
- Implement timed, anti-cheat monitored certification exams with automatic grading and cryptographically verifiable digital certificates.
- Incorporate a National ID (NID/KYC) identity verification pipeline to ensure the credibility of earned credentials.
- Provide comprehensive role-based access control (Student, Instructor, Admin) for cohort batch management, curriculum authoring, and platform financial auditing.

### 1.3. Scope
#### In-Scope (Implemented & Delivered)
- Secure authentication (email/password, Google & GitHub OAuth, email verification, password reset) with RBAC (Student, Instructor, Admin).
- 20-table normalized relational schema backed by PostgreSQL/SQLite with automated multi-dialect migrations.
- Structured course catalogue with video, reading, and quiz lesson types, featuring per-lesson/per-course progress tracking.
- Interactive lab workspace equipped with Web Security Proxy Inspector, Network Topology Graph, SOC Log Workbench, and Socratic Hint Drawer.
- Cryptographic HMAC-SHA256 dynamic flag generation and server-side verification.
- Multi-session AI Cyber Coach (Jarvis) with topic isolation and persona switcher (SOC Analyst, Web Pentester, Exam Mentor).
- Timed certification exams featuring anti-cheat monitoring (fullscreen lock, tab-blur tracking) and 70% passing thresholds.
- Publicly verifiable digital certificates (`/verify/[token]`) with SHA-256 integrity tokens.
- Government National ID (NID/Passport) verification upload and administrative review queue.
- Instructor cohort batches with unique join codes (`CYBER-XXXXXX`), schedules, and enrollment rosters.
- Community discussion forum with threaded replies, tagging, upvoting, and solution marking.
- Complete administrative command center for user governance, curriculum management, and financial reporting.
- Billing module supporting tiered subscriptions (Free / Pro / Premium) and one-time course purchases.

#### Out-of-Scope (Reserved for Future Work)
- Real-time multiplayer attack-defense CTF arenas.
- On-premise local LLM inference engines (currently utilizes hosted Google Gemini / OpenAI APIs).
- Native mobile application.

### 1.4. Organization of Project Report
The remainder of this report is organized as follows:
- **Chapter 2 (Background)** reviews existing cybersecurity learning platforms and supporting literature.
- **Chapter 3 (System Analysis & Design)** presents the SDLC model, system architecture, use case, DFD-0, DFD-1, ERD (20 tables), and lab lifecycle algorithm.
- **Chapter 4 (Implementation)** details the frontend component hierarchy, backend router modularization, and core delivered features.
- **Chapter 5 (User Manual)** provides system requirements, deployment details, and an annotated walkthrough of all application screens.
- **Chapter 6 (Conclusion)** summarizes project outcomes, technical achievements, limitations, and future work.
- **References & Appendix A** document citations, repository links, directory structure, and automated test execution.

---

## Chapter 2: BACKGROUND

### 2.1. Existing System Analysis
Three leading cybersecurity platforms were analyzed to identify market gaps:

- **A. TryHackMe**: Offers beginner-friendly room-based labs and gamified streaks. However, subscription costs are high for developing economies, and it lacks an adaptive AI tutor for personalized debugging.
- **B. Hack The Box (HTB)**: Excellent advanced penetration testing labs, but has a steep learning curve requiring manual OpenVPN configuration and advanced command-line mastery from day one.
- **C. PortSwigger Web Security Academy**: Outstanding in-depth web vulnerability labs, but lacks general Linux command-line practice, networking exercises, forensics, and cohort batch management.

**Identified Gap**: No single low-cost platform seamlessly integrates multi-domain curricula (Linux, networking, web security, SOC defense), interactive browser tools, cohort-based instructor batching, and an intelligent AI coach into a unified web interface.

### 2.2. Supporting Literatures & Methodologies
- **Client–Server & REST Architecture**: Stateless REST API separating presentation (Next.js) from persistence (FastAPI + PostgreSQL).
- **Relational Database Normalization**: Standard 3NF entity-relationship modeling enforcing referential integrity, foreign key cascades, and unique constraints.
- **Stateless Authentication (RFC 7519)**: JSON Web Tokens (JWT) signed with HS256 for scalable session handling.
- **Cryptographic Flag Verification**: HMAC-SHA256 keyed-hash algorithm ensuring flags are derived deterministically at runtime without plaintext database storage.
- **Agile/Scrum Delivery**: Iterative 2-week sprint cycles mitigating integration risks across decoupled frontend and backend layers.

---

## Chapter 3: SYSTEM ANALYSIS & DESIGN

### 3.1. Technology & Tools

| Layer / Concern | Technology Stack |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.2.9 (App Router) with React 19, TypeScript 5 |
| **Styling & Theme** | Tailwind CSS v4, Custom NetAcad Design Tokens (Dark-First) |
| **Frontend State Management** | Zustand 5 |
| **Forms & Validation** | React Hook Form 7 + Zod 4 |
| **Animation & Icons** | Framer Motion 12, Lucide React |
| **Interactive Lab Tools** | WebProxyInspector, NetworkTopologyGraph, SocLogWorkbench, SocraticHintDrawer |
| **Backend Framework** | FastAPI (Python 3.11+), Uvicorn ASGI Server |
| **ORM / Data Layer** | SQLAlchemy 2.0 |
| **Database (Production)** | PostgreSQL 16 |
| **Database (Development)** | SQLite (Zero-configuration local development with auto-migrations) |
| **Authentication & Security** | PyJWT (HS256 tokens), Passlib (Bcrypt), Firebase SDK / OAuth 2.0 |
| **Rate Limiting** | Custom In-Memory Sliding-Window ASGI Middleware |
| **AI LLM Provider** | Google Gemini API (Gemini 3.5 Flash / Pro) & OpenAI API |
| **Email Delivery** | Brevo (Sendinblue) API & SMTP Fallback |
| **Deployment / Hosting** | Vercel (Frontend Edge) + Render / Docker Host (Backend API) |
| **Version Control** | Git & GitHub |

---

### 3.2. System Models & Diagrams

#### 3.2.1. Development Model (SDLC — Agile/Scrum)
Development followed the Iterative and Incremental Agile/Scrum framework across four 2-week sprints:
- **Sprint 1 (Core Foundation)**: Database schema setup, JWT authentication, Google/GitHub OAuth, and Course Catalogue API.
- **Sprint 2 (Interactive Lab Engine)**: Web Security Proxy Inspector, SOC Log Workbench, Network Topology Graph, and HMAC-SHA256 flag verification.
- **Sprint 3 (Gamification, AI & Exams)**: Multi-session AI Cyber Coach, XP/streak system, 20-25 MCQ exam banks, anti-cheat engine, and certificate generation.
- **Sprint 4 (Governance, Batches & Billing)**: Instructor cohort management, KYC National ID review queue, billing module, and admin command center.

#### 3.2.2. System Architecture
The platform is organized into three decoupled layers:
1. **Presentation Layer**: Client browser loading the Next.js 16 App Router interface via Vercel Edge CDN.
2. **Application Service Layer**: FastAPI backend with 12 modular routers, JWT/RBAC middleware, and sliding-window rate limiting.
3. **Persistence & External Services Layer**: PostgreSQL/SQLite database, Google Gemini LLM API, and Brevo transactional email services.

#### 3.2.3. Use Case Diagram
Three human actors (Student, Instructor, Admin) and one external system actor (AI Service) interact with the system:
- **Student**: Register/login, browse courses, watch video lessons, complete quizzes, launch labs, submit flags, consult AI Coach, take timed exams, upload NID, earn certificates, and join batches.
- **Instructor**: Create cohort batches, monitor student rosters, track course completions, and schedule live sessions.
- **Admin**: Full platform governance, user role modification, KYC review/approval, course/exam authoring, and revenue reporting.
- **AI Service**: Receives prompt contexts and generates Socratic guidance and error explanations.

#### 3.2.4. Context Level Diagram (DFD-0)
Treats CyberLearn as a central process exchanging data with external entities: Student, Instructor, Admin, AI Provider (Gemini/OpenAI), OAuth Provider (Google/GitHub), and Email Provider (Brevo).

#### 3.2.5. Data Flow Diagram (DFD-1)
Decomposes the system into functional sub-processes: Auth & Profile (P1), Course Delivery (P2), Lab Orchestration (P3), AI Coach (P4), Exams & Certification (P5), and Gamification/Leaderboards (P6), mapping inputs/outputs to internal database stores.

#### 3.2.6. Database Schema (20 Tables)
The database comprises **20 normalized tables** in SQLAlchemy 2.0:

| Table Name | Description | Key Fields & Constraints |
| :--- | :--- | :--- |
| `users` | User credentials, roles, XP, streak, KYC, and subscription tier | `id`, `email`, `role`, `xp`, `streak_days`, `verification_status`, `subscription_tier` |
| `courses` | Learning tracks and curriculum metadata | `id`, `title`, `difficulty`, `category`, `price`, `is_published` |
| `lessons` | Ordered syllabus content (video, reading, quiz) | `id`, `course_id`, `content_type`, `video_url`, `sort_order` |
| `labs` | Hands-on challenge specifications and XP rewards | `id`, `title`, `type`, `difficulty`, `xp_reward`, `container_template` |
| `lab_sessions` | Active lab timer, container IDs, and completion state | `id`, `user_id`, `lab_id`, `status`, `started_at`, `expires_at` |
| `progress` | Per-user, per-lesson completion tracking | `user_id`, `course_id`, `lesson_id`, `status`, Unique(`user_id`, `course_id`, `lesson_id`) |
| `achievements` | Unlocked milestone badges | `id`, `user_id`, `badge_name`, `earned_at` |
| `batches` | Instructor cohorts with schedules and seat limits | `id`, `batch_code`, `instructor_id`, `course_id`, `max_students` |
| `batch_enrollments` | Cohort student registration records | `batch_id`, `user_id`, `status`, Unique(`batch_id`, `user_id`) |
| `ai_sessions` | Multi-session AI coach chat threads | `id`, `user_id`, `title`, `system_prompt`, `model_type` |
| `ai_chat_messages` | Individual prompt/response history | `id`, `session_id`, `role`, `content`, `created_at` |
| `exams` | Standardized certification assessments | `id`, `course_id`, `title`, `duration_minutes`, `passing_score_pct` |
| `exam_questions` | Scenario-based multiple-choice question bank | `id`, `exam_id`, `question_text`, `options`, `correct_answer`, `points` |
| `exam_submissions` | Anti-cheat graded student attempts | `id`, `exam_id`, `user_id`, `score_pct`, `passed`, `submitted_at` |
| `certificates` | Publicly verifiable credentials with cryptographic tokens | `id`, `user_id`, `course_id`, `exam_id`, `verification_token`, `issued_at` |
| `posts` | Community forum discussion threads | `id`, `user_id`, `title`, `content`, `category`, `tags`, `is_solved`, `upvotes` |
| `comments` | Threaded replies and accepted solutions | `id`, `post_id`, `user_id`, `content`, `is_solution` |
| `post_votes` | Upvote tracking and idempotency | `id`, `user_id`, `post_id`, Unique(`user_id`, `post_id`) |
| `invoices` | Financial transaction audit ledger | `id`, `invoice_number`, `user_id`, `purchase_type`, `total_paid`, `status` |
| `course_purchases` | Lifetime individual course entitlements | `id`, `user_id`, `course_id`, `amount_paid`, Unique(`user_id`, `course_id`) |

#### 3.2.7. Lab Lifecycle & HMAC Verification Algorithm
Lab challenge flags are cryptographically generated at runtime using HMAC-SHA256, ensuring flags are never stored in plaintext in the database:

```python
def generate_lab_flag(lab_id: str) -> str:
    signature = hmac.new(
        settings.FLAG_SECRET.encode("utf-8"),
        lab_id.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()[:16]
    return f"FLAG{{{signature}}}"
```

---

## Chapter 4: IMPLEMENTATION

### 4.1. Interface Design / Front-End
The frontend is built on **Next.js 16 (App Router)** with **TypeScript**, **Tailwind CSS v4**, and **Zustand**.

#### Primary Routes Implemented

| Route | Purpose |
| :--- | :--- |
| `/` (Landing) | Public marketing landing page with interactive tool previews and learning paths. |
| `/(auth)/login`, `/(auth)/signup` | Authentication screens with email/password and OAuth (Google/GitHub) entry points. |
| `/(app)/dashboard` | Personalized student dashboard — cyber readiness score, skill radar, and streak tracker. |
| `/(app)/courses`, `/courses/[courseId]` | Course catalogue and interactive lesson player with video syllabus and quizzes. |
| `/(app)/labs`, `/labs/[labId]` | Lab workspace (terminal emulator, Web Proxy, SOC logs, Socratic hints). |
| `/(app)/challenges` | Standalone CTF-style challenge browser with difficulty filters. |
| `/(app)/ai-coach` | Full-page AI Cyber Coach chat interface with multi-session history. |
| `/(app)/exams`, `/exams/[examId]` | Timed certification exam listing and anti-cheat monitored attempt flow. |
| `/(app)/verify-nid` | Government National ID (NID/Passport) identity verification upload portal. |
| `/(app)/certificates` | Student's earned certificates with download, share, and QR actions. |
| `/(app)/leaderboard` | Global XP ranking with podium view and weekly/monthly filters. |
| `/(app)/community`, `/community/[postId]` | Discussion feed, threaded comments, and solved/unsolved toggle. |
| `/(app)/batches`, `/batches/[batchCode]` | Instructor cohort management and batch detail/roster view. |
| `/(app)/pricing`, `/(app)/checkout` | Subscription plan comparison and checkout/payment flow. |
| `/(app)/profile`, `/(app)/settings` | Account profile editing and application preferences. |
| `/(app)/admin` | Administrative control center for users, KYC, courses, labs, and revenue. |
| `/portfolio/[username]` | Public learner portfolio showcasing verified certificates and writeups. |
| `/verify/[token]` | Standalone public certificate authenticity verification portal. |

#### Key Reusable Frontend Modules

| Module Path | Key Components & Contents |
| :--- | :--- |
| `components/layout/` | `Sidebar`, `TopNav`, `AppLayout` — persistent responsive navigation shell. |
| `components/ui/` | `Button`, `Card`, `Input`, `Badge`, `Avatar`, `ProgressBar`, `ThemeToggle`. |
| `components/labs/` | `WebProxyInspector`, `NetworkTopologyGraph`, `SocLogWorkbench`, `SocraticHintDrawer`. |
| `components/dashboard/`| `SkillRadarChart` — 6-axis visual cybersecurity readiness summary. |
| `components/subscription/`| `SubscriptionBanner`, `SubscriptionPaywallModal` — tier-gating UI. |
| `OnboardingModal.tsx` | First-login guided setup (username, focus track, experience level). |
| `lib/authStore.ts` | Zustand store managing JWT token, user profile, and auth actions. |
| `lib/api.ts` | Typed fetch wrapper for backend REST endpoints with auth headers. |

---

### 4.2. Back-End Architecture & Routers
The backend is a high-performance **FastAPI** application organized into **12 decoupled domain routers** mounted in `main.py`:

| Router Module | Prefix | Core Responsibilities |
| :--- | :--- | :--- |
| `auth` | `/auth` | Registration, email verification, login, logout, OAuth exchange, username checks. |
| `users` | `/users` | Profile CRUD, avatar upload, password updates, public profiles, NID submission. |
| `courses` | `/courses` | Course catalog, lesson delivery, progress tracking, quiz submissions. |
| `labs` | `/labs` | Lab catalog, session start/reset/submit, HMAC flag issuance, hint unlocks, Web Proxy forwarder. |
| `ai` | `/ai` | AI Coach chat, multi-session CRUD, and conversation history. |
| `exams` | `/exams` | Exam listings, question bank delivery, anti-cheat timed submissions, auto-scoring. |
| `certificates`| `/certificates` | Certificate listing, generation, and public verification token validation. |
| `leaderboard` | `/leaderboard` | Global XP rankings and user position calculation. |
| `community` | `/community` | Post CRUD, threaded comments, upvoting, and solved/unsolved status. |
| `batches` | `/batches` | Cohort creation, join-by-code (`CYBER-XXXXXX`), and roster tracking. |
| `billing` | `/billing` | Promo code validation, payment processing, invoice generation, subscription management. |
| `admin` | `/admin` | Full administrative CRUD over users, KYC verifications, courses, exams, labs, and revenue telemetry. |

---

## Chapter 5: USER MANUAL

### 5.1. System Requirements

#### Client (End User)
- **CPU**: Dual-core 1.6 GHz+ processor.
- **RAM**: 4 GB minimum (8 GB recommended for smooth multi-tab lab work).
- **OS & Browser**: Windows 10/11, macOS 12+, Linux, Android, or iOS running Google Chrome, Microsoft Edge, or Mozilla Firefox.

#### Server (Deployment Host)
- **Host OS**: Ubuntu 22.04 LTS.
- **Runtimes**: Python 3.11+, Node.js 18+, Docker Engine 24+ & Docker Compose v2.
- **Database**: PostgreSQL 16 (production) / SQLite (local dev).

---

### 5.2. Live Deployment & Credentials

| Parameter | Value |
| :--- | :--- |
| **Live Web Application URL** | [https://cyber-learn-three.vercel.app](https://cyber-learn-three.vercel.app) |
| **Source Code Repository** | [https://github.com/raihan12121/CyberLearn](https://github.com/raihan12121/CyberLearn) |
| **API Documentation (Swagger)** | Available at `/docs` on backend host |
| **Demo Admin Login** | `admin@cyberlearn.io` / `admin123` |
| **Demo Student Login** | `learner@cyberlearn.io` / `learner123` |

---

## Chapter 6: CONCLUSION & FUTURE WORK

### 6.1. Conclusion
CyberLearn delivers a complete, production-grade cybersecurity learning ecosystem that bridges classroom theory and hands-on operational practice. The project successfully demonstrates full-stack software engineering principles: Next.js 16 App Router, FastAPI modular architecture, 20-table normalized database modeling, cryptographic flag verification, anti-cheat assessment engines, and KYC credential issuance.

### 6.2. Limitations
- **External LLM Metering**: Relies on external hosted APIs (Google Gemini / OpenAI); extreme scale incurs per-token metered costs.
- **Sandbox Egress Restrictions**: Practice labs intentionally block outbound internet traffic to prevent sandbox abuse, preventing external package installations inside running labs.

### 6.3. Planned Future Works
- **Multiplayer Attack-Defense CTF Arenas**: Real-time team-versus-team capture-the-flag competitions with live attack graph visualization.
- **On-Premise Open-Weight LLMs**: Local inference engines (e.g., DeepSeek / Llama 3) hosted on institutional servers to eliminate external API costs.
- **Kubernetes Pod Orchestration**: Dynamic multi-node clustering for scaling concurrent container sandboxes to tens of thousands of active learners.
- **Native Mobile Application**: Dedicated iOS/Android app extending responsive web features with offline reading and flashcards.

---

## References

1. **TryHackMe Ltd.** "Interactive Cybersecurity Training." TryHackMe, 2024. [https://tryhackme.com](https://tryhackme.com)
2. **Hack The Box.** "Gamified Cybersecurity Practice Labs." Hack The Box, 2024. [https://www.hackthebox.com](https://www.hackthebox.com)
3. **PortSwigger Ltd.** "Web Security Academy." 2024. [https://portswigger.net/web-security](https://portswigger.net/web-security)
4. **OWASP Foundation.** "OWASP Top 10 Web Application Security Risks." 2021. [https://owasp.org](https://owasp.org)
5. **FastAPI.** "FastAPI Framework Documentation." Tiangolo, 2024. [https://fastapi.tiangolo.com](https://fastapi.tiangolo.com)
6. **SQLAlchemy.** "SQLAlchemy 2.0 Documentation." 2024. [https://docs.sqlalchemy.org](https://docs.sqlalchemy.org)
7. **Next.js & React.** "Next.js 16 App Router Reference." Vercel, 2024. [https://nextjs.org/docs](https://nextjs.org/docs)
8. **IETF.** "RFC 7519: JSON Web Token (JWT)." Internet Engineering Task Force, 2015.

---

## Appendix A

### A.1 Selected Directory Structure
```text
CyberLearn/
├── backend/
│   ├── app/
│   │   ├── admin/             # Admin control center (telemetry, users, revenue)
│   │   ├── ai/                # Multi-session AI Cyber Coach
│   │   ├── auth/              # JWT lifecycle, OAuth handlers, rate limiter
│   │   ├── batches/           # Instructor cohort management
│   │   ├── billing/           # Invoices, subscriptions, promo codes
│   │   ├── certificates/      # Certificate minting & public validator
│   │   ├── community/         # Forums, replies, upvotes
│   │   ├── courses/           # Video/reading syllabus & lesson progress
│   │   ├── exams/             # 20-25 MCQ banks & anti-cheat engine
│   │   ├── labs/              # Web Proxy, SOC logs, HMAC flag engine
│   │   ├── users/             # Profile, KYC NID upload, achievements
│   │   ├── database.py        # SQLAlchemy engine & auto-migrations
│   │   ├── models.py          # 20 SQLAlchemy relational ORM models
│   │   ├── schemas.py         # Pydantic validation schemas
│   │   └── main.py            # FastAPI application & router mounting
│   ├── requirements.txt
│   └── test_*.py              # Comprehensive Pytest test suites
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (app)/         # Authenticated portal (dashboard, courses, labs, admin)
│   │   │   ├── (auth)/        # Auth screens (/login, /signup)
│   │   │   ├── portfolio/     # Public student profile portfolio (/portfolio/[username])
│   │   │   └── verify/        # Standalone public certificate verifier (/verify/[token])
│   │   ├── components/        # WebProxy, TopologyGraph, SocLog, UI library
│   │   ├── lib/               # Zustand auth store, API client, Firebase SDK
│   │   └── types/             # TypeScript definitions
│   └── package.json
├── docker-compose.yml         # Containerized local environment
├── README.md
└── PRD.md / TRD.md            # Requirement specifications
```

### A.2 Automated Test Suite Execution
```bash
# Execute Backend Pytest Suite (17 Tests Passing)
cd backend
pytest -v

# Execute Admin Governance & KYC Verification Tests
python test_admin_control_panel.py
python test_id_verification_and_20_mcqs.py
python test_tasks_1_2_3.py
```
