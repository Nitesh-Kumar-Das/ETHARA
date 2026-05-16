"use client";

import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { dashboardService, taskService } from "@/services/tasks";
import { DashboardStats, Task } from "@/types";
import { useEffect, useState } from "react";
import {
  FolderKanban, CheckSquare, AlertTriangle, Users,
  TrendingUp, Clock, CircleCheck, Circle,
} from "lucide-react";
import { format, isAfter } from "date-fns";
import toast from "react-hot-toast";

function StatCard({
  icon, label, value, color, subtext, onClick,
}: {
  icon: React.ReactNode; label: string; value: number | string; color: string; subtext?: string; onClick?: () => void;
}) {
  return (
    <div 
      className="stat-card" 
      onClick={onClick}
      style={{ 
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 12px 24px rgba(57, 88, 134, 0.12)";
          e.currentTarget.style.borderColor = "rgba(138, 174, 224, 0.8)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(57, 88, 134, 0.08)";
          e.currentTarget.style.borderColor = "var(--glass-border)";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(57,88,134,0.6)", marginBottom: 8 }}>
            {label}
          </p>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "2.2rem", fontWeight: 800, color: "#1e2d45", lineHeight: 1 }}>
            {value}
          </p>
          {subtext && <p style={{ fontSize: "0.78rem", color: "rgba(57,88,134,0.55)", marginTop: 6 }}>{subtext}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: color, display: "flex", alignItems: "center",
          justifyContent: "center", color: "white", flexShrink: 0,
          boxShadow: `0 4px 14px ${color}66`,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    TODO: "badge-todo", IN_PROGRESS: "badge-in-progress",
    IN_REVIEW: "badge-in-review", DONE: "badge-done",
  };
  const labels: Record<string, string> = {
    TODO: "To Do", IN_PROGRESS: "In Progress", IN_REVIEW: "In Review", DONE: "Done",
  };
  return <span className={`badge ${map[status] || "badge-todo"}`}>{labels[status] || status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    LOW: "badge-low", MEDIUM: "badge-medium", HIGH: "badge-high", CRITICAL: "badge-critical",
  };
  return <span className={`badge ${map[priority] || "badge-medium"}`}>{priority}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [s, t] = await Promise.all([
          dashboardService.getStats(),
          taskService.list(),
        ]);
        setStats(s);
        setRecentTasks(t.slice(0, 5));
      } catch {
        toast.success("Account created! Welcome aboard");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.active_role]);

  return (
    <AppShell>
      <div style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="page-header">
            Welcome back, {user?.full_name.split(" ")[0]}
          </h1>
          <p className="page-subheader">
            Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
              <StatCard 
                icon={<FolderKanban size={20} />} 
                label="Projects" 
                value={stats?.total_projects ?? 0} 
                color="#628ECB" 
                subtext="Active projects" 
                onClick={() => router.push("/projects")}
              />
              <StatCard 
                icon={<CheckSquare size={20} />} 
                label="Total Tasks" 
                value={stats?.total_tasks ?? 0} 
                color="#8AAEE0" 
                subtext="All tasks" 
                onClick={() => router.push("/tasks")}
              />
              <StatCard 
                icon={<CircleCheck size={20} />} 
                label="Completed" 
                value={stats?.completed_tasks ?? 0} 
                color="#22c55e" 
                subtext="Done tasks" 
                onClick={() => router.push("/tasks?status=DONE")}
              />
              <StatCard 
                icon={<Clock size={20} />} 
                label="In Progress" 
                value={stats?.in_progress_tasks ?? 0} 
                color="#f59e0b" 
                subtext="Active tasks" 
                onClick={() => router.push("/tasks?status=IN_PROGRESS")}
              />
              <StatCard 
                icon={<AlertTriangle size={20} />} 
                label="Overdue" 
                value={stats?.overdue_tasks ?? 0} 
                color="#e05555" 
                subtext="Past due date" 
                onClick={() => router.push("/tasks?overdue=true")}
              />
              {user?.active_role === "ADMIN" && (
                <StatCard 
                  icon={<Users size={20} />} 
                  label="Members" 
                  value={stats?.total_members ?? 0} 
                  color="#395886" 
                  subtext="Team members" 
                  onClick={() => router.push("/members")}
                />
              )}
            </div>

            {/* Completion Rate */}
            {stats && (
              <div className="glass-card-static" style={{ padding: 24, marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <TrendingUp size={18} style={{ color: "#628ECB" }} />
                    <span style={{ fontWeight: 600, color: "#395886", fontSize: "0.95rem" }}>Completion Rate</span>
                  </div>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "#395886" }}>
                    {stats.completion_rate}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${stats.completion_rate}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: "0.75rem", color: "rgba(57,88,134,0.55)" }}>{stats.completed_tasks} completed</span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(57,88,134,0.55)" }}>{stats.total_tasks} total</span>
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            <div className="glass-card-static" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "#395886", marginBottom: 16 }}>
                Recent Tasks
              </h3>
              {recentTasks.length === 0 ? (
                <div className="empty-state">
                  <Circle size={40} style={{ opacity: 0.3 }} />
                  <p>No tasks found</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="glass-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Assignee</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTasks.map((task) => {
                        const isOverdue = task.due_date &&
                          isAfter(new Date(), new Date(task.due_date)) &&
                          task.status !== "DONE";
                        return (
                          <tr key={task.id}>
                            <td>
                              <div style={{ fontWeight: 500, color: "#1e2d45" }}>{task.title}</div>
                              {task.project && (
                                <div style={{ fontSize: "0.75rem", color: "rgba(57,88,134,0.55)" }}>
                                  <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>{task.project.name}</span>
                                </div>
                              )}
                            </td>
                            <td><StatusBadge status={task.status} /></td>
                            <td><PriorityBadge priority={task.priority} /></td>
                            <td>
                              {task.assignee ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <div className="avatar avatar-sm" style={{ fontSize: "0.65rem" }}>
                                    {task.assignee.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </div>
                                  <span style={{ fontSize: "0.825rem" }}>{task.assignee.full_name}</span>
                                </div>
                              ) : (
                                <span style={{ fontSize: "0.8rem", color: "rgba(57,88,134,0.45)" }}>Unassigned</span>
                              )}
                            </td>
                            <td>
                              {task.due_date ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: "0.825rem" }}>
                                    {format(new Date(task.due_date), "MMM d, yyyy")}
                                  </span>
                                  {isOverdue && <span className="overdue-tag">Overdue</span>}
                                </div>
                              ) : (
                                <span style={{ fontSize: "0.8rem", color: "rgba(57,88,134,0.4)" }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
