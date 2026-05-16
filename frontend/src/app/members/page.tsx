"use client";

import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/auth";
import { User } from "@/types";
import { useEffect, useState } from "react";
import { Users, Shield, User as UserIcon, Search } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function MembersPage() {
  const { user } = useAuth();
  const isAdmin = user?.active_role === "ADMIN";
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    userService.listUsers()
      .then(setUsers)
      .catch(() => toast.error("Failed to load members"))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <AppShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div className="glass-card-static" style={{ padding: 40, textAlign: "center", maxWidth: 360 }}>
            <Shield size={48} style={{ color: "#628ECB", margin: "0 auto 16px" }} />
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#395886", marginBottom: 8 }}>Admin Only</h2>
            <p style={{ color: "rgba(57,88,134,0.65)", fontSize: "0.875rem" }}>
              Member management requires Admin role. Switch to Admin to access this page.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 900 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 className="page-header">Team Members</h1>
            <p className="page-subheader">{users.length} members in your workspace</p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 340, marginBottom: 20 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(98,142,203,0.7)" }} />
          <input
            id="member-search"
            className="glass-input"
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="glass-card-static">
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <Users size={40} style={{ opacity: 0.3 }} />
                <p>No members found</p>
              </div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const initials = u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                    const isCurrentUser = u.id === user?.id;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="avatar avatar-sm">{initials}</div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#1e2d45", fontSize: "0.875rem" }}>
                                {u.full_name}
                                {isCurrentUser && (
                                  <span style={{ marginLeft: 6, fontSize: "0.68rem", background: "rgba(98,142,203,0.15)", color: "#628ECB", padding: "1px 6px", borderRadius: 999, fontWeight: 700 }}>
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: "0.825rem", color: "rgba(57,88,134,0.7)" }}>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === "ADMIN" ? "badge-admin" : "badge-tasker"}`}>
                            {u.role === "ADMIN" ? <Shield size={10} /> : <UserIcon size={10} />}
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "2px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
                            background: u.is_active ? "rgba(34,197,94,0.15)" : "rgba(224,85,85,0.15)",
                            color: u.is_active ? "#15803d" : "#c0392b",
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: u.is_active ? "#22c55e" : "#e05555", display: "inline-block" }} />
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "rgba(57,88,134,0.55)" }}>
                          {format(new Date(u.created_at), "MMM d, yyyy")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
