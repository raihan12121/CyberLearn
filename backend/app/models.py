import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Text, JSON, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(20), default="student") # student, instructor, admin
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True, index=True)
    xp = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    avatar_url = Column(Text, nullable=True)
    
    # Human/NID Identity Verification fields
    nid_number = Column(String(50), nullable=True)
    nid_front_image = Column(Text, nullable=True)
    nid_back_image = Column(Text, nullable=True)
    verification_status = Column(String(20), default="unverified") # unverified, pending, verified, rejected
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sessions = relationship("LabSession", back_populates="user")
    progress = relationship("Progress", back_populates="user")
    achievements = relationship("Achievement", back_populates="user")
    certificates = relationship("Certificate", back_populates="user")
    posts = relationship("Post", back_populates="user")
    batch_enrollments = relationship("BatchEnrollment", back_populates="user")
    ai_sessions = relationship("AiSession", back_populates="user")
    exam_submissions = relationship("ExamSubmission", back_populates="user")


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String(20), nullable=True) # beginner, intermediate, advanced, expert
    category = Column(String(100), nullable=True)
    estimated_duration = Column(Integer, nullable=True) # minutes
    thumbnail_url = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")
    progress = relationship("Progress", back_populates="course")
    certificates = relationship("Certificate", back_populates="course")
    batches = relationship("Batch", back_populates="course")
    exams = relationship("Exam", back_populates="course", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content_type = Column(String(20), nullable=False) # video, reading, quiz
    content = Column(Text, nullable=True) # Markdown reading or JSON structure
    video_url = Column(Text, nullable=True) # Embedded YouTube video URL
    sort_order = Column(Integer, default=0)
    duration = Column(Integer, default=0) # minutes

    course = relationship("Course", back_populates="lessons")
    progress = relationship("Progress", back_populates="lesson", cascade="all, delete-orphan")


class Lab(Base):
    __tablename__ = "labs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(50), nullable=True) # linux, networking, web_security, cloud, blue_team, ai_security
    difficulty = Column(String(20), nullable=True)
    container_template = Column(String(100), nullable=True)
    xp_reward = Column(Integer, default=100)
    time_limit = Column(Integer, default=3600) # seconds

    sessions = relationship("LabSession", back_populates="lab")


class LabSession(Base):
    __tablename__ = "lab_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    lab_id = Column(String(36), ForeignKey("labs.id"), nullable=False)
    container_id = Column(String(255), nullable=True)
    status = Column(String(20), default="starting") # starting, running, paused, completed, stopped
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="sessions")
    lab = relationship("Lab", back_populates="sessions")


class Progress(Base):
    __tablename__ = "progress"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    lesson_id = Column(String(36), ForeignKey("lessons.id"), nullable=False)
    status = Column(String(20), default="in_progress") # in_progress, completed
    completion_pct = Column(Numeric(5, 2), default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="progress")
    course = relationship("Course", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")


class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    badge_name = Column(String(100), nullable=False)
    badge_icon = Column(Text, nullable=True)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="achievements")


# Batch & Cohort Management
class Batch(Base):
    __tablename__ = "batches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    batch_code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    instructor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    max_students = Column(Integer, default=50)
    meeting_link = Column(String(255), nullable=True)
    schedule_details = Column(Text, nullable=True) # e.g. "Sat & Tue at 8:00 PM GMT+6"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    instructor = relationship("User", foreign_keys=[instructor_id])
    course = relationship("Course", back_populates="batches")
    enrollments = relationship("BatchEnrollment", back_populates="batch", cascade="all, delete-orphan")


class BatchEnrollment(Base):
    __tablename__ = "batch_enrollments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("batches.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="enrolled") # enrolled, completed, dropped
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("Batch", back_populates="enrollments")
    user = relationship("User", back_populates="batch_enrollments")


# Multi-Session AI Coach with Custom System Prompts
class AiSession(Base):
    __tablename__ = "ai_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False, default="Cyber Security Tutoring")
    system_prompt = Column(Text, nullable=True) # Custom Persona/Instructions
    model_type = Column(String(50), default="gemini-1.5-flash")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="ai_sessions")
    messages = relationship("AiChatMessage", back_populates="session", cascade="all, delete-orphan")


class AiChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("ai_sessions.id"), nullable=False)
    role = Column(String(20), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("AiSession", back_populates="messages")


# Exams & Assessments
class Exam(Base):
    __tablename__ = "exams"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=30)
    passing_score_pct = Column(Integer, default=70)
    total_marks = Column(Integer, default=100)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="exams")
    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")
    submissions = relationship("ExamSubmission", back_populates="exam", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="exam")


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(20), default="mcq") # mcq, boolean, practical
    options = Column(JSON, nullable=True) # list of option strings
    correct_answer = Column(Text, nullable=False) # string index or text
    explanation = Column(Text, nullable=True)
    points = Column(Integer, default=10)
    sort_order = Column(Integer, default=0)

    exam = relationship("Exam", back_populates="questions")


class ExamSubmission(Base):
    __tablename__ = "exam_submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    score = Column(Numeric(5, 2), default=0.0)
    total_score = Column(Numeric(5, 2), default=0.0)
    score_pct = Column(Numeric(5, 2), default=0.0)
    passed = Column(Boolean, default=False)
    answers = Column(JSON, nullable=True) # user submitted answers map
    certificate_token = Column(String(255), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    exam = relationship("Exam", back_populates="submissions")
    user = relationship("User", back_populates="exam_submissions")


class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=True)
    score_pct = Column(Numeric(5, 2), nullable=True)
    certificate_type = Column(String(50), default="course_completion") # course_completion, exam_certified
    verification_token = Column(String(255), unique=True, nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")
    exam = relationship("Exam", back_populates="certificates")


class Post(Base):
    __tablename__ = "posts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)
    upvotes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="posts")
