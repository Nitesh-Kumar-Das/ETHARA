"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Users, LogOut, ChevronRight, Shield, User as UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/projects", label: "Projects", icon: <FolderKanban size={18} /> },
  { href: "/tasks", label: "Tasks", icon: <CheckSquare size={18} /> },
  { href: "/members", label: "Members", icon: <Users size={18} />, adminOnly: true },
];

export default function Sidebar() {
  const { user, logout, switchRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const handleRoleSwitch = async (role: "ADMIN" | "TASKER") => {
    if (role === user?.active_role) return;
    try {
      await switchRole(role);
      toast.success(`Switched to ${role} role`);
    } catch {
      toast.error("Failed to switch role");
    }
  };

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.active_role === "ADMIN"
  );

  const initials = user?.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <aside className="glass-sidebar" style={{
      width: 240, minHeight: "100vh", display: "flex", flexDirection: "column",
      padding: "24px 12px", position: "fixed", top: 0, left: 0, zIndex: 50, flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{ padding: "0 8px 24px", borderBottom: "1px solid rgba(177,201,239,0.3)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #628ECB, #395886)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 4px 12px rgba(98,142,203,0.35)"
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.95rem", fontWeight: 800, color: "#395886", lineHeight: 1.2 }}>
              TaskManager
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(57,88,134,0.55)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Team Workspace
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
              {item.icon}
              <span>{item.label}</span>
              {isActive && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.6 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Role Switch */}
      {user && (
        <div style={{ marginTop: 16, padding: "14px", background: "rgba(177,201,239,0.15)", borderRadius: 14, border: "1px solid rgba(177,201,239,0.3)" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(57,88,134,0.6)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Shield size={11} /> Active Role
          </div>
          <div className="role-toggle">
            {(["ADMIN", "TASKER"] as const).map((role) => (
              <button
                key={role}
                id={`role-switch-${role.toLowerCase()}`}
                onClick={() => handleRoleSwitch(role)}
                className={`role-toggle-btn ${user.active_role === role ? "active" : ""}`}
                disabled={user.role !== "ADMIN" && role === "ADMIN"}
                title={user.role !== "ADMIN" && role === "ADMIN" ? "You don't have admin privileges" : `Switch to ${role}`}
              >
                {role}
              </button>
            ))}
          </div>
          {user.role !== "ADMIN" && (
            <p style={{ fontSize: "0.65rem", color: "rgba(57,88,134,0.5)", marginTop: 6, textAlign: "center" }}>
              Admin requires elevated account
            </p>
          )}
        </div>
      )}

      {/* User Profile Info */}
      <div style={{ marginTop: 12, borderTop: "1px solid rgba(177,201,239,0.3)", paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", borderRadius: 10 }}>
          <div className="avatar avatar-sm" style={{ fontSize: "0.8rem" }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "#395886" }} className="truncate">
              {user?.full_name}
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(57,88,134,0.55)" }} className="truncate">
              {user?.email}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
