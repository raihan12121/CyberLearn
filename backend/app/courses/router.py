from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user, get_optional_user, has_active_subscription, require_subscription, has_course_access

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
            "video_url": "https://www.youtube-nocookie.com/embed/2JYT5f2isg4",
            "content": "Welcome to Web Security Fundamentals! In this lesson, we explore how client-server web architecture functions, detailing HTTP request methods (GET, POST), status codes, headers, and basic HTML elements."
        },
        {
            "id": "same-origin-policy",
            "course_id": "web-security-fundamentals",
            "title": "The Same-Origin Policy (SOP)",
            "content_type": "reading",
            "duration": 15,
            "sort_order": 2,
            "video_url": None,
            "content": "The Same-Origin Policy (SOP) is a critical security mechanism that restricts how a document or script loaded from one origin can interact with a resource from another origin.\n\nOrigin is defined by:\n1. Scheme (e.g. http, https)\n2. Host (domain name)\n3. Port (e.g. 80, 443)\n\nIf any of these three elements differ, they are considered different origins."
        },
        {
            "id": "sop-quiz",
            "course_id": "web-security-fundamentals",
            "title": "Module 1 Assessment",
            "content_type": "quiz",
            "duration": 5,
            "sort_order": 3,
            "video_url": None,
            "content": '{"questions": [{"id": "q1", "question": "Which three components strictly define a Web Origin under the Same-Origin Policy?", "options": ["Scheme, Host Domain, and Port", "Domain, Subdomain, and Cookie Path", "HTTP Method, User-Agent, and IP Address", "Protocol, Query Parameters, and URL Fragment"], "correct_option": 0, "explanation": "An origin is strictly defined by the tuple of (Scheme, Host, Port). If any of these three elements differ, browsers treat them as different origins."}, {"id": "q2", "question": "What is the primary purpose of the Same-Origin Policy (SOP)?", "options": ["To compress HTTP response payloads for faster loading", "To isolate independent sites and prevent scripts on one origin from reading sensitive DOM/cookie state on another origin", "To encrypt all local storage data stored in the browser", "To block user authentication headers across all web requests"], "correct_option": 1, "explanation": "SOP isolates distinct web applications, ensuring malicious scripts on attacker.com cannot read cookies or DOM data from bank.com."}, {"id": "q3", "question": "Which request header allows a server to explicitly relax SOP and permit cross-origin access?", "options": ["Content-Security-Policy", "Access-Control-Allow-Origin", "Strict-Transport-Security", "X-Frame-Options"], "correct_option": 1, "explanation": "Access-Control-Allow-Origin is a key CORS header that tells the browser which requesting origins are permitted to access resources cross-origin."}]}'
        },
        {
            "id": "xss-intro",
            "course_id": "web-security-fundamentals",
            "title": "Cross-Site Scripting (XSS) Types",
            "content_type": "video",
            "duration": 12,
            "sort_order": 4,
            "video_url": "https://www.youtube-nocookie.com/embed/EoaDgUgS6QA",
            "content": "Learn the difference between Stored XSS, Reflected XSS, and DOM-based XSS. We will write basic payloads and study their exploitation routes."
        },
        {
            "id": "sql-injection-intro",
            "course_id": "web-security-fundamentals",
            "title": "SQL Injection (SQLi) Basics",
            "content_type": "reading",
            "duration": 20,
            "sort_order": 5,
            "video_url": None,
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
            "video_url": "https://www.youtube-nocookie.com/embed/oxuRxtrO2Ag",
            "content": "Learn how to use cd, ls, pwd, and find to navigate file directories in Linux."
        },
        {
            "id": "file-management",
            "course_id": "linux-basics",
            "title": "Creating, Reading, and Editing Files",
            "content_type": "reading",
            "duration": 12,
            "sort_order": 2,
            "video_url": None,
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
            "video_url": "https://www.youtube-nocookie.com/embed/3QhU9jd03a0",
            "content": "Learn the foundation of network communications with TCP/IP, DNS, and IP routing protocols."
        },
        {
            "id": "packet-sniffing",
            "course_id": "network-security-essentials",
            "title": "Packet Sniffing and Security",
            "content_type": "reading",
            "duration": 20,
            "sort_order": 2,
            "video_url": None,
            "content": "Understand how plaintext network traffic can be intercepted and how tools like tcpdump allow analysis."
        },
        # Python for Security
        {
            "id": "python-basics",
            "course_id": "python-for-security",
            "title": "Python Basics for Scripting",
            "content_type": "video",
            "duration": 15,
            "sort_order": 1,
            "video_url": "https://www.youtube-nocookie.com/embed/fgTGADljAeg",
            "content": "Learn variables, loops, socket programming, and requests library to automate tasks."
        },
        {
            "id": "port-scanner",
            "course_id": "python-for-security",
            "title": "Building a Simple Port Scanner",
            "content_type": "reading",
            "duration": 20,
            "sort_order": 2,
            "video_url": None,
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
            "video_url": "https://www.youtube-nocookie.com/embed/rTXN37mXyqg",
            "content": "Overview of the top security risks listed by OWASP."
        },
        {
            "id": "broken-auth",
            "course_id": "owasp-top-10",
            "title": "Broken Authentication Mechanisms",
            "content_type": "reading",
            "duration": 15,
            "sort_order": 2,
            "video_url": None,
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
            "video_url": "https://www.youtube-nocookie.com/embed/3Kq1MIfTWCE",
            "content": "Introduction to reconnaissance, scanning, gaining access, and reporting."
        },
        {
            "id": "nmap-scanning",
            "course_id": "ethical-hacking-pentest",
            "title": "Active Reconnaissance with Nmap",
            "content_type": "reading",
            "duration": 20,
            "sort_order": 2,
            "video_url": None,
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
            "video_url": "https://www.youtube-nocookie.com/embed/v2gD8BHOaXg",
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

    # Insert or update courses & lessons
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
                video_url=l.get("video_url"),
                content=l["content"]
            )
            db.add(db_lesson)
        else:
            db_lesson.course_id = l["course_id"]
            db_lesson.title = l["title"]
            db_lesson.content_type = l["content_type"]
            db_lesson.duration = l["duration"]
            db_lesson.sort_order = l["sort_order"]
            db_lesson.video_url = l.get("video_url")
            db_lesson.content = l["content"]
    db.commit()

