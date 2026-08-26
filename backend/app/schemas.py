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
    subscription_tier: Optional[str] = "free"
    subscription_status: Optional[str] = "inactive"
    subscription_expires_at: Optional[datetime] = None
    is_subscribed: Optional[bool] = False
    xp: int
    streak_days: int
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    primary_focus: Optional[str] = None
    experience_level: Optional[str] = None
    is_onboarded: Optional[bool] = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OnboardingRequest(BaseModel):
    username: str
    full_name: Optional[str] = None
    primary_focus: Optional[str] = None
    experience_level: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UsernameCheckResponse(BaseModel):
    username: str
    available: bool
    message: str

class SubscriptionStatusResponse(BaseModel):
    tier: str
    status: str
    is_subscribed: bool
    expires_at: Optional[datetime] = None
    can_access_courses: bool
    can_access_labs: bool
    role: str

class VerifyEmailRequest(BaseModel):
    token: str

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

class ResendCodeRequest(BaseModel):
    email: EmailStr

class RegisterResponse(BaseModel):
    status: str
    message: str
    email: str
    requires_verification: bool = True
    dev_code: Optional[str] = None

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
    bio: Optional[str] = None
    primary_focus: Optional[str] = None
    experience_level: Optional[str] = None
    is_onboarded: Optional[bool] = None

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
    is_locked: Optional[bool] = False

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
    price: Optional[float] = 49.00
    xp: Optional[int] = 1200
    lessons: List[LessonResponse] = []
    is_purchased: Optional[bool] = False
    has_access: Optional[bool] = False
    access_type: Optional[str] = "none"

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
    tags: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    post_id: str
    user_id: str
    author_name: Optional[str] = None
    author_username: Optional[str] = None
    author_avatar: Optional[str] = None
    author_role: Optional[str] = None
    content: str
    is_solution: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PostResponse(BaseModel):
    id: str
    user_id: str
    author_name: Optional[str] = None
    author_username: Optional[str] = None
    author_avatar: Optional[str] = None
    title: str
    content: str
    category: Optional[str] = None
    tags: Optional[str] = None
    is_solved: bool = False
    upvotes: int = 0
    comment_count: int = 0
    has_upvoted: Optional[bool] = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PostDetailResponse(PostResponse):
    comments: List[CommentResponse] = []

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
    avatar_url: Optional[str] = None  # User's profile photo URL from Google/GitHub
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
    nid_front_image: Optional[str] = None
    nid_back_image: Optional[str] = None
    nid_front_url: Optional[str] = None
    nid_back_url: Optional[str] = None
    verification_status: str
    verification_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
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


# Billing & Payment Schemas
class ProcessPaymentRequest(BaseModel):
    purchase_type: str = "subscription" # "subscription" or "course_lifetime"
    plan_name: Optional[str] = "Pro" # "Pro" or "Premium"
    billing_period: Optional[str] = "monthly" # "monthly", "annually", or duration
    duration_months: Optional[int] = 1 # 1, 2, 3, 6, 12
    course_id: Optional[str] = None
    payment_method: str = "credit_card" # "credit_card", "paypal", "google_pay", "crypto"
    card_number: Optional[str] = None
    card_exp_month: Optional[int] = None
    card_exp_year: Optional[int] = None
    card_cvc: Optional[str] = None
    cardholder_name: Optional[str] = None
    billing_country: Optional[str] = "United States"
    billing_zip: Optional[str] = None
    promo_code: Optional[str] = None


class PromoValidationRequest(BaseModel):
    promo_code: str
    purchase_type: str = "subscription" # "subscription" or "course_lifetime"
    plan_name: Optional[str] = "Pro"
    billing_period: Optional[str] = "monthly"
    duration_months: Optional[int] = 1
    course_id: Optional[str] = None


class PromoValidationResponse(BaseModel):
    valid: bool
    promo_code: str
    discount_pct: float
    discount_amount: float
    original_price: float
    final_price: float
    message: str


