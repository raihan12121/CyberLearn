from pydantic import BaseModel, EmailStr, ConfigDict, Field
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
    is_verified: bool = False
    verification_status: Optional[str] = "unverified"
    nid_number: Optional[str] = None
    verification_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    xp: int
    streak_days: int
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VerifyEmailRequest(BaseModel):
    token: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class OAuthCallbackRequest(BaseModel):
    provider: str
    code: str
    redirect_uri: Optional[str] = None

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
    video_url: Optional[str] = None
    sort_order: Optional[int] = 0
    duration: Optional[int] = 0

class LessonResponse(LessonBase):
    id: str
    course_id: str

    model_config = ConfigDict(from_attributes=True)

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
    xp: Optional[int] = 1200
    lessons: List[LessonResponse] = []

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)

# Community Schemas
class PostCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = "General"

class PostResponse(BaseModel):
    id: str
    user_id: str
    author_name: Optional[str] = None
    author_username: Optional[str] = None
    author_avatar: Optional[str] = None
    title: str
    content: str
    category: Optional[str]
    upvotes: int
    has_upvoted: Optional[bool] = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProgressUpdate(BaseModel):
    course_id: str
    lesson_id: str
    status: str = Field(..., pattern="^(in_progress|completed)$")  # in_progress, completed
    completion_pct: float = Field(..., ge=0.0, le=100.0)

class ProgressResponse(BaseModel):
    id: str
    user_id: str
    course_id: str
    lesson_id: str
    status: str
    completion_pct: float
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SocialLoginRequest(BaseModel):
    provider: str  # e.g. "google", "github"
    email: EmailStr  # User's email from the OAuth provider
    full_name: Optional[str] = None  # User's display name from the OAuth provider
    provider_token: str  # OAuth access token for server-side verification

# Quiz Schemas
class QuizAnswerItem(BaseModel):
    question_id: str
    selected_option: int

class QuizSubmissionRequest(BaseModel):
    answers: List[QuizAnswerItem]

class QuizQuestionResult(BaseModel):
    question_id: str
    correct: bool
    selected_option: int
    correct_option: int
    explanation: str

class QuizEvaluationResponse(BaseModel):
    passed: bool
    score_pct: float
    correct_count: int
    total_questions: int
    xp_awarded: int
    results: List[QuizQuestionResult]


# NID / Human Verification Schemas
class NidVerificationRequest(BaseModel):
    nid_number: str
    nid_front_image: Optional[str] = None # Base64 or URL
    nid_back_image: Optional[str] = None

class NidVerificationReviewRequest(BaseModel):
    status: str # "verified" or "rejected"
    notes: Optional[str] = None

class NidVerificationResponse(BaseModel):
    user_id: str
    full_name: Optional[str]
    email: str
    nid_number: Optional[str]
    nid_front_image: Optional[str]
    nid_back_image: Optional[str]
    verification_status: str
    verification_notes: Optional[str]
    verified_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Batch Schemas
class BatchBase(BaseModel):
    name: str
    description: Optional[str] = None
    course_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_students: Optional[int] = 50
    meeting_link: Optional[str] = None
    schedule_details: Optional[str] = None
    is_active: Optional[bool] = True

class BatchCreate(BatchBase):
    pass

class BatchResponse(BatchBase):
    id: str
    batch_code: str
    instructor_id: str
    instructor_name: Optional[str] = None
    course_title: Optional[str] = None
    enrolled_count: int = 0
    is_enrolled: Optional[bool] = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BatchDetailResponse(BatchResponse):
    students: List[dict] = []


# Multi-Session AI Coach Schemas
class AiSessionCreate(BaseModel):
    title: Optional[str] = "New AI Security Session"
    system_prompt: Optional[str] = None
    model_type: Optional[str] = "gemini-3.5-flash-lite"


class AiChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AiSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    system_prompt: Optional[str] = None
    model_type: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    message_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class AiSessionChatRequest(BaseModel):
    message: str
    override_system_prompt: Optional[str] = None


# Exam & Assessment Schemas
class ExamQuestionBase(BaseModel):
    question_text: str
    question_type: Optional[str] = "mcq"
    options: List[str] = []
    points: Optional[int] = 10
    sort_order: Optional[int] = 0

class ExamQuestionCreate(ExamQuestionBase):
    correct_answer: str
    explanation: Optional[str] = None

class ExamQuestionPublicResponse(ExamQuestionBase):
    id: str
    exam_id: str

    model_config = ConfigDict(from_attributes=True)

class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: Optional[int] = 30
    passing_score_pct: Optional[int] = 70
    total_marks: Optional[int] = 100
    is_published: Optional[bool] = True

class ExamCreate(ExamBase):
    course_id: str
    questions: Optional[List[ExamQuestionCreate]] = []

class ExamResponse(ExamBase):
    id: str
    course_id: str
    question_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ExamDetailResponse(ExamResponse):
    questions: List[ExamQuestionPublicResponse] = []

class ExamAnswerSubmission(BaseModel):
    question_id: str
    selected_answer: str

class ExamSubmitRequest(BaseModel):
    answers: List[ExamAnswerSubmission]

class ExamSubmissionResponse(BaseModel):
    id: str
    exam_id: str
    user_id: str
    score: float
    total_score: float
    score_pct: float
    passed: bool
    certificate_token: Optional[str] = None
    submitted_at: datetime
    breakdown: Optional[List[dict]] = None
