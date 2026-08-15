import sys
import os
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import User, Course, Lesson, Lab, Post, Achievement
from .auth.utils import get_password_hash

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
                xp=5000,
                streak_days=14,
            )
            db.add(admin_user)

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
                xp=1250,
                streak_days=5,
            )
            db.add(student_user)

        db.commit()

        # 2. Seed Courses & Lessons
        if db.query(Course).count() == 0:
            courses_data = [
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
                            "title": "Introduction to Web Application Architecture",
                            "content_type": "video",
                            "content": "https://www.youtube-nocookie.com/embed/2_a10h63d50",
                            "duration": 12,
                            "sort_order": 1
                        },
                        {
                            "id": "web-sec-2",
                            "title": "Understanding HTTP Protocol & Headers",
                            "content_type": "reading",
                            "content": "HTTP is the foundational protocol of the web. Learn how requests, responses, and headers operate.",
                            "duration": 15,
                            "sort_order": 2
                        },
                        {
                            "id": "web-sec-3",
                            "title": "Cross-Site Scripting (XSS) Deep Dive",
                            "content_type": "video",
                            "content": "https://www.youtube-nocookie.com/embed/EoaDgUgS6QA",
                            "duration": 20,
                            "sort_order": 3
                        },
                        {
                            "id": "web-sec-4",
                            "title": "SQL Injection Mechanics & Prevention",
                            "content_type": "reading",
                            "content": "SQL injection occurs when untrusted user input alters database queries. Always use parameterized queries.",
                            "duration": 25,
                            "sort_order": 4
                        }
                    ]
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
                            "title": "Linux Directory Navigation & Shell Basics",
                            "content_type": "video",
                            "content": "https://www.youtube-nocookie.com/embed/sWbUDq4S6XA",
                            "duration": 15,
                            "sort_order": 1
                        },
                        {
                            "id": "linux-2",
                            "title": "File Permissions, Chmod & Chown Explained",
                            "content_type": "reading",
                            "content": "Understand read (r=4), write (w=2), execute (x=1) permissions for user, group, and others.",
                            "duration": 20,
                            "sort_order": 2
                        }
                    ]
                },
                {
                    "id": "network-security-essentials",
                    "title": "Network Security & Wireshark Recon",
                    "description": "Analyze TCP/IP networks, packet captures with Wireshark, DNS, and firewall configurations.",
                    "difficulty": "Intermediate",
                    "category": "Networking",
                    "estimated_duration": 210,
                    "thumbnail_url": "🔌",
                    "is_published": True,
                    "lessons": [
                        {
                            "id": "net-1",
                            "title": "TCP/IP 4-Layer Model & Handshake",
                            "content_type": "video",
                            "content": "https://www.youtube-nocookie.com/embed/3QhU9jd03a0",
                            "duration": 18,
                            "sort_order": 1
                        }
                    ]
                },
                {
                    "id": "python-for-security",
                    "title": "Python Scripting for Security Engineers",
                    "description": "Build automated port scanners, web scapers, and payload exploits in Python 3.",
                    "difficulty": "Intermediate",
                    "category": "Programming",
                    "estimated_duration": 240,
                    "thumbnail_url": "🐍",
                    "is_published": True,
                    "lessons": [
                        {
                            "id": "py-1",
                            "title": "Socket Programming & Port Scanning in Python",
                            "content_type": "video",
                            "content": "https://www.youtube-nocookie.com/embed/3Kq1MIfTWCE",
                            "duration": 22,
                            "sort_order": 1
                        }
                    ]
                }
            ]

            for c_info in courses_data:
                lessons = c_info.pop("lessons")
                course = Course(**c_info)
                db.add(course)
                db.flush()

                for l_info in lessons:
                    lesson = Lesson(course_id=course.id, **l_info)
                    db.add(lesson)

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
                    "time_limit": 1800
                },
                {
                    "id": "sql-injection-bypass",
                    "title": "SQL Injection Authentication Bypass",
                    "description": "Exploit vulnerable login endpoints using SQL syntax injection to bypass authentication.",
                    "type": "web_security",
                    "difficulty": "Medium",
                    "container_template": "cyberlearn/web-sqli:latest",
                    "xp_reward": 250,
                    "time_limit": 2400
                },
                {
                    "id": "packet-sniffer-recon",
                    "title": "Packet Sniffer & Wireshark PCAP Analysis",
                    "description": "Analyze network traffic PCAP files to extract plaintext HTTP credentials.",
                    "type": "networking",
                    "difficulty": "Medium",
                    "container_template": "cyberlearn/wireshark-lab:latest",
                    "xp_reward": 300,
                    "time_limit": 2400
                },
                {
                    "id": "linux-privesc",
                    "title": "Linux Privilege Escalation (SUID)",
                    "description": "Identify misconfigured SUID binaries on Linux systems to drop a root shell.",
                    "type": "linux",
                    "difficulty": "Hard",
                    "container_template": "cyberlearn/privesc:latest",
                    "xp_reward": 500,
                    "time_limit": 3600
                }
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
                    "upvotes": 42
                },
                {
                    "user_id": student_user.id,
                    "title": "How to approach SQL Injection auth bypass labs?",
                    "content": "Any hints on constructing boolean payloads without breaking SQLite string quotes?",
                    "category": "Web Security",
                    "upvotes": 18
                }
            ]
            for p_info in posts_data:
                post = Post(**p_info)
                db.add(post)

            db.commit()

        print("[SUCCESS] Database successfully seeded with production initial data!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
