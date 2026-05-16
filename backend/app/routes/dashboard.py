from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get dashboard analytics stats based on active role."""
    now = datetime.now(timezone.utc)

    if current_user.get("active_role") == models.UserRole.ADMIN:
        # Admin sees global stats
        total_projects = await db["projects"].count_documents({"is_active": True})
        total_members = await db["users"].count_documents({"is_active": True})

        total_tasks = await db["tasks"].count_documents({})
        completed_tasks = await db["tasks"].count_documents({"status": models.TaskStatus.DONE.value})
        in_progress_tasks = await db["tasks"].count_documents({"status": models.TaskStatus.IN_PROGRESS.value})
        todo_tasks = await db["tasks"].count_documents({"status": models.TaskStatus.TODO.value})
        overdue_tasks = await db["tasks"].count_documents({
            "due_date": {"$lt": now},
            "status": {"$ne": models.TaskStatus.DONE.value}
        })
    else:
        # Tasker sees only their stats
        total_projects = await db["projects"].count_documents({
            "is_active": True,
            "member_ids": current_user["id"]
        })
        total_members = 0

        total_tasks = await db["tasks"].count_documents({"assignee_id": current_user["id"]})
        completed_tasks = await db["tasks"].count_documents({
            "assignee_id": current_user["id"],
            "status": models.TaskStatus.DONE.value
        })
        in_progress_tasks = await db["tasks"].count_documents({
            "assignee_id": current_user["id"],
            "status": models.TaskStatus.IN_PROGRESS.value
        })
        todo_tasks = await db["tasks"].count_documents({
            "assignee_id": current_user["id"],
            "status": models.TaskStatus.TODO.value
        })
        overdue_tasks = await db["tasks"].count_documents({
            "assignee_id": current_user["id"],
            "due_date": {"$lt": now},
            "status": {"$ne": models.TaskStatus.DONE.value}
        })

    completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    return schemas.DashboardStats(
        total_projects=total_projects,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        in_progress_tasks=in_progress_tasks,
        overdue_tasks=overdue_tasks,
        todo_tasks=todo_tasks,
        total_members=total_members,
        completion_rate=completion_rate,
    )
