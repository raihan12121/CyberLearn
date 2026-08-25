import uuid
from sqlalchemy import (
    Column, String, Integer, Boolean, ForeignKey, DateTime, Text, JSON, Numeric,
    Index, UniqueConstraint
)
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
    role = Column(String(20), default="student", index=True) # student, instructor, admin
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True, index=True)
    xp = Column(Integer, default=0, index=True)
    streak_days = Column(Integer, default=0)
    avatar_url = Column(Text, nullable=True)
    
    # Human/NID Identity Verification fields
    nid_number = Column(String(50), nullable=True, index=True)
    nid_front_image = Column(Text, nullable=True)
    nid_back_image = Column(Text, nullable=True)
    verification_status = Column(String(20), default="unverified", index=True) # unverified, pending, verified, rejected
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Subscription & Access Control fields
    subscription_tier = Column(String(50), default="free", index=True) # free, pro, premium
    subscription_status = Column(String(20), default="inactive", index=True) # inactive, active, canceled, expired
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sessions = relationship("LabSession", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("Progress", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    batch_enrollments = relationship("BatchEnrollment", back_populates="user", cascade="all, delete-orphan")
    ai_sessions = relationship("AiSession", back_populates="user", cascade="all, delete-orphan")
    exam_submissions = relationship("ExamSubmission", back_populates="user", cascade="all, delete-orphan")
    post_votes = relationship("PostVote", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")
    course_purchases = relationship("CoursePurchase", back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String(20), nullable=True, index=True) # beginner, intermediate, advanced, expert
    category = Column(String(100), nullable=True, index=True)
    price = Column(Numeric(10, 2), default=49.00) # One-time lifetime purchase price
    estimated_duration = Column(Integer, nullable=True) # minutes
    thumbnail_url = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")
    progress = relationship("Progress", back_populates="course")
    certificates = relationship("Certificate", back_populates="course")
    batches = relationship("Batch", back_populates="course")
    exams = relationship("Exam", back_populates="course", cascade="all, delete-orphan")
    purchases = relationship("CoursePurchase", back_populates="course", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content_type = Column(String(20), nullable=False) # video, reading, quiz
    content = Column(Text, nullable=True) # Markdown reading or JSON structure
    video_url = Column(Text, nullable=True) # Embedded YouTube video URL
    sort_order = Column(Integer, default=0, index=True)
    duration = Column(Integer, default=0) # minutes

    course = relationship("Course", back_populates="lessons")
    progress = relationship("Progress", back_populates="lesson", cascade="all, delete-orphan")


class Lab(Base):
    __tablename__ = "labs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(50), nullable=True, index=True) # linux, networking, web_security, cloud, blue_team, ai_security
    difficulty = Column(String(20), nullable=True, index=True)
    container_template = Column(String(100), nullable=True)
    xp_reward = Column(Integer, default=100)
    time_limit = Column(Integer, default=3600) # seconds

    sessions = relationship("LabSession", back_populates="lab")


class LabSession(Base):
    __tablename__ = "lab_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    lab_id = Column(String(36), ForeignKey("labs.id"), nullable=False, index=True)
    container_id = Column(String(255), nullable=True)
    status = Column(String(20), default="starting", index=True) # starting, running, paused, completed, stopped
    started_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="sessions")
    lab = relationship("Lab", back_populates="sessions")


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", "lesson_id", name="uq_user_course_lesson"),
        Index("ix_progress_user_course", "user_id", "course_id"),
    )
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False, index=True)
    lesson_id = Column(String(36), ForeignKey("lessons.id"), nullable=False, index=True)
    status = Column(String(20), default="in_progress", index=True) # in_progress, completed
    completion_pct = Column(Numeric(5, 2), default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="progress")
    course = relationship("Course", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")


class Achievement(Base):
    __tablename__ = "achievements"
    __table_args__ = (
        Index("ix_achievements_user_badge", "user_id", "badge_name"),
    )
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    badge_name = Column(String(100), nullable=False)
    badge_icon = Column(Text, nullable=True)
    earned_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="achievements")


# Batch & Cohort Management
class Batch(Base):
    __tablename__ = "batches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    batch_code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    instructor_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=True, index=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    max_students = Column(Integer, default=50)
    meeting_link = Column(String(255), nullable=True)
    schedule_details = Column(Text, nullable=True) # e.g. "Sat & Tue at 8:00 PM GMT+6"
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    instructor = relationship("User", foreign_keys=[instructor_id])
    course = relationship("Course", back_populates="batches")
    enrollments = relationship("BatchEnrollment", back_populates="batch", cascade="all, delete-orphan")


class BatchEnrollment(Base):
    __tablename__ = "batch_enrollments"
    __table_args__ = (
        UniqueConstraint("batch_id", "user_id", name="uq_batch_user_enrollment"),
        Index("ix_batch_enrollment_lookup", "batch_id", "user_id"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("batches.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), default="enrolled", index=True) # enrolled, completed, dropped
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    batch = relationship("Batch", back_populates="enrollments")
    user = relationship("User", back_populates="batch_enrollments")


# Multi-Session AI Coach with Custom System Prompts
class AiSession(Base):
    __tablename__ = "ai_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Cyber Security Tutoring")
    system_prompt = Column(Text, nullable=True) # Custom Persona/Instructions
    model_type = Column(String(50), default="gemini-3.5-flash-lite")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), index=True)

    user = relationship("User", back_populates="ai_sessions")
    messages = relationship("AiChatMessage", back_populates="session", cascade="all, delete-orphan")


class AiChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("ai_sessions.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    session = relationship("AiSession", back_populates="messages")


# Exams & Assessments
class Exam(Base):
    __tablename__ = "exams"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=30)
    passing_score_pct = Column(Integer, default=70)
    total_marks = Column(Integer, default=100)
    is_published = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="exams")
    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")
    submissions = relationship("ExamSubmission", back_populates="exam", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="exam")


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(20), default="mcq") # mcq, boolean, practical
    options = Column(JSON, nullable=True) # list of option strings
    correct_answer = Column(Text, nullable=False) # string index or text
    explanation = Column(Text, nullable=True)
    points = Column(Integer, default=10)
    sort_order = Column(Integer, default=0, index=True)

    exam = relationship("Exam", back_populates="questions")