COURSE_XP_MAP = {c["id"]: c.get("xp", 1200) for c in SEED_COURSES}

@router.get("", response_model=List[schemas.CourseResponse])
def get_courses(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    courses = db.query(models.Course).filter(models.Course.is_published == True).all()
    
    purchased_ids = set()
    if current_user:
        purchases = db.query(models.CoursePurchase.course_id).filter(models.CoursePurchase.user_id == current_user.id).all()
        purchased_ids = {p[0] for p in purchases}
        
    is_sub = has_active_subscription(current_user)
    is_staff = current_user is not None and current_user.role in ["admin", "instructor"]

    results = []
    for c in courses:
        res = schemas.CourseResponse.model_validate(c)
        res.price = float(c.price or 49.00)
        res.xp = COURSE_XP_MAP.get(c.id, 1200)
        res.is_purchased = c.id in purchased_ids
        res.has_access = is_sub or res.is_purchased or is_staff
        res.access_type = "lifetime" if res.is_purchased else "subscription" if is_sub else "staff" if is_staff else "none"
        results.append(res)
    return results

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
    # Check if user has access to this specific course (via lifetime purchase, active subscription, or staff)
    if not has_course_access(current_user, progress_in.course_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Subscription required: Course access required. Please purchase lifetime access to this course ($49) or upgrade to an All-Access subscription at /pricing."
        )

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
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID '{course_id}' was not found."
        )
        
    is_purchased = False
    if current_user:
        is_purchased = db.query(models.CoursePurchase).filter(
            models.CoursePurchase.user_id == current_user.id,
            models.CoursePurchase.course_id == course.id
        ).first() is not None

    has_access = has_course_access(current_user, course.id, db)
    is_sub = has_active_subscription(current_user)
    is_staff = current_user is not None and current_user.role in ["admin", "instructor"]

    res_lessons = []
    for l in sorted(course.lessons, key=lambda x: x.sort_order or 0):
        if not has_access:
            res_lessons.append(schemas.LessonResponse(
                id=l.id,
                course_id=l.course_id,
                title=l.title,
                content_type=l.content_type,
                duration=l.duration,
                sort_order=l.sort_order,
                is_locked=True,
                video_url=None,
                content="Subscription Required: Buy lifetime access to this course ($49) or subscribe to an All-Access pass to unlock lesson videos and quizzes."
            ))
        else:
            res_lessons.append(schemas.LessonResponse(
                id=l.id,
                course_id=l.course_id,
                title=l.title,
                content_type=l.content_type,
                duration=l.duration,
                sort_order=l.sort_order,
                is_locked=False,
                video_url=l.video_url,
                content=l.content
            ))

    return schemas.CourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        difficulty=course.difficulty,
        category=course.category,
        estimated_duration=course.estimated_duration,
        thumbnail_url=course.thumbnail_url,
        is_published=course.is_published,
        price=float(course.price or 49.00),
        xp=COURSE_XP_MAP.get(course.id, 1200),
        lessons=res_lessons,
        is_purchased=is_purchased,
        has_access=has_access,
        access_type="lifetime" if is_purchased else "subscription" if is_sub else "staff" if is_staff else "none"
    )

