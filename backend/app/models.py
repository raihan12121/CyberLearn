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
    xp = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sessions = relationship("LabSession", back_populates="user")
    progress = relationship("Progress", back_populates="user")
    achievements = relationship("Achievement", back_populates="user")
    certificates = relationship("Certificate", back_populates="user")
    posts = relationship("Post", back_populates="user")


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


class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    verification_token = Column(String(255), unique=True, nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")


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
