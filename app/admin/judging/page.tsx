"use client";

import { useState } from "react";
import {
  Loader2,
  Lock,
  FileText,
  Users,
  Crown,
  Trophy,
  RefreshCw,
  Download,
  Github,
  ExternalLink,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Judge {
  id: string;
  name: string;
  judgingGroup: string | null;
}

interface TeamMember {
  displayName: string;
  contactEmail: string | null;
  isLead: boolean;
}

interface Score {
  id: string;
  judgeName: string;
  judgeGroup: string | null;
  futurePotential: string;
  demo: string;
  creativity: string;
  pitchingQuality: string;
  bonusFlux: string | null;
  additionalComments: string | null;
  total: number;
  recommendNvidia: string | null;
  recommendRunware: string | null;
}

interface SubmissionWithScores {
  submission: {
    id: string;
    projectName: string;
    githubLink: string;
    demoLink: string | null;
    techStack: string;
    sponsorTech: string[];
    // Hidden feedback fields
    sponsorFeatureFeedback?: string;
    mediaPermission?: string;
    eventFeedback?: string;
  };
  team: {
    id: string;
    name: string;
    teamNumber: string;
  };
  members: TeamMember[];
  scores: Score[];
  averages: {
    futurePotential: string;
    demo: string;
    creativity: string;
    pitchingQuality: string;
    bonusFlux: string;
    total: string;
  };
  totalScore: number;
  numJudges: number;
  // Recommendation counts
  nvidiaRecommendations: number;
  runwareRecommendations: number;
}

const ADMIN_PASSWORD = "aifestival2026";

export default function AdminJudgingPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionWithScores[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [error, setError] = useState("");
  // Filters
  const [filterNvidia, setFilterNvidia] = useState(false);
  const [filterRunware, setFilterRunware] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError("");
      loadData();
    } else {
      setPasswordError("Incorrect password");
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/judging");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to fetch data");
      }
      setSubmissions(data.submissions || []);
      setJudges(data.judges || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Rank",
      "Team Number",
      "Team Name",
      "Project Name",
      "Total Score",
      "Avg Score",
      "Num Judges",
      "Avg Future Potential",
      "Avg Demo",
      "Avg Creativity",
      "Avg Pitching",
      "Avg Bonus Flux",
      "GitHub Link",
      "Demo Link",
      "Sponsor Tech",
    ];

    const rows = submissions.map((sub, index) => [
      String(index + 1),
      sub.team.teamNumber,
      sub.team.name,
      sub.submission.projectName,
      String(sub.totalScore),
      sub.averages.total,
      String(sub.numJudges),
      sub.averages.futurePotential,
      sub.averages.demo,
      sub.averages.creativity,
      sub.averages.pitchingQuality,
      sub.averages.bonusFlux,
      sub.submission.githubLink,
      sub.submission.demoLink || "",
      sub.submission.sponsorTech.join(", "),
    ]);

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
    link.download = `judging-results-${new Date().toISOString().split("T")[0]}.csv`;
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
                <Trophy className="w-6 h-6 text-[#00D4A8]" />
              </div>
              <div>
                <h1 className="text-2xl text-white font-medium">Judging Admin</h1>
                <p className="text-sm text-white/50">Results & Rankings</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm text-white/60 mb-2">Password</label>
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
                View Results
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
                Judging Results
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/15 text-white/70 text-xs font-mono uppercase tracking-wider hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
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
                Total Judges
              </span>
            </div>
            <p className="text-4xl font-light">{judges.length}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star size={20} className="text-[#00D4A8]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Fully Scored
              </span>
            </div>
            <p className="text-4xl font-light">
              {submissions.filter((s) => s.numJudges > 0).length}
            </p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy size={20} className="text-[#00D4A8]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Total Scores
              </span>
            </div>
            <p className="text-4xl font-light">
              {submissions.reduce((acc, s) => acc + s.numJudges, 0)}
            </p>
          </div>
        </div>

        {/* Judges List */}
        <div className="bg-white/[0.04] border border-white/10 p-6 mb-8">
          <h3 className="text-sm text-white/50 uppercase tracking-wider mb-4">
            Registered Judges
          </h3>
          <div className="flex flex-wrap gap-2">
            {judges.map((judge) => (
              <span
                key={judge.id}
                className="px-3 py-1.5 bg-white/[0.06] text-sm text-white flex items-center gap-2"
              >
                {judge.name}
                {judge.judgingGroup && (
                  <span className="px-1.5 py-0.5 bg-[#00D4A8]/20 text-[#00D4A8] text-[10px] rounded">
                    {judge.judgingGroup}
                  </span>
                )}
              </span>
            ))}
            {judges.length === 0 && (
              <span className="text-white/40 text-sm">No judges registered yet</span>
            )}
          </div>
        </div>

        {/* Sponsor Challenge Filters */}
        <div className="bg-[#00D4A8]/10 border border-[#00D4A8]/30 p-6 mb-8">
          <h3 className="text-sm text-[#00D4A8] uppercase tracking-wider mb-4">
            Filter by Sponsor Challenge Recommendations
          </h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filterNvidia}
                onChange={(e) => setFilterNvidia(e.target.checked)}
                className="w-4 h-4 rounded border-white/30 bg-white/[0.06] text-[#00D4A8] focus:ring-[#00D4A8] focus:ring-offset-0"
              />
              <span className="text-sm text-white/80">
                NVIDIA Agentic Challenge ({submissions.filter(s => s.nvidiaRecommendations > 0).length} recommended)
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filterRunware}
                onChange={(e) => setFilterRunware(e.target.checked)}
                className="w-4 h-4 rounded border-white/30 bg-white/[0.06] text-[#00D4A8] focus:ring-[#00D4A8] focus:ring-offset-0"
              />
              <span className="text-sm text-white/80">
                Runware Platform Challenge ({submissions.filter(s => s.runwareRecommendations > 0).length} recommended)
              </span>
            </label>
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

        {/* Leaderboard */}
        {!loading && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Trophy size={20} className="text-[#00D4A8]" />
              Leaderboard
            </h2>

            {(() => {
              // Apply filters
              const filteredSubmissions = submissions.filter(sub => {
                if (filterNvidia && sub.nvidiaRecommendations === 0) return false;
                if (filterRunware && sub.runwareRecommendations === 0) return false;
                return true;
              });

              if (filteredSubmissions.length === 0) {
                return (
                  <div className="text-center py-20 bg-white/[0.04] border border-white/10">
                    <FileText className="w-16 h-16 mx-auto text-white/20 mb-4" />
                    <p className="text-white/50">
                      {submissions.length === 0 ? "No submissions yet" : "No submissions match the current filters"}
                    </p>
                  </div>
                );
              }

              return (
              <div className="space-y-2">
                {filteredSubmissions.map((sub, index) => {
                  const isExpanded = expandedSubmission === sub.submission.id;
                  const rank = index + 1;
                  const medalColor =
                    rank === 1
                      ? "text-yellow-400"
                      : rank === 2
                      ? "text-gray-300"
                      : rank === 3
                      ? "text-amber-600"
                      : "text-white/30";

                  return (
                    <div
                      key={sub.submission.id}
                      className="bg-white/[0.04] border border-white/10 overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedSubmission(isExpanded ? null : sub.submission.id)
                        }
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-all"
                      >
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3">
                            <span className={`text-2xl font-bold ${medalColor}`}>
                              #{rank}
                            </span>
                            {rank <= 3 && (
                              <Trophy size={20} className={medalColor} />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[#00D4A8] text-sm">
                                Team #{sub.team.teamNumber}
                              </span>
                              <span className="text-white font-medium">
                                {sub.submission.projectName}
                              </span>
                              {sub.nvidiaRecommendations > 0 && (
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                  NVIDIA ({sub.nvidiaRecommendations})
                                </span>
                              )}
                              {sub.runwareRecommendations > 0 && (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                                  Runware ({sub.runwareRecommendations})
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-white/50">{sub.team.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#00D4A8]">
                              {sub.averages.total}
                            </p>
                            <p className="text-xs text-white/40">
                              avg of {sub.numJudges} judge{sub.numJudges !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={20} className="text-white/40" />
                          ) : (
                            <ChevronDown size={20} className="text-white/40" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-white/10 pt-4">
                          {/* Links */}
                          <div className="flex gap-3 mb-4">
                            <a
                              href={sub.submission.githubLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-white/[0.06] border border-white/15 text-white text-sm hover:bg-white/10 transition-all"
                            >
                              <Github size={14} />
                              GitHub
                            </a>
                            {sub.submission.demoLink && (
                              <a
                                href={sub.submission.demoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-[#00D4A8]/20 border border-[#00D4A8]/30 text-[#00D4A8] text-sm hover:bg-[#00D4A8]/30 transition-all"
                              >
                                <ExternalLink size={14} />
                                Demo
                              </a>
                            )}
                          </div>

                          {/* Average Scores */}
                          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-6">
                            <div className="bg-white/[0.04] p-3">
                              <p className="text-xs text-white/50 mb-1">Future Potential</p>
                              <p className="text-xl font-bold">{sub.averages.futurePotential}</p>
                            </div>
                            <div className="bg-white/[0.04] p-3">
                              <p className="text-xs text-white/50 mb-1">Demo</p>
                              <p className="text-xl font-bold">{sub.averages.demo}</p>
                            </div>
                            <div className="bg-white/[0.04] p-3">
                              <p className="text-xs text-white/50 mb-1">Creativity</p>
                              <p className="text-xl font-bold">{sub.averages.creativity}</p>
                            </div>
                            <div className="bg-white/[0.04] p-3">
                              <p className="text-xs text-white/50 mb-1">Pitching</p>
                              <p className="text-xl font-bold">{sub.averages.pitchingQuality}</p>
                            </div>
                            <div className="bg-white/[0.04] p-3">
                              <p className="text-xs text-white/50 mb-1">Bonus Flux</p>
                              <p className="text-xl font-bold">{sub.averages.bonusFlux}</p>
                            </div>
                            <div className="bg-white/[0.04] p-3">
                              <p className="text-xs text-white/50 mb-1">NVIDIA Rec.</p>
                              <p className={`text-xl font-bold ${sub.nvidiaRecommendations > 0 ? "text-green-400" : "text-white/30"}`}>{sub.nvidiaRecommendations}</p>
                            </div>
                            <div className="bg-white/[0.04] p-3">
                              <p className="text-xs text-white/50 mb-1">Runware Rec.</p>
                              <p className={`text-xl font-bold ${sub.runwareRecommendations > 0 ? "text-blue-400" : "text-white/30"}`}>{sub.runwareRecommendations}</p>
                            </div>
                            <div className="bg-[#00D4A8]/20 p-3 border border-[#00D4A8]/30">
                              <p className="text-xs text-[#00D4A8] mb-1">Total Avg</p>
                              <p className="text-xl font-bold text-[#00D4A8]">{sub.averages.total}</p>
                            </div>
                          </div>

                          {/* Individual Judge Scores */}
                          {sub.scores.length > 0 && (
                            <div>
                              <h4 className="text-sm text-white/50 uppercase tracking-wider mb-3">
                                Individual Scores
                              </h4>
                              <div className="space-y-2">
                                {sub.scores.map((score) => (
                                  <div
                                    key={score.id}
                                    className="bg-white/[0.02] border border-white/5 p-4"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium flex items-center gap-2">
                                        {score.judgeName}
                                        {score.judgeGroup && (
                                          <span className="px-1.5 py-0.5 bg-[#00D4A8]/20 text-[#00D4A8] text-[10px] rounded">
                                            {score.judgeGroup}
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-[#00D4A8] font-bold">
                                        {score.total} / 50
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-7 gap-2 text-sm">
                                      <div>
                                        <span className="text-white/40">FP: </span>
                                        <span>{score.futurePotential}</span>
                                      </div>
                                      <div>
                                        <span className="text-white/40">Demo: </span>
                                        <span>{score.demo}</span>
                                      </div>
                                      <div>
                                        <span className="text-white/40">Creat: </span>
                                        <span>{score.creativity}</span>
                                      </div>
                                      <div>
                                        <span className="text-white/40">Pitch: </span>
                                        <span>{score.pitchingQuality}</span>
                                      </div>
                                      <div>
                                        <span className="text-white/40">Bonus: </span>
                                        <span>{score.bonusFlux || "0"}</span>
                                      </div>
                                      <div>
                                        <span className="text-white/40">NV: </span>
                                        <span className={score.recommendNvidia === "true" ? "text-green-400" : ""}>{score.recommendNvidia === "true" ? "Y" : "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-white/40">RW: </span>
                                        <span className={score.recommendRunware === "true" ? "text-blue-400" : ""}>{score.recommendRunware === "true" ? "Y" : "-"}</span>
                                      </div>
                                    </div>
                                    {score.additionalComments && (
                                      <p className="mt-2 text-sm text-white/60 italic">
                                        "{score.additionalComments}"
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {sub.scores.length === 0 && (
                            <div className="text-center py-4 text-white/40 text-sm">
                              No scores submitted yet
                            </div>
                          )}

                          {/* Team Members */}
                          <div className="mt-4">
                            <h4 className="text-sm text-white/50 uppercase tracking-wider mb-2">
                              Team Members
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {sub.members.map((m, i) => (
                                <span
                                  key={i}
                                  className="flex items-center gap-1 px-2 py-1 bg-white/[0.04] text-xs"
                                >
                                  {m.displayName}
                                  {m.isLead && <Crown size={10} className="text-amber-400" />}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
