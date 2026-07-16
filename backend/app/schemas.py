from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    username: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    xp: int
    streak_days: int
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

# Lesson Schemas
class LessonBase(BaseModel):
    title: str
    content_type: str # video, reading, quiz
    content: Optional[str] = None
    sort_order: Optional[int] = 0
    duration: Optional[int] = 0

class LessonResponse(LessonBase):
    id: str
    course_id: str

    class Config:
        from_attributes = True

# Course Schemas
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None
    estimated_duration: Optional[int] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = False

class CourseResponse(CourseBase):
    id: str
    lessons: List[LessonResponse] = []

    class Config:
        from_attributes = True

# Lab Schemas
class LabBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    difficulty: Optional[str] = None
    container_template: Optional[str] = None
    xp_reward: Optional[int] = 100
    time_limit: Optional[int] = 3600

class LabResponse(LabBase):
    id: str

    class Config:
        from_attributes = True

# Lab Session Schemas
class LabStartRequest(BaseModel):
    lab_id: str

class LabSessionResponse(BaseModel):
    id: str
    user_id: str
    lab_id: str
    container_id: Optional[str] = None
    status: str
    started_at: datetime
    expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Community Schemas
class PostCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = "General"

class PostResponse(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    category: Optional[str]
    upvotes: int
    created_at: datetime

    class Config:
        from_attributes = True

class ProgressUpdate(BaseModel):
    course_id: str
    lesson_id: str
    status: str  # in_progress, completed
    completion_pct: float

class ProgressResponse(BaseModel):
    id: str
    user_id: str
    course_id: str
    lesson_id: str
    status: str
    completion_pct: float
    updated_at: datetime

    class Config:
        from_attributes = True

class SocialLoginRequest(BaseModel):
    provider: str  # e.g. "google", "github"
    email: EmailStr  # User's email from the OAuth provider
    full_name: Optional[str] = None  # User's display name from the OAuth provider
    provider_token: str  # OAuth access token for server-side verification

