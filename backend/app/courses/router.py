from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user

router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)

# Seed courses list to populate DB if empty
SEED_COURSES = [
    {
        "id": "web-security-fundamentals",
        "title": "Web Security Fundamentals",
        "category": "Web Security",
        "difficulty": "Beginner",
        "estimated_duration": 360,
        "description": "Learn core web application security concepts, including injection, broken auth, and sensitive data exposure.",
        "xp": 1200,
    },
    {
        "id": "linux-basics",
        "title": "Linux Basics",
        "category": "Linux",
        "difficulty": "Beginner",
        "estimated_duration": 480,
        "description": "Master the Linux command line, file systems, permissions, shell scripting, and basic administration.",
        "xp": 1500,
    },
    {
        "id": "network-security-essentials",
        "title": "Network Security Essentials",
        "category": "Networking",
        "difficulty": "Beginner",
        "estimated_duration": 300,
        "description": "Understand network protocols, packet sniffing, firewalls, and secure communications.",
        "xp": 1200,
    },
    {
        "id": "python-for-security",
        "title": "Python for Security",
        "category": "Programming",
        "difficulty": "Intermediate",
        "estimated_duration": 600,
        "description": "Automate security tasks, write custom scanners, and create exploitation scripts with Python.",
        "xp": 2000,
    },
    {
        "id": "owasp-top-10",
        "title": "OWASP Top 10 Deep Dive",
        "category": "Web Security",
        "difficulty": "Intermediate",
        "estimated_duration": 420,
        "description": "An in-depth study of the top 10 web application vulnerabilities defined by OWASP.",
        "xp": 1600,
    },
    {
        "id": "ethical-hacking-pentest",
        "title": "Ethical Hacking & Penetration Testing",
        "category": "CTF",
        "difficulty": "Advanced",
        "estimated_duration": 900,
        "description": "A hands-on guide to penetration testing methodologies, scanning, vulnerability analysis, and exploitation.",
        "xp": 3000,
    },
    {
        "id": "ai-security-prompt-injection",
        "title": "AI Security & Prompt Injection",
        "category": "AI Security",
        "difficulty": "Expert",
        "estimated_duration": 240,
        "description": "Learn about the security risks of Large Language Models, prompt injection, and how to defend against them.",
        "xp": 1000,
    },
]

