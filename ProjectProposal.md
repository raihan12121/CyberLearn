# BANGLADESH UNIVERSITY OF BUSINESS AND TECHNOLOGY (BUBT)

**DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING (CSE)**

---

## PROJECT PROPOSAL
### On
## CyberLearn: A Scalable Hands-on Cybersecurity Learning & Practice Platform

**Submission Date:** July 12, 2026

---

### **Submitted By:**
* **Name:** Muhammad Raihan  
* **ID:** [Your Student ID]  
* **Intake / Section:** [Your Intake / Section]  

### **Submitted To:**
* **Shampa Banik**  
* Lecturer, Dept. of CSE  
* Bangladesh University of Business and Technology (BUBT)

---

## 1. Needs / Problems

Existing cybersecurity education frameworks exhibit critical limitations that hinder beginner onboarding and practical skill acquisition:
* **Overly Theoretical Training:** Traditional classroom courses focus on lecture slides, leaving students unprepared for actual security operations.
* **Intimidating Beginner Onboarding:** Existing Capture-The-Flag (CTF) websites assume pre-existing CLI skills, creating high cognitive load and causing beginners to abandon the field early.
* **High Infrastructure Costs & Administrative Overhead:** Building lab topologies usually requires complex VM management, local system hypervisors, or expensive commercial licenses.
* **Lack of Real-Time Assistance:** Students practicing alone frequently get stuck on configuration syntax or logical hurdles without an instructor or personalized guide to assist them.

---

## 2. Goals / Objectives

The primary objective of **CyberLearn** is to deliver a low-barrier, browser-accessible, hands-on learning platform that bridges the gap between theoretical knowledge and practice:
* **Disposable Sandbox Environments:** Provide users with containerized, fully isolated virtual environments (Linux CLI, web targets) provisioned in seconds.
* **Theory-to-Practice Integration:** Interleave reading materials and tutorial videos with immediate interactive lab challenges.
* **AI-Guided Tutoring:** Embed an **AI Cyber Coach** capable of providing dynamically adjusted hints and explaining errors.
* **Gamified Progression:** Increase retention rates by awarding XP, badges, public certificate verification URLs, and global streaks.

---

## 3. Existing System Analysis

We analyzed three popular solutions to identify functional gaps:

### A. TryHackMe
* **Description:** A gamified, room-based platform providing web-based target boxes and split-screen browser interfaces.
* **Shortcomings:** While beginner-friendly, their subscription models are costly, and the platform lacks an adaptive AI assistant to help users debug command syntax issues when stuck.

### B. Hack The Box (HTB)
* **Description:** A competitive pentesting platform offering raw server access for exploitation tasks.
* **Shortcomings:** The learning curve is excessively steep for absolute beginners. There is very little guided path assistance, and users are expected to configure their own local VPN connections and tools.

### C. PortSwigger Web Security Academy
* **Description:** An excellent web vulnerability learning portal.
* **Shortcomings:** It focuses exclusively on HTTP/web-based security vulnerabilities. It lacks support for general Linux CLI practice, packet-sniffing networking tasks, and OSINT commands.

---

## 4. Features / Scopes

To ensure timely delivery, the project scope is divided into MVP deliverables and post-MVP extensions:

### MVP Scope (In-Scope)
* **Authentication & Authorization:** Secure registration and login, with Role-Based Access Control (RBAC) supporting Student, Instructor, and Admin roles.
* **Interactive Learning Management:** Course paths divided into modules containing video/text lessons and automated quiz assessments.
* **Isolated Lab Orchestration:** One-click launch and reset of Docker containers, tracking time limits, and processing flag submissions.
* **Browser Terminal:** An interactive shell rendering output of user commands inside the sandbox container.
* **AI Cyber Coach:** A sidebar assistant generating dynamic hints based on user progress and explaining terminal errors.
* **Gamified Dashboard:** Progress widgets displaying XP, streak indicators, active courses, and unlocked badges.

### Post-MVP Scope (Out-of-Scope for Initial Release)
* Multi-user CTF Arenas with attack-defense features.
* Enterprise organizational dashboards for corporate teams.
* Local hosting of offline LLMs for low-cost offline AI queries.

---

## 5. Development Model

We select the **Iterative and Incremental (Agile/Scrum)** model:
* **Justification:** Implementing a multi-tier sandbox (Next.js frontend + FastAPI backend + Docker container runner) presents integration risks. An iterative model allows us to deploy the core API layer first, verify the container provisioning routines next, and continuously refine the terminal UI.
* **Feedback Cycles:** Short sprints enable testing of container creation performance, resource quotas, and cleanup timeouts.

---

## 6. Feasibility Analysis & Possible Risks

### Feasibility Factors
1. **Technical Feasibility:** High. Next.js, FastAPI, and Docker are mature, well-documented technologies with robust libraries (such as Zustand, docker-py, and Celery).
2. **Operational Feasibility:** High. The platform will run standard Linux commands and web apps in containers, requiring low manual server administration.
3. **Financial Feasibility:** High. We utilize open-source packages (PostgreSQL, Redis, Meilisearch) and low-cost container deployments (AWS EC2 or standard VPS), keeping cost minimal.

### Project Risks & Mitigations
* **Risk 1: Container Escape / Host Compromise**  
  * *Mitigation:* Sandbox containers will be run as non-root users, restricted via cgroups and custom namespaces, denied access to host volumes, and blocked from outbound external network traffic.
