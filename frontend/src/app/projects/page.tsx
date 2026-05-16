"use client";

import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { projectService } from "@/services/projects";
import { userService } from "@/services/auth";
import { Project, User } from "@/types";
import { useEffect, useState } from "react";
import {
  Plus, FolderKanban, Trash2, Edit3, X, Check,
  Users, Circle
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const PROJECT_COLORS = [
  "#628ECB", "#395886", "#8AAEE0", "#B1C9EF",
  "#22c55e", "#f59e0b", "#e05555", "#8b5cf6",
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {PROJECT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          style={{
            width: 28, height: 28, borderRadius: "50%", background: c, border: "none",
            cursor: "pointer", outline: value === c ? `3px solid ${c}` : "3px solid transparent",
            outlineOffset: 2, transition: "all 0.2s", transform: value === c ? "scale(1.15)" : "scale(1)"
          }}
        />
      ))}
    </div>
  );
}

function ProjectCard({
  project, isAdmin, onDelete, onEdit, onManageMembers
}: {
  project: Project; isAdmin: boolean;
  onDelete: (id: string) => void;
  onEdit: (p: Project) => void;
  onManageMembers: (p: Project) => void;
}) {
  return (
    <div className="glass-card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: project.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${project.color}55` }}>
            <FolderKanban size={18} color="white" />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, color: "#1e2d45", fontSize: "0.95rem" }}>{project.name}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Users size={11} style={{ color: "rgba(57,88,134,0.5)" }} />
              <span style={{ fontSize: "0.72rem", color: "rgba(57,88,134,0.55)" }}>{project.members.length} members</span>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onEdit(project)} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(98,142,203,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#628ECB", transition: "all 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(98,142,203,0.3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(98,142,203,0.15)"}>
              <Edit3 size={13} />
            </button>
            <button onClick={() => onDelete(project.id)} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(224,85,85,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#e05555", transition: "all 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(224,85,85,0.25)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(224,85,85,0.12)"}>
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {project.description && (
        <p style={{ fontSize: "0.825rem", color: "rgba(57,88,134,0.65)", marginBottom: 12, lineHeight: 1.5 }}>
          {project.description}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(177,201,239,0.3)" }}>
        <span style={{ fontSize: "0.75rem", color: "rgba(57,88,134,0.55)" }}>
          {project.task_count ?? 0} tasks
        </span>
        {isAdmin && (
          <button
            onClick={() => onManageMembers(project)}
            className="glass-button-secondary"
            style={{ padding: "5px 12px", fontSize: "0.75rem" }}
          >
            <Users size={12} /> Members
          </button>
        )}
      </div>
    </div>
  );
}

function ProjectModal({
  project, onClose, onSave
}: {
  project?: Project | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    name: project?.name || "",
    description: project?.description || "",
    color: project?.color || "#628ECB",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (project) {
        await projectService.update(project.id, form);
        toast.success("Project updated");
      } else {
        await projectService.create(form);
        toast.success("Project created");
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
            {project ? "Edit Project" : "New Project"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(57,88,134,0.5)", display: "flex", alignItems: "center", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="form-label">Project Name *</label>
            <input id="project-name-input" className="glass-input" type="text" placeholder="My Awesome Project" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="glass-textarea" placeholder="What is this project about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div>
            <label className="form-label">Color</label>
            <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="glass-button-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button id="project-save-btn" type="submit" className="glass-button" disabled={isLoading} style={{ flex: 1 }}>
              {isLoading ? "Saving..." : <><Check size={15} /> {project ? "Update" : "Create"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MembersModal({
  project, onClose, onSave
}: {
  project: Project; onClose: () => void; onSave: () => void;
}) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set(project.members.map((m) => m.id)));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    userService.listUsers().then(setAllUsers).catch(() => toast.error("Failed to load users"));
  }, []);

  const toggle = async (user: User) => {
    setIsLoading(true);
    try {
      if (memberIds.has(user.id)) {
        if (user.id === project.owner_id) { toast.error("Cannot remove project owner"); return; }
        await projectService.removeMember(project.id, user.id);
        setMemberIds((prev) => { const next = new Set(prev); next.delete(user.id); return next; });
        toast.success(`${user.full_name} removed`);
      } else {
        await projectService.addMember(project.id, user.id);
        setMemberIds((prev) => new Set([...prev, user.id]));
        toast.success(`${user.full_name} added`);
      }
      onSave();
    } catch (err) {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#395886" }}>
            Manage Members — {project.name}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(57,88,134,0.5)", display: "flex", alignItems: "center", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
          {allUsers.map((u) => {
            const isMember = memberIds.has(u.id);
            const isOwner = u.id === project.owner_id;
            return (
              <div key={u.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                borderRadius: 10, background: isMember ? "rgba(98,142,203,0.1)" : "rgba(255,255,255,0.5)",
                border: `1px solid ${isMember ? "rgba(98,142,203,0.3)" : "rgba(177,201,239,0.3)"}`,
                transition: "all 0.2s"
              }}>
                <div className="avatar avatar-sm">
                  {u.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e2d45" }}>{u.full_name}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(57,88,134,0.55)" }}>{u.email}</div>
                </div>
                {isOwner && <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#628ECB", background: "rgba(98,142,203,0.15)", padding: "2px 8px", borderRadius: 999 }}>Owner</span>}
                <button
                  onClick={() => toggle(u)}
                  disabled={isLoading || isOwner}
                  style={{
                    width: 28, height: 28, borderRadius: 7, border: "none", cursor: isOwner ? "default" : "pointer",
                    background: isMember ? "rgba(224,85,85,0.12)" : "rgba(34,197,94,0.12)",
                    color: isMember ? "#e05555" : "#15803d",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                    opacity: isOwner ? 0.4 : 1
                  }}
                >
                  {isMember ? <X size={13} /> : <Plus size={13} />}
                </button>
              </div>
            );
          })}
        </div>

        <button className="glass-button" onClick={onClose} style={{ width: "100%", marginTop: 16 }}>
          Done
        </button>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.active_role === "ADMIN";
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [membersProject, setMembersProject] = useState<Project | null>(null);

  const load = async () => {
    try {
      const data = await projectService.list();
      setProjects(data);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? All tasks will be removed.")) return;
    try {
      await projectService.delete(id);
      toast.success("Project deleted");
      load();
    } catch (err) {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.detail || "Failed");
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 1200 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 className="page-header">Projects</h1>
            <p className="page-subheader">{projects.length} project{projects.length !== 1 ? "s" : ""} in your workspace</p>
          </div>
          {isAdmin && (
            <button id="new-project-btn" className="glass-button" onClick={() => { setEditProject(null); setShowModal(true); }}>
              <Plus size={16} /> New Project
            </button>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div className="spinner" />
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card-static empty-state" style={{ padding: 60 }}>
            <FolderKanban size={48} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: "1rem", fontWeight: 600 }}>No projects yet</p>
            {isAdmin && <p style={{ fontSize: "0.85rem" }}>Create your first project to get started</p>}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {projects.map((p) => (
              <ProjectCard
                key={p.id} project={p} isAdmin={isAdmin}
                onDelete={handleDelete}
                onEdit={(proj) => { setEditProject(proj); setShowModal(true); }}
                onManageMembers={(proj) => setMembersProject(proj)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
          onSave={() => { setShowModal(false); setEditProject(null); load(); }}
        />
      )}
      {membersProject && (
        <MembersModal
          project={membersProject}
          onClose={() => setMembersProject(null)}
          onSave={load}
        />
      )}
    </AppShell>
  );
}