def seed_database_if_empty(db: Session):
    course_count = db.query(models.Course).count()
    lessons_data = [
        # Web Security Fundamentals
        {
            "id": "web-intro",
            "course_id": "web-security-fundamentals",
            "title": "How the Web Works: HTTP and HTML",
            "content_type": "video",
            "duration": 10,
            "sort_order": 1,
            "content": "Welcome to Web Security Fundamentals! In this lesson, we will explore the underlying architecture of the web, focusing on HTTP protocol, client-server models, headers, and basic HTML structure. Understanding these basics is critical before searching for vulnerabilities."
        },
        {
            "id": "same-origin-policy",
            "course_id": "web-security-fundamentals",
            "title": "The Same-Origin Policy (SOP)",
            "content_type": "reading",
            "duration": 15,
            "sort_order": 2,
            "content": "The Same-Origin Policy (SOP) is a critical security mechanism that restricts how a document or script loaded from one origin can interact with a resource from another origin.\n\nOrigin is defined by:\n1. Scheme (e.g. http, https)\n2. Host (domain name)\n3. Port (e.g. 80, 443)\n\nIf any of these three elements differ, they are considered different origins."
        },
        {
            "id": "sop-quiz",
            "course_id": "web-security-fundamentals",
            "title": "Module 1 Assessment",
            "content_type": "quiz",
            "duration": 5,
            "sort_order": 3,
            "content": "Assessment for SOP"
        },
        {
            "id": "xss-intro",
            "course_id": "web-security-fundamentals",
            "title": "Cross-Site Scripting (XSS) Types",
            "content_type": "video",
            "duration": 12,
            "sort_order": 4,
            "content": "Learn the difference between Stored XSS, Reflected XSS, and DOM-based XSS. We will write basic payloads and study their exploitation routes."
        },
        {
            "id": "sql-injection-intro",
            "course_id": "web-security-fundamentals",
            "title": "SQL Injection (SQLi) Basics",
            "content_type": "reading",
            "duration": 20,
            "sort_order": 5,
            "content": "SQL Injection occurs when user input is directly concatenated into a database query. This allows attackers to manipulate SQL queries.\n\nFor example, a query like:\nSELECT * FROM users WHERE username = 'user' AND password = 'pass';\n\nIf the attacker inputs:\nadmin' OR '1'='1\n\nThe query becomes:\nSELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = '...';\nThis query will return true, bypassing password verification!"
        },
        # Linux Basics
        {
            "id": "linux-navigation",
            "course_id": "linux-basics",
            "title": "Navigation & Listing Commands",
            "content_type": "video",
            "duration": 8,
            "sort_order": 1,
            "content": "Learn how to use cd, ls, pwd, and find to navigate file directories in Linux."
        },
        {
            "id": "file-management",
            "course_id": "linux-basics",
            "title": "Creating, Reading, and Editing Files",
            "content_type": "reading",
            "duration": 12,
            "sort_order": 2,
            "content": "Understand commands like touch, mkdir, cat, nano, echo, and rm."
        },
        # Network Security Essentials
        {
            "id": "network-basics",
            "course_id": "network-security-essentials",
            "title": "Understanding Network Protocols",
            "content_type": "video",
            "duration": 15,
            "sort_order": 1,
            "content": "Learn the foundation of network communications with TCP/IP, DNS, and IP routing protocols."
        },
        {
            "id": "packet-sniffing",
            "course_id": "network-security-essentials",
            "title": "Packet Sniffing and Security",
            "content_type": "reading",
            "duration": 20,
            "sort_order": 2,
            "content": "Understand how plaintext network traffic can be intercepted and how tools like tcpdump allow analysis."
        },
        # Python for Security
        {
            "id": "python-basics",
            "course_id": "python-for-security",
            "title": "Python Basics for Scripting",
            "content_type": "reading",
            "duration": 15,
            "sort_order": 1,
            "content": "Learn variables, loops, and requests library to automate tasks."
        },
        {
            "id": "port-scanner",
            "course_id": "python-for-security",
            "title": "Building a Simple Port Scanner",
            "content_type": "reading",
            "duration": 20,
            "sort_order": 2,
            "content": "Write a simple script using socket module to identify open ports."
        },
        # OWASP Top 10 Deep Dive
        {
            "id": "owasp-intro",
            "course_id": "owasp-top-10",
            "title": "Introduction to OWASP Top 10",
            "content_type": "video",
            "duration": 10,
            "sort_order": 1,
            "content": "Overview of the top security risks listed by OWASP."
        },
        {
            "id": "broken-auth",
            "course_id": "owasp-top-10",
            "title": "Broken Authentication Mechanisms",
            "content_type": "reading",
            "duration": 15,
            "sort_order": 2,
            "content": "Study authentication flaws, session hijacking, and brute-force bypass."
        },
        # Ethical Hacking & Penetration Testing
        {
            "id": "pentest-intro",
            "course_id": "ethical-hacking-pentest",
            "title": "Pentesting Methodologies",
            "content_type": "video",
            "duration": 12,
            "sort_order": 1,
            "content": "Introduction to reconnaissance, scanning, gaining access, and reporting."
        },
        {
            "id": "nmap-scanning",
            "course_id": "ethical-hacking-pentest",
            "title": "Active Reconnaissance with Nmap",
            "content_type": "reading",
            "duration": 20,
            "sort_order": 2,
            "content": "Learn Nmap scan types, flags, and service version detection."
        },
        # AI Security & Prompt Injection
        {
            "id": "ai-risks",
            "course_id": "ai-security-prompt-injection",
            "title": "Vulnerabilities of LLM Systems",
            "content_type": "video",
            "duration": 10,
            "sort_order": 1,
            "content": "Overview of prompt injections, training data poisoning, and model theft."
        },
        {
            "id": "securing-llm",
            "course_id": "ai-security-prompt-injection",
            "title": "Hardening LLM Prompts",
            "content_type": "reading",
            "duration": 15,
            "sort_order": 2,
            "content": "Methods to validate LLM inputs/outputs and create robust system prompts."
        },
    ]

    # Check if all seed courses exist
    seed_course_ids = [c["id"] for c in SEED_COURSES]
    existing_courses_count = db.query(models.Course).filter(models.Course.id.in_(seed_course_ids)).count()
    
    # Check if all seed lessons exist
    seed_lesson_ids = [l["id"] for l in lessons_data]
    existing_lessons_count = db.query(models.Lesson).filter(models.Lesson.id.in_(seed_lesson_ids)).count()
    
    if existing_courses_count < len(SEED_COURSES) or existing_lessons_count < len(lessons_data):
        # We have missing seed data. Let's insert/update them without deleting anything.
        for c in SEED_COURSES:
            db_course = db.query(models.Course).filter(models.Course.id == c["id"]).first()
            if not db_course:
                db_course = models.Course(
                    id=c["id"],
                    title=c["title"],
                    category=c["category"],
                    difficulty=c["difficulty"],
                    estimated_duration=c["estimated_duration"],
                    description=c["description"],
                    is_published=True
                )
                db.add(db_course)
            else:
                db_course.title = c["title"]
                db_course.category = c["category"]
                db_course.difficulty = c["difficulty"]
                db_course.estimated_duration = c["estimated_duration"]
                db_course.description = c["description"]
        db.commit()
        
        for l in lessons_data:
            db_lesson = db.query(models.Lesson).filter(models.Lesson.id == l["id"]).first()
            if not db_lesson:
                db_lesson = models.Lesson(
                    id=l["id"],
                    course_id=l["course_id"],
                    title=l["title"],
                    content_type=l["content_type"],
                    duration=l["duration"],
                    sort_order=l["sort_order"],
                    content=l["content"]
                )
                db.add(db_lesson)
            else:
                db_lesson.course_id = l["course_id"]
                db_lesson.title = l["title"]
                db_lesson.content_type = l["content_type"]
                db_lesson.duration = l["duration"]
                db_lesson.sort_order = l["sort_order"]
                db_lesson.content = l["content"]
        db.commit()