* **Risk 2: Resource Exhaustion (DDoS / Memory leaks)**  
  * *Mitigation:* Implement strict container quotas (1 vCPU, 2GB RAM, 5GB storage), a maximum session timeout of 60 minutes, and aggressive automated idle-timeout cleanup cron jobs.
* **Risk 3: High LLM API Cost**  
  * *Mitigation:* Implement semantic prompt caching in Redis and restrict daily AI Coach usage quotas per user.

---

## 8. Requirements

### A. Hardware Configuration (Server)
* **CPU:** Quad-Core 2.5GHz+ processor (Intel Xeon or AMD EPYC)
* **RAM:** 16 GB DDR4 (to accommodate backend APIs and multiple active sandbox containers)
* **Storage:** 100 GB SSD (for fast system I/O and container image storage)

### B. Software & Technologies
* **Operating System:** Ubuntu 22.04 LTS (Host)
* **Frontend Tech:** Next.js 16 (React 19), TailwindCSS v4, TypeScript, Zustand, Lucide Icons
* **Backend Tech:** FastAPI, Python, Celery (task queues), Redis (caching and token blacklisting)
* **Database:** PostgreSQL
* **Orchestration/Containers:** Docker (sandboxed user containers)
* **Search Engine:** Meilisearch (for fast index lookup)

### C. Personnel Requirements
* 1 Project Manager & Full-Stack Developer
* 1 Database Administrator & Content QA Engineer

---

## 9. Activity and Time Schedule (Project Breakdown)

| Stage / Task | Description | Efforts (Man-Hours) |
| :--- | :--- | :--- |
| **Stage 1: Analysis & Design** | | **32** |
| 1.1 | Requirements gathering and mockup creation | 16 |
| 1.2 | Database schema planning & API route mapping | 16 |
| **Stage 2: Implementation** | | **180** |
| 2.1 | Next.js Frontend layouts and dashboard design | 40 |
| 2.2 | PostgreSQL schema and database connection configuration | 20 |
| 2.3 | FastAPI Authentication, JWTs, and RBAC routes | 24 |
| 2.4 | Docker container orchestration & lab launch handlers | 48 |
| 2.5 | Browser-based terminal UI integration | 24 |
| 2.6 | AI Coach assistant prompts and context gateway | 24 |
| **Stage 3: Testing & QA** | | **40** |
| 3.1 | Sandbox isolation tests, security audits, and bug fixes | 24 |
| 3.2 | Stress testing API endpoints | 16 |
| **Stage 4: Deployment** | | **12** |
| 4.1 | Production setup via Docker Compose on AWS host | 12 |
| **Total Estimated Efforts** | | **264 Man-Hours** |

---

## 10. Budget

| Project Item | Description | Unit Price ($) | Total ($) |
| :--- | :--- | :--- | :--- |
| **Software Licenses** | Operating Systems & Core Databases | 0 (Open-Source) | 0 |
| **AWS Cloud Server** | Host VM for backend APIs, database, and sandboxes | 40 / month | 120 (3 Months) |
| **Machine Infrastructure** | Local workstations for testing | 0 (Existing) | 0 |
| **Consultancy & Mentorship** | External security audit and testing | 200 | 200 |
| **Project Management** | Coordination, timeline management, documentation | 150 | 150 |
| **AI API Costs** | LLM API tokens for AI Cyber Coach hints | 15 / month | 45 (3 Months) |
| **Total Project Budget** | | | **$515** |

---

## 11. Development Team & Stakeholders

### Team Structure & Responsibilities
* **Muhammad Raihan (Team Leader & Full-Stack Developer)**
  * *Designation:* Chief Systems Architect
  * *Responsibilities:* Frontend dashboard layout development, FastAPI core endpoint implementations, and Docker container provisioning orchestration.
* **[Collaborator Name] (Co-leader & QA Lead)**
  * *Designation:* Database Administrator & Security Engineer
  * *Responsibilities:* PostgreSQL database design, test execution for container isolation boundaries, and security patch auditing.

### Key Stakeholders & Target Users
* **Course Instructors:** CSE faculty members or security trainers monitoring student success rates.
* **Students:** CSE undergraduates learning fundamentals of Linux command execution, SQL injection, and networking.
* **System Administrators:** Maintaining core cloud VMs and security parameters.

---

## 12. Limitations & Future Works

### Limitations
* **Simulated Target Scopes:** Sandboxes are restricted from outbound networking to prevent malicious command execution, meaning students cannot import packages or external repositories during labs.
* **Concurrent Capacity:** The number of simultaneous sandboxed users is constrained by server CPU/RAM capacities, requiring scaling queues.

### Future Works
* **Vulnerability Scanning Integration:** Expand labs to support automated vulnerability scanning tools (Nmap/Burp Suite integration).
* **Multiplayer CTF Mode:** Integrate a dynamic scoring dashboard allowing real-time capture-the-flag matches between students.
* **Edge AI Integration:** Use local hardware acceleration to run LLM models directly on host nodes, reducing external API dependencies.

---

## 13. References

* [1] TryHackMe Ltd. (2020). *Interactive Cybersecurity Training*. Retrieved from: <https://tryhackme.com>
* [2] Hack The Box. (2020). *Gamified Cybersecurity Practice Labs*. Retrieved from: <https://www.hackthebox.com>
* [3] OWASP Foundation. (2021). *OWASP Top 10 Web Application Security Risks*. Retrieved from: <https://owasp.org/www-project-top-ten/>
* [4] Docker Inc. (2023). *Docker Container Isolation and Security Best Practices*. Retrieved from: <https://docs.docker.com/engine/security/>
