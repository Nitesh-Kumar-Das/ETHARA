from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, validator


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8)
    role: Optional[str] = "TASKER"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class RoleSwitchRequest(BaseModel):
    role: str  # ADMIN or TASKER


# ─── User Schemas ─────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    active_role: str
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    avatar_url: Optional[str] = None


# ─── Project Schemas ──────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = "#628ECB"


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


class ProjectOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: str
    is_active: bool
    owner_id: Optional[str] = None
    owner: Optional[UserOut] = None
    members: List[UserOut] = []
    task_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Task Schemas ─────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = "TODO"
    priority: Optional[str] = "MEDIUM"
    due_date: Optional[datetime] = None
    project_id: str
    assignee_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    assignee_id: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    status: str


class TaskOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    project_id: str
    project: Optional[ProjectOut] = None
    assignee_id: Optional[str] = None
    assignee: Optional[UserOut] = None
    creator_id: Optional[str] = None
    creator: Optional[UserOut] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Dashboard Schemas ────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_projects: int
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    overdue_tasks: int
    todo_tasks: int
    total_members: int
    completion_rate: float


# ─── Member Management ────────────────────────────────────────────────────────

class AddMemberRequest(BaseModel):
    user_id: str


class MessageResponse(BaseModel):
    message: str


# Update forward ref
TokenResponse.model_rebuild()