@router.get("", response_model=List[schemas.CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    return db.query(models.Course).filter(models.Course.is_published == True).all()

@router.get("/progress", response_model=List[schemas.ProgressResponse])
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Progress).filter(models.Progress.user_id == current_user.id).all()

@router.post("/progress", response_model=schemas.ProgressResponse)
def update_progress(
    progress_in: schemas.ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if course and lesson exist
    course = db.query(models.Course).filter(models.Course.id == progress_in.course_id).first()
    lesson = db.query(models.Lesson).filter(models.Lesson.id == progress_in.lesson_id).first()
    if not course or not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested course or lesson was not found."
        )
        
    # Find existing progress or create a new one
    db_progress = db.query(models.Progress).filter(
        models.Progress.user_id == current_user.id,
        models.Progress.course_id == progress_in.course_id,
        models.Progress.lesson_id == progress_in.lesson_id
    ).first()
    
    is_new_completion = False
    if db_progress:
        if db_progress.status != "completed" and progress_in.status == "completed":
            is_new_completion = True
        db_progress.status = progress_in.status
        db_progress.completion_pct = progress_in.completion_pct
    else:
        if progress_in.status == "completed":
            is_new_completion = True
        db_progress = models.Progress(
            user_id=current_user.id,
            course_id=progress_in.course_id,
            lesson_id=progress_in.lesson_id,
            status=progress_in.status,
            completion_pct=progress_in.completion_pct
        )
        db.add(db_progress)
        
    if is_new_completion:
        current_user.xp += 50
        
    db.commit()
    db.refresh(db_progress)
    return db_progress

@router.get("/{course_id}", response_model=schemas.CourseResponse)
def get_course(course_id: str, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID '{course_id}' was not found."
        )
    return course
