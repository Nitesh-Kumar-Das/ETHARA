"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { Bell, User as UserIcon, LogOut, Settings, Shield } from "lucide-react";
import toast from "react-hot-toast";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/projects": "Project Portfolio",
  "/tasks": "My Tasks",
  "/members": "Team Workspace",
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<"none" | "notifications" | "profile">("none");
  const [notifications, setNotifications] = useState([
    { id: 1, title: "System Update", message: "New feature released: Project colors are now customizable.", time: "2 hours ago", read: false },
    { id: 2, title: "Team Activity", message: "Sarah added you to 'NextGen Dashboard'.", time: "5 hours ago", read: false },
  ]);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasUnread = notifications.some(n => !n.read);

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  )?.[1] || "Team Task Manager";

  const initials = user?.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu("none");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const toggleMenu = (menu: "notifications" | "profile") => {
    setActiveMenu(prev => prev === menu ? "none" : menu);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  return (
    <header className="glass-navbar" style={{
      position: "fixed", top: 0, left: 240, right: 0, height: 64, zIndex: 40,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px"
    }}>
      <div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#395886", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }} ref={menuRef}>
        {/* Active Role Badge */}
        <span className={`badge ${user?.active_role === "ADMIN" ? "badge-admin" : "badge-tasker"}`} style={{ fontSize: "0.7rem", fontWeight: 700, padding: "4px 10px" }}>
          {user?.active_role}
        </span>

        {/* Notification Bell */}
        <div style={{ position: "relative" }}>
          <button 
            id="notification-bell"
            onClick={() => toggleMenu("notifications")}
            style={{
              width: 38, height: 38, borderRadius: 12, background: "rgba(177,201,239,0.2)",
              border: "1px solid rgba(177,201,239,0.4)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(57,88,134,0.7)", transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(177,201,239,0.4)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(177,201,239,0.2)"}
          >
            <Bell size={18} />
            {hasUnread && (
              <span style={{
                position: "absolute", top: 10, right: 10, width: 8, height: 8,
                background: "#e05555", borderRadius: "50%", border: "2px solid white"
              }} />
            )}
          </button>

          {activeMenu === "notifications" && (
            <div className="glass-card-static" style={{
              position: "absolute", top: "calc(100% + 12px)", right: 0, width: 300,
              padding: "16px", zIndex: 100, boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px)"
            }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#395886", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Notifications
                {hasUnread && (
                  <button 
                    onClick={markAllRead}
                    style={{ 
                      fontSize: "0.7rem", color: "#628ECB", cursor: "pointer", background: "none", 
                      border: "none", fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(177,201,239,0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      style={{ 
                        padding: "10px", borderRadius: 8, 
                        background: n.read ? "rgba(177,201,239,0.05)" : "rgba(177,201,239,0.15)", 
                        border: n.read ? "1px solid transparent" : "1px solid rgba(177,201,239,0.3)",
                        fontSize: "0.8rem", color: "rgba(57,88,134,0.8)",
                        opacity: n.read ? 0.7 : 1
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#395886", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        {!n.read && <div style={{ width: 6, height: 6, background: "#628ECB", borderRadius: "50%" }} />}
                        {n.title}
                      </div>
                      {n.message}
                      <div style={{ fontSize: "0.7rem", opacity: 0.5, marginTop: 4 }}>{n.time}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "rgba(57,88,134,0.4)", fontSize: "0.85rem" }}>
                    No notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div style={{ position: "relative" }}>
          <button
            id="profile-trigger"
            onClick={() => toggleMenu("profile")}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "4px 4px 4px 12px",
              borderRadius: 14, background: "rgba(177,201,239,0.15)", border: "1px solid rgba(177,201,239,0.3)",
              cursor: "pointer", transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(177,201,239,0.6)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(177,201,239,0.3)"}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#395886" }}>
              {user?.full_name.split(" ")[0]}
            </span>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: "0.75rem", border: "2px solid white" }}>
              {initials}
            </div>
          </button>

          {activeMenu === "profile" && (
            <div className="glass-card-static" style={{
              position: "absolute", top: "calc(100% + 12px)", right: 0, width: 220,
              padding: "8px", zIndex: 100, boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px)"
            }}>
              <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid rgba(177,201,239,0.3)", marginBottom: 4 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#395886" }}>{user?.full_name}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(57,88,134,0.6)", marginTop: 2 }}>{user?.email}</div>
              </div>
              
              <button className="nav-item" style={{ width: "100%", textAlign: "left", fontSize: "0.85rem" }}>
                <UserIcon size={16} /> Profile Settings
              </button>
              <button className="nav-item" style={{ width: "100%", textAlign: "left", fontSize: "0.85rem" }}>
                <Shield size={16} /> Privacy
              </button>
              <button className="nav-item" style={{ width: "100%", textAlign: "left", fontSize: "0.85rem" }}>
                <Settings size={16} /> Workspace
              </button>
              
              <div style={{ borderTop: "1px solid rgba(177,201,239,0.3)", marginTop: 4, paddingTop: 4 }}>
                <button 
                  id="navbar-logout-btn"
                  onClick={handleLogout}
                  className="nav-item" 
                  style={{ width: "100%", textAlign: "left", fontSize: "0.85rem", color: "#e05555" }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
