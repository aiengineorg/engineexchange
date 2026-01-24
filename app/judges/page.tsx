"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Lock,
  FileText,
  Users,
  Crown,
  Github,
  ExternalLink,
  CheckCircle,
  Circle,
  Plus,
  Star,
  Search,
  X,
} from "lucide-react";

interface Judge {
  id: string;
  name: string;
}

interface TeamMember {
  displayName: string;
  isLead: boolean;
}

interface Team {
  id: string;
  name: string;
  teamNumber: string;
}

interface Submission {
  id: string;
  projectName: string;
  githubLink: string;
  demoLink: string | null;
  description: string;
  problemStatement: string;
  techStack: string;
  sponsorTech: string[];
  fileUploads: string[];
}

interface SubmissionWithStatus {
  submission: Submission;
  team: Team;
  members: TeamMember[];
  hasScored: boolean;
  existingScore: unknown;
}

const ADMIN_PASSWORD = "fluxhack2025";

export default function JudgesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if returning from scoring page with judge info
  const returnedJudgeId = searchParams.get("judgeId");
  const returnedJudgeName = searchParams.get("judgeName");

  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const [judges, setJudges] = useState<Judge[]>([]);
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [newJudgeName, setNewJudgeName] = useState("");
  const [addingJudge, setAddingJudge] = useState(false);
  const [showAddJudge, setShowAddJudge] = useState(false);
  const [judgeSearchQuery, setJudgeSearchQuery] = useState("");

  const [submissions, setSubmissions] = useState<SubmissionWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "scored" | "unscored">("all");

  // Check localStorage on mount for persisted auth
  useEffect(() => {
    const savedAuth = localStorage.getItem("judges_authenticated");
    const savedJudge = localStorage.getItem("judges_selected_judge");

    if (savedAuth === "true") {
      setAuthenticated(true);
      if (savedJudge) {
        try {
          setSelectedJudge(JSON.parse(savedJudge));
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
    setInitialLoadDone(true);
  }, []);

  // Auto-authenticate and select judge if returning from scoring page
  useEffect(() => {
    if (returnedJudgeId && returnedJudgeName) {
      setAuthenticated(true);
      const judge = { id: returnedJudgeId, name: decodeURIComponent(returnedJudgeName) };
      setSelectedJudge(judge);
      localStorage.setItem("judges_authenticated", "true");
      localStorage.setItem("judges_selected_judge", JSON.stringify(judge));
    }
  }, [returnedJudgeId, returnedJudgeName]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError("");
      localStorage.setItem("judges_authenticated", "true");
      loadJudges();
    } else {
      setPasswordError("Incorrect password");
    }
  };

  const loadJudges = async () => {
    try {
      const response = await fetch("/api/judges");
      const data = await response.json();
      // Sort alphabetically
      const sortedJudges = (data.judges || []).sort((a: Judge, b: Judge) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      setJudges(sortedJudges);
    } catch (err) {
      console.error("Failed to load judges:", err);
    }
  };

  // Filter judges based on search
  const filteredJudges = judges.filter((judge) =>
    judge.name.toLowerCase().includes(judgeSearchQuery.toLowerCase())
  );

  const loadSubmissions = async () => {
    if (!selectedJudge) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/judges/submissions?judgeId=${selectedJudge.id}`);
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated && !selectedJudge) {
      loadJudges();
    }
  }, [authenticated, selectedJudge]);

  useEffect(() => {
    if (selectedJudge) {
      loadSubmissions();
    }
  }, [selectedJudge]);

  const handleAddJudge = async () => {
    if (!newJudgeName.trim()) return;
    setAddingJudge(true);
    try {
      const response = await fetch("/api/judges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newJudgeName.trim() }),
      });
      const judge = await response.json();
      setJudges([...judges, judge].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedJudge(judge);
      localStorage.setItem("judges_selected_judge", JSON.stringify(judge));
      setNewJudgeName("");
      setShowAddJudge(false);
    } catch (err) {
      setError("Failed to add judge");
    } finally {
      setAddingJudge(false);
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    // Status filter
    if (filterStatus === "scored" && !sub.hasScored) return false;
    if (filterStatus === "unscored" && sub.hasScored) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTeamNumber = sub.team.teamNumber.toLowerCase().includes(query);
      const matchesTeamName = sub.team.name.toLowerCase().includes(query);
      const matchesProjectName = sub.submission.projectName.toLowerCase().includes(query);
      return matchesTeamNumber || matchesTeamName || matchesProjectName;
    }

    return true;
  });

  // Show loading while checking localStorage
  if (!initialLoadDone) {
    return (
      <div className="min-h-screen bg-[#0a1612] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#77957f] animate-spin" />
      </div>
    );
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a1612] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/[0.04] border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-[#77957f]/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-[#77957f]" />
              </div>
              <div>
                <h1 className="text-2xl text-white font-medium">Judges Portal</h1>
                <p className="text-sm text-white/50">FluxHack 2025</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm text-white/60 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter judges password"
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
                Enter Judges Portal
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Judge selection screen
  if (!selectedJudge) {
    return (
      <div className="min-h-screen bg-[#0a1612] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/[0.04] border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-[#77957f]/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#77957f]" />
              </div>
              <div>
                <h1 className="text-2xl text-white font-medium">Select Your Name</h1>
                <p className="text-sm text-white/50">Choose from the list or add yourself</p>
              </div>
            </div>

            <div className="space-y-4">
              {judges.length > 0 && (
                <>
                  {/* Search judges */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={judgeSearchQuery}
                      onChange={(e) => setJudgeSearchQuery(e.target.value)}
                      placeholder="Search judges..."
                      className="w-full pl-10 pr-4 py-2 bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:ring-1 focus:ring-[#77957f] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                    {filteredJudges.length === 0 ? (
                      <p className="text-white/40 text-sm text-center py-4">No judges found</p>
                    ) : (
                      filteredJudges.map((judge) => (
                        <button
                          key={judge.id}
                          onClick={() => {
                            setSelectedJudge(judge);
                            localStorage.setItem("judges_selected_judge", JSON.stringify(judge));
                          }}
                          className="w-full px-4 py-3 bg-white/[0.06] border border-white/15 text-white text-left hover:bg-white/10 hover:border-[#77957f]/50 transition-all"
                        >
                          {judge.name}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              {!showAddJudge ? (
                <button
                  onClick={() => setShowAddJudge(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-white/20 text-white/60 hover:border-[#77957f]/50 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Your Name
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newJudgeName}
                    onChange={(e) => setNewJudgeName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:ring-1 focus:ring-[#77957f] outline-none transition-all"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddJudge(false)}
                      className="flex-1 px-4 py-2 border border-white/15 text-white/60 text-sm hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddJudge}
                      disabled={!newJudgeName.trim() || addingJudge}
                      className="flex-1 px-4 py-2 bg-[#77957f] text-black font-bold text-sm hover:bg-[#77957f]/90 transition-all disabled:opacity-50"
                    >
                      {addingJudge ? "Adding..." : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main judging interface
  return (
    <div className="min-h-screen bg-[#0a1612] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-px w-6 bg-[#77957f]" />
                <span className="font-mono text-[10px] text-[#77957f] uppercase tracking-[0.4em]">
                  Judges Portal
                </span>
              </div>
              <h1 className="text-3xl font-normal tracking-tight">
                Welcome, {selectedJudge.name}
              </h1>
            </div>
            <button
              onClick={() => {
                setSelectedJudge(null);
                setSubmissions([]);
                setSearchQuery("");
                setFilterStatus("all");
                localStorage.removeItem("judges_selected_judge");
                // Clear URL params
                router.push("/judges");
              }}
              className="px-4 py-2 bg-white/[0.06] border border-white/15 text-white/70 text-xs font-mono uppercase tracking-wider hover:bg-white/10 transition-all"
            >
              Switch Judge
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={20} className="text-[#77957f]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Total Submissions
              </span>
            </div>
            <p className="text-4xl font-light">{submissions.length}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle size={20} className="text-[#77957f]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Scored
              </span>
            </div>
            <p className="text-4xl font-light">
              {submissions.filter((s) => s.hasScored).length}
            </p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Circle size={20} className="text-[#77957f]" />
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Remaining
              </span>
            </div>
            <p className="text-4xl font-light">
              {submissions.filter((s) => !s.hasScored).length}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by team number, team name, or project name..."
              className="w-full pl-12 pr-10 py-3 bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:ring-1 focus:ring-[#77957f] outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                filterStatus === "all"
                  ? "bg-[#77957f] text-black"
                  : "bg-white/[0.06] border border-white/15 text-white/70 hover:bg-white/10"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("unscored")}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                filterStatus === "unscored"
                  ? "bg-[#77957f] text-black"
                  : "bg-white/[0.06] border border-white/15 text-white/70 hover:bg-white/10"
              }`}
            >
              Unscored
            </button>
            <button
              onClick={() => setFilterStatus("scored")}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                filterStatus === "scored"
                  ? "bg-[#77957f] text-black"
                  : "bg-white/[0.06] border border-white/15 text-white/70 hover:bg-white/10"
              }`}
            >
              Scored
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#77957f] animate-spin" />
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-sm text-white/50 mb-4">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </p>

            {/* Submissions Grid */}
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 bg-white/[0.04] border border-white/10">
                <FileText className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/50">
                  {searchQuery || filterStatus !== "all"
                    ? "No submissions match your filters"
                    : "No submissions to judge yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubmissions.map((sub) => (
                  <Link
                    key={sub.submission.id}
                    href={`/judges/score/${sub.submission.id}?judgeId=${selectedJudge.id}&judgeName=${encodeURIComponent(selectedJudge.name)}`}
                    className={`block p-5 border transition-all hover:scale-[1.02] ${
                      sub.hasScored
                        ? "bg-[#77957f]/10 border-[#77957f]/30 hover:border-[#77957f]"
                        : "bg-white/[0.04] border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {sub.hasScored ? (
                          <CheckCircle size={18} className="text-[#77957f]" />
                        ) : (
                          <Circle size={18} className="text-white/30" />
                        )}
                        <span className="font-mono text-[#77957f] text-sm">
                          #{sub.team.teamNumber}
                        </span>
                      </div>
                      {sub.hasScored && (
                        <span className="text-xs text-[#77957f] bg-[#77957f]/20 px-2 py-1">
                          Scored
                        </span>
                      )}
                    </div>

                    <h3 className="text-white font-medium mb-1 line-clamp-1">
                      {sub.submission.projectName}
                    </h3>
                    <p className="text-sm text-white/50 mb-3">{sub.team.name}</p>

                    <p className="text-xs text-white/40 line-clamp-2 mb-3">
                      {sub.submission.problemStatement}
                    </p>

                    {/* Tech badges */}
                    <div className="flex flex-wrap gap-1">
                      {sub.submission.sponsorTech.slice(0, 2).map((tech, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#77957f]/20 text-[10px] text-[#77957f]">
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Quick links */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                      <span className="flex items-center gap-1 text-xs text-white/40">
                        <Github size={12} />
                        GitHub
                      </span>
                      {sub.submission.demoLink && (
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <ExternalLink size={12} />
                          Demo
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-white/40 ml-auto">
                        <Users size={12} />
                        {sub.members.length}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