import json

@router.post("/lessons/{lesson_id}/quiz/submit", response_model=schemas.QuizEvaluationResponse)
def submit_quiz_assessment(
    lesson_id: str,
    submission: schemas.QuizSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lesson with ID '{lesson_id}' was not found."
        )
        
    # Check if user has access to this lesson's course
    if not has_course_access(current_user, lesson.course_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Subscription required: Course access required. Please purchase lifetime access to this course ($49) or upgrade to an All-Access subscription at /pricing."
        )
        
    if lesson.content_type != "quiz":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target lesson is not a quiz assessment."
        )

    try:
        content_data = json.loads(lesson.content or "{}")
        questions = content_data.get("questions", [])
    except Exception:
        questions = []

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz contains no configured questions."
        )

    user_answers_map = {ans.question_id: ans.selected_option for ans in submission.answers}
    correct_count = 0
    results = []

    for q in questions:
        q_id = q.get("id")
        correct_opt = q.get("correct_option", 0)
        selected_opt = user_answers_map.get(q_id, -1)
        is_correct = selected_opt == correct_opt
        if is_correct:
            correct_count += 1

        results.append(schemas.QuizQuestionResult(
            question_id=q_id,
            correct=is_correct,
            selected_option=selected_opt,
            correct_option=correct_opt,
            explanation=q.get("explanation", "Review lesson material for details.")
        ))

    total_questions = len(questions)
    score_pct = round((correct_count / total_questions) * 100.0, 1)
    passed = score_pct >= 80.0
    xp_awarded = 0

    if passed:
        # Check existing progress or create new
        db_progress = db.query(models.Progress).filter(
            models.Progress.user_id == current_user.id,
            models.Progress.course_id == lesson.course_id,
            models.Progress.lesson_id == lesson.id
        ).first()

        is_new_completion = False
        if db_progress:
            if db_progress.status != "completed":
                is_new_completion = True
                db_progress.status = "completed"
                db_progress.completion_pct = 100.0
        else:
            is_new_completion = True
            db_progress = models.Progress(
                user_id=current_user.id,
                course_id=lesson.course_id,
                lesson_id=lesson.id,
                status="completed",
                completion_pct=100.0
            )
            db.add(db_progress)

        if is_new_completion:
            xp_awarded = 100
            current_user.xp += xp_awarded

        db.commit()

    return schemas.QuizEvaluationResponse(
        passed=passed,
        score_pct=score_pct,
        correct_count=correct_count,
        total_questions=total_questions,
        xp_awarded=xp_awarded,
        results=results
    )

