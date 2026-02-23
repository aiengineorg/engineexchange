"use client";

import { useState, useEffect } from "react";
import { Loader2, Download, Lock, Users, Crown, RefreshCw } from "lucide-react";

interface TeamMemberData {
  id: string;
  userId: string;
  displayName: string;
  contactEmail: string | null;
  images: string[] | null;
  isLead: boolean;
  addedAt: string;
}

interface TeamWithMembers {
  id: string;
  name: string;
  teamNumber: string;
  teamLeadId: string;
  sessionId: string;
  createdAt: string;
  memberCount: number;
  members: TeamMemberData[];
}

const ADMIN_PASSWORD = "aifestival2026"; // Simple password for admin access

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError("");
      loadTeams();
    } else {
      setPasswordError("Incorrect password");
    }
  };

  const loadTeams = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/teams");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to fetch teams");
      }
      setTeams(data.teams || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // Create CSV content
    const headers = [
      "Team Number",
      "Team Name",
      "Member Count",
      "Member Name",
      "Member Email",
      "Is Lead",
      "Joined At",
    ];

    const rows: string[][] = [];

    teams.forEach((team) => {
      if (team.members.length === 0) {
        // Team with no members (shouldn't happen but handle it)
        rows.push([
          team.teamNumber,
          team.name,
          String(team.memberCount),
          "",
          "",
          "",
          "",
        ]);
      } else {
        team.members.forEach((member, index) => {
          rows.push([
            index === 0 ? team.teamNumber : "",
            index === 0 ? team.name : "",
            index === 0 ? String(team.memberCount) : "",
            member.displayName || "Unknown",
            member.contactEmail || "N/A",
            member.isLead ? "Yes" : "No",
            member.addedAt ? new Date(member.addedAt).toLocaleDateString() : "",
          ]);
        });
      }
    });

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    // Add BOM for Excel to recognize UTF-8
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `teams-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a1612] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/[0.04] border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-[#77957f]/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#77957f]" />
              </div>
              <div>
                <h1 className="text-2xl text-white font-medium">Admin Access</h1>
                <p className="text-sm text-white/50">AI Engine Exchange</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:ring-1 focus:ring-[#77957f] outline-none transition-all"
                  autoFocus
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-red-400">{passwordError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 bg-[#77957f] text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#77957f]/90 transition-all"
              >
                Access Admin Panel
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-[#0a1612] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-px w-6 bg-[#77957f]" />
                <span className="font-mono text-[10px] text-[#77957f] uppercase tracking-[0.4em]">
                  Admin Panel
                </span>
              </div>
              <h1 className="text-3xl font-normal tracking-tight">
                Team Management
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={loadTeams}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/15 text-white/70 text-xs font-mono uppercase tracking-wider hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={exportToExcel}
                disabled={teams.length === 0}
                className="flex items-center gap-2 px-5 py-3 bg-[#77957f] text-black font-bold text-xs uppercase tracking-[0.15em] hover:bg-[#77957f]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-[#77957f]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Total Teams
              </span>
            </div>
            <p className="text-4xl font-light">{teams.length}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-[#77957f]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Total Members
              </span>
            </div>
            <p className="text-4xl font-light">
              {teams.reduce((acc, t) => acc + t.memberCount, 0)}
            </p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-[#77957f]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Avg Team Size
              </span>
            </div>
            <p className="text-4xl font-light">
              {teams.length > 0
                ? (
                    teams.reduce((acc, t) => acc + t.memberCount, 0) /
                    teams.length
                  ).toFixed(1)
                : "0"}
            </p>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#77957f] animate-spin" />
          </div>
        )}

        {/* Teams list */}
        {!loading && teams.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto text-white/20 mb-4" />
            <p className="text-white/50">No teams found</p>
          </div>
        )}

        {!loading && teams.length > 0 && (
          <div className="space-y-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-white/[0.04] border border-white/10 overflow-hidden"
              >
                {/* Team header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[#77957f] text-sm">
                      #{team.teamNumber}
                    </span>
                    <h3 className="text-lg text-white font-medium">
                      {team.name}
                    </h3>
                  </div>
                  <span className="text-xs text-white/50">
                    {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Members */}
                <div className="divide-y divide-white/5">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="px-6 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        {member.images?.[0] ? (
                          <img
                            src={member.images[0]}
                            alt={member.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Users size={16} className="text-white/40" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white">
                              {member.displayName || "Unknown"}
                            </p>
                            {member.isLead && (
                              <Crown size={14} className="text-amber-400" />
                            )}
                          </div>
                          <p className="text-xs text-white/50">
                            {member.contactEmail || "No email"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-white/30">
                        {member.addedAt
                          ? new Date(member.addedAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