class ExamSubmission(Base):
    __tablename__ = "exam_submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    score = Column(Numeric(5, 2), default=0.0)
    total_score = Column(Numeric(5, 2), default=0.0)
    score_pct = Column(Numeric(5, 2), default=0.0)
    passed = Column(Boolean, default=False, index=True)
    answers = Column(JSON, nullable=True) # user submitted answers map
    certificate_token = Column(String(255), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    exam = relationship("Exam", back_populates="submissions")
    user = relationship("User", back_populates="exam_submissions")


class Certificate(Base):
    __tablename__ = "certificates"
    __table_args__ = (
        Index("ix_certificate_user_course", "user_id", "course_id"),
    )
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False, index=True)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=True, index=True)
    score_pct = Column(Numeric(5, 2), nullable=True)
    certificate_type = Column(String(50), default="course_completion", index=True) # course_completion, exam_certified
    verification_token = Column(String(255), unique=True, nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")
    exam = relationship("Exam", back_populates="certificates")


class Post(Base):
    __tablename__ = "posts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), nullable=True, index=True)
    upvotes = Column(Integer, default=0, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="posts")
    votes = relationship("PostVote", back_populates="post", cascade="all, delete-orphan")


class PostVote(Base):
    __tablename__ = "post_votes"
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_user_post_vote"),
        Index("ix_post_votes_lookup", "user_id", "post_id"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    post_id = Column(String(36), ForeignKey("posts.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="post_votes")
    post = relationship("Post", back_populates="votes")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    purchase_type = Column(String(50), default="subscription", index=True) # subscription, course_lifetime
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=True, index=True)
    plan_tier = Column(String(50), nullable=True, index=True) # pro, premium, lifetime
    billing_cycle = Column(String(20), default="monthly") # monthly, annually, 1-month, 2-months, 3-months, 6-months, lifetime
    currency = Column(String(10), default="USD")
    subtotal = Column(Numeric(10, 2), default=0.00)
    discount_amount = Column(Numeric(10, 2), default=0.00)
    tax_amount = Column(Numeric(10, 2), default=0.00)
    total_paid = Column(Numeric(10, 2), default=0.00)
    payment_method = Column(String(50), default="credit_card") # credit_card, paypal, google_pay, crypto
    card_brand = Column(String(50), nullable=True) # visa, mastercard, amex, discover
    card_last4 = Column(String(10), nullable=True)
    cardholder_name = Column(String(255), nullable=True)
    billing_country = Column(String(100), nullable=True)
    billing_zip = Column(String(20), nullable=True)
    promo_code = Column(String(50), nullable=True)
    status = Column(String(20), default="paid", index=True) # paid, refunded, pending
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="invoices")
    course = relationship("Course")


class CoursePurchase(Base):
    __tablename__ = "course_purchases"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course_purchase"),
        Index("ix_course_purchases_lookup", "user_id", "course_id"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False, index=True)
    purchase_type = Column(String(50), default="lifetime") # lifetime
    amount_paid = Column(Numeric(10, 2), default=49.00)
    invoice_id = Column(String(36), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="course_purchases")
    course = relationship("Course", back_populates="purchases")