class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    user_id: str
    purchase_type: Optional[str] = "subscription"
    course_id: Optional[str] = None
    plan_tier: Optional[str] = None
    billing_cycle: Optional[str] = None
    currency: str = "USD"
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_paid: float
    payment_method: str
    card_brand: Optional[str] = None
    card_last4: Optional[str] = None
    cardholder_name: Optional[str] = None
    billing_country: Optional[str] = None
    billing_zip: Optional[str] = None
    promo_code: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CoursePurchaseResponse(BaseModel):
    id: str
    user_id: str
    course_id: str
    course_title: Optional[str] = None
    purchase_type: str = "lifetime"
    amount_paid: float
    invoice_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Admin Control Panel Schemas
# ==========================================

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = "student" # student, instructor, admin
    subscription_tier: Optional[str] = "free" # free, pro, premium
    subscription_status: Optional[str] = "inactive"
    xp: Optional[int] = 0
    is_verified: Optional[bool] = False

class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    subscription_tier: Optional[str] = None
    subscription_status: Optional[str] = None
    xp: Optional[int] = None
    streak_days: Optional[int] = None
    is_verified: Optional[bool] = None
    verification_status: Optional[str] = None
    verification_notes: Optional[str] = None

class AdminCourseCreate(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    difficulty: Optional[str] = "Beginner"
    category: Optional[str] = "Web Security"
    price: Optional[float] = 49.00
    estimated_duration: Optional[int] = 300
    thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = True

class AdminCourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    estimated_duration: Optional[int] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = None

class AdminLessonCreate(BaseModel):
    id: Optional[str] = None
    title: str
    content_type: str = "video" # video, reading, quiz
    content: Optional[str] = None
    video_url: Optional[str] = None
    sort_order: Optional[int] = 0
    duration: Optional[int] = 10

class AdminLessonUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    sort_order: Optional[int] = None
    duration: Optional[int] = None

class AdminExamCreate(BaseModel):
    id: Optional[str] = None
    course_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    duration_minutes: Optional[int] = 45
    passing_score_pct: Optional[int] = 70
    total_marks: Optional[int] = 100
    is_published: Optional[bool] = True

class AdminExamUpdate(BaseModel):
    course_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    passing_score_pct: Optional[int] = None
    total_marks: Optional[int] = None
    is_published: Optional[bool] = None

class AdminQuestionCreate(BaseModel):
    question_text: str
    question_type: Optional[str] = "mcq"
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None
    points: Optional[int] = 5
    sort_order: Optional[int] = 0

class AdminQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    points: Optional[int] = None
    sort_order: Optional[int] = None

class AdminBatchCreate(BaseModel):
    name: str
    batch_code: Optional[str] = None
    description: Optional[str] = None
    instructor_id: Optional[str] = None
    course_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_students: Optional[int] = 50
    meeting_link: Optional[str] = None
    schedule_details: Optional[str] = None
    is_active: Optional[bool] = True

class AdminBatchUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    instructor_id: Optional[str] = None
    course_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_students: Optional[int] = None
    meeting_link: Optional[str] = None
    schedule_details: Optional[str] = None
    is_active: Optional[bool] = None

class AdminBatchEnrollRequest(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None

class AdminLabCreate(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    type: Optional[str] = "Linux"
    difficulty: Optional[str] = "Easy"
    container_template: Optional[str] = "linux-basic"
    xp_reward: Optional[int] = 100
    time_limit: Optional[int] = 1800

class AdminLabUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    difficulty: Optional[str] = None
    container_template: Optional[str] = None
    xp_reward: Optional[int] = None
    time_limit: Optional[int] = None

class AdminManualCertIssue(BaseModel):
    user_id: str
    course_id: Optional[str] = None
    exam_id: Optional[str] = None
    score_pct: Optional[float] = 100.0
    certificate_type: Optional[str] = "course_completion" # course_completion, exam_certified

class AdminInvoiceStatusUpdate(BaseModel):
    status: str # paid, refunded, void, pending

