"use client";

import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { taskService } from "@/services/tasks";
import { projectService } from "@/services/projects";
import { userService } from "@/services/auth";
import { Task, TaskStatus, Project, User } from "@/types";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus, CheckSquare, Trash2, Edit3, X, Check,
  Clock, AlertTriangle, Circle, ChevronDown,
} from "lucide-react";
import { format, isAfter } from "date-fns";
import toast from "react-hot-toast";
import axios from "axios";

type FilterStatus = "ALL" | TaskStatus | "OVERDUE";

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

function TaskModal({
  task, projects, users, onClose, onSave
}: {
  task?: Task | null; projects: Project[]; users: User[];
  onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "TODO",
    priority: task?.priority || "MEDIUM",
    due_date: task?.due_date ? task.due_date.slice(0, 16) : "",
    project_id: task?.project_id || "",
    assignee_id: task?.assignee_id || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_id) { toast.error("Please select a project"); return; }
    setIsLoading(true);
    try {
      const payload = {
        ...form,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        assignee_id: form.assignee_id || null,
      } as Parameters<typeof taskService.create>[0];

      if (task) {
        await taskService.update(task.id, payload);
        toast.success("Task updated");
      } else {
        await taskService.create(payload);
        toast.success("Task created");
      }
      onSave();
    } catch (err) {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.detail || "Failed");
      else toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#395886" }}>
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(57,88,134,0.5)", display: "flex", alignItems: "center", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="form-label">Title *</label>
            <input id="task-title-input" className="glass-input" type="text" placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="glass-textarea" placeholder="Task description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="form-label">Status</label>
              <select className="glass-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select className="glass-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as import("@/types").TaskPriority })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Project *</label>
            <select id="task-project-select" className="glass-select" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} required>
              <option value="">Select project...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Assignee</label>
            <select id="task-assignee-select" className="glass-select" value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Due Date</label>
            <input className="glass-input" type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="glass-button-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button id="task-save-btn" type="submit" className="glass-button" disabled={isLoading} style={{ flex: 1 }}>
              {isLoading ? "Saving..." : <><Check size={15} /> {task ? "Update" : "Create"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickStatusModal({
  task, onClose, onSave
}: {
  task: Task; onClose: () => void; onSave: () => void;
}) {
  const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
  const labels: Record<string, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", IN_REVIEW: "In Review", DONE: "Done" };

  const handleChange = async (status: TaskStatus) => {
    try {
      await taskService.updateStatus(task.id, status);
      toast.success("Status updated");
      onSave();
    } catch (err) {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.detail || "Failed");
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ padding: 24, maxWidth: 320 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#395886", fontSize: "1rem" }}>Update Status</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(57,88,134,0.5)" }}><X size={16} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {statuses.map((s) => (
            <button key={s} onClick={() => handleChange(s)} style={{
              padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${task.status === s ? "#628ECB" : "rgba(177,201,239,0.4)"}`,
              background: task.status === s ? "rgba(98,142,203,0.15)" : "rgba(255,255,255,0.6)",
              cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem",
              fontWeight: task.status === s ? 600 : 400, color: "#1e2d45", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 8
            }}>
              {task.status === s && <Check size={14} style={{ color: "#628ECB" }} />}
              {labels[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TasksContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isAdmin = user?.active_role === "ADMIN";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [filterProject, setFilterProject] = useState<string>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [statusTask, setStatusTask] = useState<Task | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [t, p, u] = await Promise.all([
        taskService.list(),
        projectService.list(),
        userService.listUsers(),
      ]);
      setTasks(t);
      setProjects(p);
      setUsers(u);
      
      // Handle initial filters from URL
      const statusParam = searchParams.get("status");
      const overdueParam = searchParams.get("overdue");
      
      if (overdueParam === "true") {
        setFilterStatus("OVERDUE");
      } else if (statusParam) {
        setFilterStatus(statusParam as FilterStatus);
      }
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [searchParams]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await taskService.delete(id);
      toast.success("Task deleted");
      load();
    } catch (err) {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const filtered = tasks.filter((t) => {
    const isOverdue = t.due_date && isAfter(new Date(), new Date(t.due_date)) && t.status !== "DONE";
    
    if (filterStatus === "OVERDUE") {
      if (!isOverdue) return false;
    } else if (filterStatus !== "ALL" && t.status !== filterStatus) {
      return false;
    }
    
    if (filterProject !== "ALL" && t.project_id !== filterProject) return false;
    return true;
  });

  const statusCounts = {
    ALL: tasks.length,
    TODO: tasks.filter((t) => t.status === "TODO").length,
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    IN_REVIEW: tasks.filter((t) => t.status === "IN_REVIEW").length,
    DONE: tasks.filter((t) => t.status === "DONE").length,
    OVERDUE: tasks.filter((t) => t.due_date && isAfter(new Date(), new Date(t.due_date)) && t.status !== "DONE").length,
  };

  const filterBtns: { key: FilterStatus; label: string; color?: string }[] = [
    { key: "ALL", label: "All" },
    { key: "TODO", label: "To Do" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "IN_REVIEW", label: "In Review" },
    { key: "DONE", label: "Done" },
    { key: "OVERDUE", label: "Overdue", color: "#e05555" },
  ];

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 className="page-header">Tasks</h1>
          <p className="page-subheader">{filtered.length} of {tasks.length} tasks</p>
        </div>
        {isAdmin && (
          <button id="new-task-btn" className="glass-button" onClick={() => { setEditTask(null); setShowModal(true); }}>
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {filterBtns.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              style={{
                padding: "6px 14px", borderRadius: 999, border: "1.5px solid",
                borderColor: filterStatus === key ? (color || "#628ECB") : "rgba(177,201,239,0.5)",
                background: filterStatus === key ? (color ? `${color}15` : "rgba(98,142,203,0.15)") : "rgba(255,255,255,0.5)",
                color: filterStatus === key ? (color || "#395886") : "rgba(57,88,134,0.7)",
                fontWeight: filterStatus === key ? 700 : 500, fontSize: "0.8rem",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {label} ({statusCounts[key]})
            </button>
          ))}
        </div>

        <select
          className="glass-select"
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          style={{ width: "auto", minWidth: 180 }}
        >
          <option value="ALL">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card-static empty-state" style={{ padding: 60 }}>
          <CheckSquare size={48} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: "1rem", fontWeight: 600 }}>No tasks found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((task) => {
            const isOverdue = task.due_date && isAfter(new Date(), new Date(task.due_date)) && task.status !== "DONE";
            return (
              <div key={task.id} className="glass-card-sm" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ paddingTop: 2 }}>
                    {task.status === "DONE"
                      ? <Circle size={18} style={{ color: "#22c55e", fill: "#22c55e" }} />
                      : <Circle size={18} style={{ color: "rgba(98,142,203,0.4)" }} />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: "#1e2d45", fontSize: "0.9rem" }}>{task.title}</span>
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {isOverdue && <span className="overdue-tag"><AlertTriangle size={10} /> Overdue</span>}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
                      {task.project && (
                        <span style={{ fontSize: "0.75rem", color: "rgba(57,88,134,0.55)" }}>
                          <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>{task.project.name}</span>
                        </span>
                      )}
                      {task.assignee && (
                        <span style={{ fontSize: "0.75rem", color: "rgba(57,88,134,0.55)", display: "flex", alignItems: "center", gap: 4 }}>
                          <div className="avatar avatar-sm" style={{ width: 16, height: 16, fontSize: "0.55rem" }}>
                            {task.assignee.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          {task.assignee.full_name}
                        </span>
                      )}
                      {task.due_date && (
                        <span style={{ fontSize: "0.75rem", color: isOverdue ? "#e05555" : "rgba(57,88,134,0.55)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={11} /> {format(new Date(task.due_date), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setStatusTask(task)}
                      style={{ padding: "5px 10px", borderRadius: 7, background: "rgba(98,142,203,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#628ECB", fontSize: "0.75rem", fontWeight: 600, transition: "all 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(98,142,203,0.25)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(98,142,203,0.12)"}
                    >
                      <ChevronDown size={13} /> Status
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => { setEditTask(task); setShowModal(true); }} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(98,142,203,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#628ECB", transition: "all 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(98,142,203,0.3)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(98,142,203,0.15)"}>
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(224,85,85,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#e05555", transition: "all 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(224,85,85,0.25)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(224,85,85,0.12)"}>
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editTask}
          projects={projects}
          users={users}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={() => { setShowModal(false); setEditTask(null); load(); }}
        />
      )}
      {statusTask && (
        <QuickStatusModal
          task={statusTask}
          onClose={() => setStatusTask(null)}
          onSave={() => { setStatusTask(null); load(); }}
        />
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="spinner" />}>
        <TasksContent />
      </Suspense>
    </AppShell>
  );
}
