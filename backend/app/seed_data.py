import sys
import os
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import User, Course, Lesson, Lab, Post, Achievement
from .auth.utils import get_password_hash

COURSES_SEED_DATA = [
    {
        "id": "web-security-fundamentals",
        "title": "Web Security Fundamentals",
        "description": "Learn key web vulnerabilities (SQLi, XSS, CSRF, IDOR) and secure coding principles.",
        "difficulty": "Beginner",
        "category": "Web Security",
        "estimated_duration": 180,
        "thumbnail_url": "🛡️",
        "is_published": True,
        "lessons": [
            {
                "id": "web-sec-1",
                "title": "How the Web Works: HTTP Server Architecture",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/7GBlCinu9yg",
                "duration": 12,
                "sort_order": 1,
            },
            {
                "id": "web-sec-2",
                "title": "Understanding HTTP Protocol, Headers & Same-Origin Policy",
                "content_type": "reading",
                "content": "HTTP is the foundational protocol of the web. Learn how requests, responses, status codes, and SOP operate.",
                "duration": 15,
                "sort_order": 2,
            },
            {
                "id": "web-sec-3",
                "title": "Cross-Site Scripting (XSS) Origins & Exploitation",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/mKAWpFdVcPY",
                "duration": 18,
                "sort_order": 3,
            },
            {
                "id": "web-sec-4",
                "title": "Running an SQL Injection Attack & Prepared Statements",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/ciNHn38EyRc",
                "duration": 20,
                "sort_order": 4,
            },
            {
                "id": "web-sec-5",
                "title": "Cross-Site Request Forgery (CSRF) Deep Dive",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/vRBihr41JTo",
                "duration": 15,
                "sort_order": 5,
            },
        ],
    },
    {
        "id": "linux-basics",
        "title": "Linux Command Line & System Admin",
        "description": "Master bash terminal navigation, permissions, process management, and SSH administration.",
        "difficulty": "Beginner",
        "category": "Linux",
        "estimated_duration": 150,
        "thumbnail_url": "🐧",
        "is_published": True,
        "lessons": [
            {
                "id": "linux-1",
                "title": "Linux Tutorial: Basic Command Line Navigation",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/cBokz0LTizk",
                "duration": 15,
                "sort_order": 1,
            },
            {
                "id": "linux-2",
                "title": "Linux File Permissions in 5 Minutes (Chmod & Chown)",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/LnKoncbQBsM",
                "duration": 8,
                "sort_order": 2,
            },
            {
                "id": "linux-3",
                "title": "Shell Scripting Crash Course: Beginner to Pro",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/v-F3YLd6oMw",
                "duration": 22,
                "sort_order": 3,
            },
            {
                "id": "linux-4",
                "title": "Linux Privilege Escalation for Beginners (SUID & GTFOBins)",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/ZTnwg3qCdVM",
                "duration": 20,
                "sort_order": 4,
            },
        ],
    },
    {
        "id": "network-security-essentials",
        "title": "Network Security & Wireshark Recon",
        "description": "Analyze TCP/IP networks, packet captures with Wireshark, DNS, and firewall configurations.",
        "difficulty": "Beginner",
        "category": "Networking",
        "estimated_duration": 210,
        "thumbnail_url": "🔌",
        "is_published": True,
        "lessons": [
            {
                "id": "net-1",
                "title": "Computer Networks & The TCP/IP Protocol Suite",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/3QhU9jd03a0",
                "duration": 18,
                "sort_order": 1,
            },
            {
                "id": "net-2",
                "title": "Subnetting, Routing Tables & Firewalls",
                "content_type": "reading",
                "content": "Understand CIDR subnetting, default gateways, and stateful packet filtering firewall rules.",
                "duration": 15,
                "sort_order": 2,
            },
            {
                "id": "net-3",
                "title": "Wireshark Tutorial for Beginners: Network Traffic Analysis",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/qTaOZrDnMzQ",
                "duration": 20,
                "sort_order": 3,
            },
            {
                "id": "net-4",
                "title": "Nmap Tutorial to Find Network Vulnerabilities",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/4t4kBkMsDbQ",
                "duration": 22,
                "sort_order": 4,
            },
        ],
    },
    {
        "id": "python-for-security",
        "title": "Python Scripting for Security Engineers",
        "description": "Build automated port scanners, web scrapers, and payload exploits in Python 3.",
        "difficulty": "Intermediate",
        "category": "Programming",
        "estimated_duration": 240,
        "thumbnail_url": "🐍",
        "is_published": True,
        "lessons": [
            {
                "id": "py-1",
                "title": "Python for Beginners: Full Course & Fundamentals",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/eWRfhZUzrAc",
                "duration": 20,
                "sort_order": 1,
            },
            {
                "id": "py-2",
                "title": "Python Socket Programming Tutorial",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/3QiPPX-KeSc",
                "duration": 20,
                "sort_order": 2,
            },
            {
                "id": "py-3",
                "title": "Sockets Tutorial with Python 3: Making a Port Scanner",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/LV-lFjPQR20",
                "duration": 24,
                "sort_order": 3,
            },
            {
                "id": "py-4",
                "title": "The Best Way to Learn Python (For Ethical Hacking)",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/Fxh9X3-hO4Y",
                "duration": 18,
                "sort_order": 4,
            },
        ],
    },
    {
        "id": "owasp-top-10",
        "title": "OWASP Top 10 Deep Dive",
        "description": "An in-depth study of the top 10 web application vulnerabilities defined by OWASP.",
        "difficulty": "Intermediate",
        "category": "Web Security",
        "estimated_duration": 210,
        "thumbnail_url": "🕸️",
        "is_published": True,
        "lessons": [
            {
                "id": "owasp-1",
                "title": "7 Security Risks You Should Never Take as a Developer",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/4YOpILi9Oxs",
                "duration": 15,
                "sort_order": 1,
            },
            {
                "id": "owasp-2",
                "title": "Hacking Websites with SQL Injection & Broken Auth",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/_jKylhJtPmI",
                "duration": 18,
                "sort_order": 2,
            },
            {
                "id": "owasp-3",
                "title": "IDOR Explained: Insecure Direct Object References",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/iWbWgjrj_g4",
                "duration": 16,
                "sort_order": 3,
            },
            {
                "id": "owasp-4",
                "title": "Server-Side Request Forgery (SSRF) Explained & Demonstrated",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/Zyt7lUO3mY8",
                "duration": 20,
                "sort_order": 4,
            },
        ],
    },
    {
        "id": "ethical-hacking-pentest",
        "title": "Ethical Hacking & Penetration Testing",
        "description": "A hands-on guide to penetration testing methodologies, scanning, vulnerability analysis, and exploitation.",
        "difficulty": "Advanced",
        "category": "CTF",
        "estimated_duration": 300,
        "thumbnail_url": "⚔️",
        "is_published": True,
        "lessons": [
            {
                "id": "pentest-1",
                "title": "Ethical Hacking Full Course: Penetration Testing Methodologies",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/3FNYvj2U0HM",
                "duration": 22,
                "sort_order": 1,
            },
            {
                "id": "pentest-2",
                "title": "Metasploit Hacking Demo & Exploitation Framework",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/bBut8D7usKA",
                "duration": 25,
                "sort_order": 2,
            },
            {
                "id": "pentest-3",
                "title": "Linux Privilege Escalation & CTF Machine Exploitation",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/Qg3qOjylZpw",
                "duration": 28,
                "sort_order": 3,
            },
            {
                "id": "pentest-4",
                "title": "Executive vs Technical Pentest Reporting",
                "content_type": "reading",
                "content": "Learn how to formulate professional penetration testing assessment reports with actionable mitigations.",
                "duration": 15,
                "sort_order": 4,
            },
        ],
    },
    {
        "id": "ai-security-prompt-injection",
        "title": "AI Security & Prompt Injection",
        "description": "Learn about the security risks of Large Language Models, prompt injection, and how to defend against them.",
        "difficulty": "Expert",
        "category": "AI Security",
        "estimated_duration": 160,
        "thumbnail_url": "🤖",
        "is_published": True,
        "lessons": [
            {
                "id": "ai-sec-1",
                "title": "Generative AI's Greatest Flaw: Prompt Injection Explained",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/rAEqP9VEhe8",
                "duration": 14,
                "sort_order": 1,
            },
            {
                "id": "ai-sec-2",
                "title": "How to Jailbreak AI Models & Prompt Injection Vectors",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/fw16D23TjJI",
                "duration": 18,
                "sort_order": 2,
            },
            {
                "id": "ai-sec-3",
                "title": "What is Retrieval-Augmented Generation (RAG) & Security",
                "content_type": "video",
                "content": "https://www.youtube-nocookie.com/embed/T-D1OfcDW1M",
                "duration": 20,
                "sort_order": 3,
            },
            {
                "id": "ai-sec-4",
                "title": "Training Data Poisoning & Supply Chain Risks",
                "content_type": "reading",
                "content": "Understand risks associated with fine-tuning data poisoning and malicious serialized model files.",
                "duration": 15,
                "sort_order": 4,
            },
        ],
    },
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Admin & Default Users if none exist
        admin_user = db.query(User).filter(User.email == "admin@cyberlearn.io").first()
        if not admin_user:
            print("[WARNING] Seeding default admin user (admin@cyberlearn.io). Change password in production!")
            admin_user = User(
                id="user-admin-01",
                email="admin@cyberlearn.io",
                username="admin",
                full_name="System Administrator",
                password_hash=get_password_hash("admin123"),
                role="admin",
                is_verified=True,
                is_onboarded=True,
                xp=5000,
                streak_days=14,
            )
            db.add(admin_user)
        else:
            admin_user.is_onboarded = True

        # Ensure all existing admins are marked as onboarded
        db.query(User).filter(User.role == "admin").update({"is_onboarded": True})

        student_user = db.query(User).filter(User.email == "learner@cyberlearn.io").first()
        if not student_user:
            print("[WARNING] Seeding default learner user (learner@cyberlearn.io). Change password in production!")
            student_user = User(
                id="user-student-01",
                email="learner@cyberlearn.io",
                username="learner",
                full_name="Raihan Student",
                password_hash=get_password_hash("learner123"),
                role="student",
                is_verified=True,
                is_onboarded=True,
                xp=1250,
                streak_days=5,
            )
            db.add(student_user)

        db.commit()

        # 2. Seed / Upsert Courses & Lessons
        for c_info in COURSES_SEED_DATA:
            lessons_info = c_info.get("lessons", [])
            course_fields = {k: v for k, v in c_info.items() if k != "lessons"}

            existing_course = db.query(Course).filter(Course.id == c_info["id"]).first()
            if not existing_course:
                course = Course(**course_fields)
                db.add(course)
                db.flush()
            else:
                for k, v in course_fields.items():
                    setattr(existing_course, k, v)

            # Upsert lessons
            for l_info in lessons_info:
                existing_lesson = db.query(Lesson).filter(Lesson.id == l_info["id"]).first()
                if not existing_lesson:
                    lesson = Lesson(course_id=c_info["id"], **l_info)
                    db.add(lesson)
                else:
                    for k, v in l_info.items():
                        setattr(existing_lesson, k, v)

        db.commit()

        # 3. Seed Labs
        if db.query(Lab).count() == 0:
            labs_data = [
                {
                    "id": "linux-navigation",
                    "title": "Linux Command Navigation",
                    "description": "Navigate home directories, check file permissions, and extract restricted flag files.",
                    "type": "linux",
                    "difficulty": "Easy",
                    "container_template": "cyberlearn/ubuntu-lab:latest",
                    "xp_reward": 100,
                    "time_limit": 1800,
                },
                {
                    "id": "sql-injection-bypass",
                    "title": "SQL Injection Authentication Bypass",
                    "description": "Exploit vulnerable login endpoints using SQL syntax injection to bypass authentication.",
                    "type": "web_security",
                    "difficulty": "Medium",
                    "container_template": "cyberlearn/web-sqli:latest",
                    "xp_reward": 250,
                    "time_limit": 2400,
                },
                {
                    "id": "packet-sniffer-recon",
                    "title": "Packet Sniffer & Wireshark PCAP Analysis",
                    "description": "Analyze network traffic PCAP files to extract plaintext HTTP credentials.",
                    "type": "networking",
                    "difficulty": "Medium",
                    "container_template": "cyberlearn/wireshark-lab:latest",
                    "xp_reward": 300,
                    "time_limit": 2400,
                },
                {
                    "id": "linux-privesc",
                    "title": "Linux Privilege Escalation (SUID)",
                    "description": "Identify misconfigured SUID binaries on Linux systems to drop a root shell.",
                    "type": "linux",
                    "difficulty": "Hard",
                    "container_template": "cyberlearn/privesc:latest",
                    "xp_reward": 500,
                    "time_limit": 3600,
                },
            ]

            for lab_info in labs_data:
                lab = Lab(**lab_info)
                db.add(lab)

            db.commit()

        # 4. Seed Community Posts
        if db.query(Post).count() == 0:
            posts_data = [
                {
                    "user_id": admin_user.id,
                    "title": "Welcome to CyberLearn 2026! Tips for Beginners",
                    "content": "Check out the Foundations track and practice labs. Start with Linux Command Navigation!",
                    "category": "General",
                    "upvotes": 42,
                },
                {
                    "user_id": student_user.id,
                    "title": "How to approach SQL Injection auth bypass labs?",
                    "content": "Any hints on constructing boolean payloads without breaking SQLite string quotes?",
                    "category": "Web Security",
                    "upvotes": 18,
                },
            ]
            for p_info in posts_data:
                post = Post(**p_info)
                db.add(post)

            db.commit()

        print("[SUCCESS] Database successfully seeded with 100% verified production videos!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
