"use client";

import { useState } from "react";
import { Loader2, Download, Lock, FileText, Users, Crown, RefreshCw, Github, ExternalLink } from "lucide-react";

interface TeamMember {
  userId: string;
  displayName: string;
  contactEmail: string | null;
  isLead: boolean;
}

interface Team {
  id: string;
  name: string;
  teamNumber: string;
}

interface SubmissionData {
  id: string;
  projectName: string;
  githubLink: string;
  demoLink: string | null;
  description: string;
  problemStatement: string;
  techStack: string;
  sponsorTech: string[];
  fileUploads: string[];
  submittedAt: string;
  updatedAt: string;
  team: Team;
  members: TeamMember[];
}

const ADMIN_PASSWORD = "aifestival2026";

export default function AdminSubmissionsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionData | null>(null);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError("");
      loadSubmissions();
    } else {
      setPasswordError("Incorrect password");
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/submissions");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to fetch submissions");
      }
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const headers = [
      "Team Number",
      "Team Name",
      "Project Name",
      "GitHub Link",
      "Demo Link",
      "Problem Statement",
      "Description",
      "Tech Stack",
      "Sponsor Tech Used",
      "Member Name",
      "Member Email",
      "Is Lead",
      "Submitted At",
      "Updated At",
    ];

    const rows: string[][] = [];

    submissions.forEach((sub) => {
      if (sub.members.length === 0) {
        rows.push([
          sub.team.teamNumber,
          sub.team.name,
          sub.projectName,
          sub.githubLink,
          sub.demoLink || "",
          sub.problemStatement,
          sub.description,
          sub.techStack,
          sub.sponsorTech.join(", "),
          "",
          "",
          "",
          new Date(sub.submittedAt).toLocaleString(),
          new Date(sub.updatedAt).toLocaleString(),
        ]);
      } else {
        sub.members.forEach((member, index) => {
          rows.push([
            index === 0 ? sub.team.teamNumber : "",
            index === 0 ? sub.team.name : "",
            index === 0 ? sub.projectName : "",
            index === 0 ? sub.githubLink : "",
            index === 0 ? sub.demoLink || "" : "",
            index === 0 ? sub.problemStatement : "",
            index === 0 ? sub.description : "",
            index === 0 ? sub.techStack : "",
            index === 0 ? sub.sponsorTech.join(", ") : "",
            member.displayName || "Unknown",
            member.contactEmail || "N/A",
            member.isLead ? "Yes" : "No",
            index === 0 ? new Date(sub.submittedAt).toLocaleString() : "",
            index === 0 ? new Date(sub.updatedAt).toLocaleString() : "",
          ]);
        });
      }
    });

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

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `submissions-export-${new Date().toISOString().split("T")[0]}.csv`;
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
              <div className="w-12 h-12 rounded-full bg-[#00D4A8]/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#00D4A8]" />
              </div>
              <div>
                <h1 className="text-2xl text-white font-medium">Admin Access</h1>
                <p className="text-sm text-white/50">Submissions Dashboard</p>
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
                  className="w-full px-4 py-3 bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:ring-1 focus:ring-[#00D4A8] outline-none transition-all"
                  autoFocus
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-red-400">{passwordError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 bg-[#00D4A8] text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#00D4A8]/90 transition-all"
              >
                Access Submissions
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
                <div className="h-px w-6 bg-[#00D4A8]" />
                <span className="font-mono text-[10px] text-[#00D4A8] uppercase tracking-[0.4em]">
                  Admin Panel
                </span>
              </div>
              <h1 className="text-3xl font-normal tracking-tight">
                Submissions Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={loadSubmissions}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/15 text-white/70 text-xs font-mono uppercase tracking-wider hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={exportToExcel}
                disabled={submissions.length === 0}
                className="flex items-center gap-2 px-5 py-3 bg-[#00D4A8] text-black font-bold text-xs uppercase tracking-[0.15em] hover:bg-[#00D4A8]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={20} className="text-[#00D4A8]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Total Submissions
              </span>
            </div>
            <p className="text-4xl font-light">{submissions.length}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-[#00D4A8]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Total Participants
              </span>
            </div>
            <p className="text-4xl font-light">
              {submissions.reduce((acc, s) => acc + s.members.length, 0)}
            </p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Github size={20} className="text-[#00D4A8]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                With Demo Links
              </span>
            </div>
            <p className="text-4xl font-light">
              {submissions.filter((s) => s.demoLink).length}
            </p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={20} className="text-[#00D4A8]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Using Sponsor Tech
              </span>
            </div>
            <p className="text-4xl font-light">
              {submissions.filter((s) => s.sponsorTech && s.sponsorTech.length > 0).length}
            </p>
          </div>
        </div>

        {/* Sponsor Tech Breakdown */}
        <div className="bg-white/[0.04] border border-white/10 p-6 mb-8">
          <h3 className="text-sm text-white/50 uppercase tracking-wider mb-4">
            Sponsor Tech Usage
          </h3>
          <div className="flex flex-wrap gap-4">
            {["Runware", "NVIDIA (Nemotron)", "Anthropic", "Anthropic Agent SDK", "Doubleword", "Prolific"].map((tech) => {
              const count = submissions.filter((s) => s.sponsorTech?.includes(tech)).length;
              return (
                <div key={tech} className="flex items-center gap-3 px-4 py-2 bg-white/[0.04] border border-white/10">
                  <span className="text-white">{tech}</span>
                  <span className="text-[#00D4A8] font-mono">{count}</span>
                </div>
              );
            })}
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
            <Loader2 className="w-8 h-8 text-[#00D4A8] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && submissions.length === 0 && (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 mx-auto text-white/20 mb-4" />
            <p className="text-white/50">No submissions found</p>
          </div>
        )}

        {/* Submissions list */}
        {!loading && submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white/[0.04] border border-white/10 overflow-hidden"
              >
                {/* Submission header */}
                <div
                  className="px-6 py-4 border-b border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-all"
                  onClick={() => setSelectedSubmission(selectedSubmission?.id === sub.id ? null : sub)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-mono text-[#00D4A8] text-sm">
                          #{sub.team.teamNumber}
                        </span>
                        <h3 className="text-lg text-white font-medium">
                          {sub.projectName}
                        </h3>
                      </div>
                      <p className="text-sm text-white/50 mb-2">{sub.team.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {sub.sponsorTech?.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 bg-[#00D4A8]/20 text-[#00D4A8] text-xs"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <a
                        href={sub.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-white/[0.06] hover:bg-white/10 transition-all"
                      >
                        <Github size={16} className="text-white/70" />
                      </a>
                      {sub.demoLink && (
                        <a
                          href={sub.demoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-[#00D4A8]/20 hover:bg-[#00D4A8]/30 transition-all"
                        >
                          <ExternalLink size={16} className="text-[#00D4A8]" />
                        </a>
                      )}
                      <span className="text-xs text-white/30">
                        {sub.members.length} member{sub.members.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {selectedSubmission?.id === sub.id && (
                  <div className="p-6 space-y-6">
                    {/* Links */}
                    <div className="flex gap-4">
                      <a
                        href={sub.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/15 text-white text-sm hover:bg-white/10 transition-all"
                      >
                        <Github size={16} />
                        GitHub Repository
                      </a>
                      {sub.demoLink && (
                        <a
                          href={sub.demoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-[#00D4A8]/20 border border-[#00D4A8]/30 text-[#00D4A8] text-sm hover:bg-[#00D4A8]/30 transition-all"
                        >
                          <ExternalLink size={16} />
                          Live Demo
                        </a>
                      )}
                    </div>

                    {/* Problem Statement */}
                    <div>
                      <h4 className="text-xs text-white/50 uppercase tracking-wider mb-2">
                        Problem Statement
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {sub.problemStatement}
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-xs text-white/50 uppercase tracking-wider mb-2">
                        Description
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                        {sub.description}
                      </p>
                    </div>

                    {/* Tech Stack */}
                    <div>
                      <h4 className="text-xs text-white/50 uppercase tracking-wider mb-2">
                        Tech Stack
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {sub.techStack.split(",").map((tech, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-white/[0.06] text-sm text-white/80"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* File Uploads */}
                    {sub.fileUploads && sub.fileUploads.length > 0 && (
                      <div>
                        <h4 className="text-xs text-white/50 uppercase tracking-wider mb-2">
                          Attachments ({sub.fileUploads.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {sub.fileUploads.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-white/[0.06] text-sm text-[#00D4A8] hover:bg-white/10 transition-all"
                            >
                              File {i + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Team Members */}
                    <div>
                      <h4 className="text-xs text-white/50 uppercase tracking-wider mb-3">
                        Team Members
                      </h4>
                      <div className="space-y-2">
                        {sub.members.map((member) => (
                          <div
                            key={member.userId}
                            className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <Users size={14} className="text-white/40" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-white text-sm">
                                    {member.displayName || "Unknown"}
                                  </p>
                                  {member.isLead && (
                                    <Crown size={12} className="text-amber-400" />
                                  )}
                                </div>
                                <p className="text-xs text-white/40">
                                  {member.contactEmail || "No email"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="flex gap-6 text-xs text-white/30 pt-4 border-t border-white/5">
                      <span>Submitted: {new Date(sub.submittedAt).toLocaleString()}</span>
                      <span>Updated: {new Date(sub.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
