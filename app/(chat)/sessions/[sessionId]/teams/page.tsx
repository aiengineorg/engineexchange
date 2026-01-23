"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UsersRound, Plus, Loader2, Search, X, UserPlus, Trash2, Crown, LogOut, Lock } from "lucide-react";
import { EmailWarningBanner } from "@/components/email-warning-banner";

interface TeamMember {
  id: string;
  userId: string;
  addedAt: string;
  isLead: boolean;
  profile: {
    displayName: string;
    contactEmail: string | null;
    images: string[] | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
  teamNumber: string;
  teamLeadId: string;
  sessionId: string;
  createdAt: string;
}

interface SearchResult {
  userId: string;
  displayName: string;
  contactEmail: string;
  images: string[] | null;
  isInTeam: boolean;
}

interface AllTeam {
  id: string;
  name: string;
  teamNumber: string;
  teamLeadId: string;
  sessionId: string;
  createdAt: string;
  memberCount: number;
  leadProfile: {
    displayName: string;
    images: string[] | null;
  } | null;
}

export default function TeamsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUnlocked = searchParams.get("test") === "true";

  const [loading, setLoading] = useState(true);
  const [hasValidEmail, setHasValidEmail] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLead, setIsLead] = useState(false);
  const [allTeams, setAllTeams] = useState<AllTeam[]>([]);

  // Create team form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamNumber, setTeamNumber] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);

  // Actions
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Check email status
      const emailRes = await fetch(`/api/profiles/check-email?sessionId=${sessionId}`);
      const emailData = await emailRes.json();
      setHasValidEmail(emailData.hasValidEmail);

      // Load user's team data
      const teamRes = await fetch(`/api/teams/my-team?sessionId=${sessionId}`);
      const teamData = await teamRes.json();

      if (teamData.team) {
        setTeam(teamData.team);
        setMembers(teamData.members || []);
        setIsLead(teamData.isLead || false);
      } else {
        setTeam(null);
        setMembers([]);
        setIsLead(false);
      }

      // Load all teams in the session
      const allTeamsRes = await fetch(`/api/teams?sessionId=${sessionId}`);
      const allTeamsData = await allTeamsRes.json();
      setAllTeams(allTeamsData.teams || []);
    } catch (error) {
      console.error("Failed to load team data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamName,
          teamNumber,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create team");
      }

      // Reload data
      await loadData();
      setShowCreateForm(false);
      setTeamName("");
      setTeamNumber("");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setHasSearched(true);
    try {
      const response = await fetch(
        `/api/users/search?email=${encodeURIComponent(searchQuery)}&sessionId=${sessionId}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!team) return;

    setAddingMember(userId);
    try {
      const response = await fetch(`/api/teams/${team.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add member");
      }

      // Reload data
      await loadData();
      setShowAddMember(false);
      setSearchQuery("");
      setSearchResults([]);
      setHasSearched(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add member");
    } finally {
      setAddingMember(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!team || !confirm("Are you sure you want to remove this member?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/members/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove member");
      }

      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to remove member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!team || !confirm("Are you sure you want to leave this team?")) return;

    setActionLoading(true);
    try {
      // Find current user's membership
      const currentMember = members.find((m) => !m.isLead);
      if (!currentMember) {
        throw new Error("Cannot find your team membership");
      }

      const response = await fetch(`/api/teams/${team.id}/members/${currentMember.userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave team");
      }

      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to leave team");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!team || !confirm("Are you sure you want to delete this team? This will remove all members and delete any submissions.")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete team");
      }

      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete team");
    } finally {
      setActionLoading(false);
    }
  };

  // Show coming soon if not unlocked
  if (!isUnlocked) {
    return (
      <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-bfl-green" />
            <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">
              Hackathon
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-normal text-white tracking-tighter uppercase mb-4">
            Teams
          </h1>
        </div>

        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-12 md:p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
            <Lock className="w-10 h-10 text-bfl-muted" />
          </div>
          <h2 className="text-3xl md:text-4xl font-normal text-white tracking-tighter uppercase mb-4">
            Coming Soon
          </h2>
          <p className="text-bfl-muted font-medium max-w-md mx-auto mb-2">
            Team formation will open shortly. Check back soon to create or join a team for the hackathon.
          </p>
          <p className="text-xs text-bfl-muted/60 font-mono">
            Stay tuned for updates
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto text-bfl-green animate-spin mb-4" />
          <p className="text-bfl-muted text-sm">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">
            Hackathon
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-normal text-white tracking-tighter uppercase mb-4">
          Teams
        </h1>
        <p className="text-bfl-muted font-medium max-w-lg">
          Create or join a team to collaborate on your hackathon project and submit together.
        </p>
      </div>

      {/* Email Warning */}
      {!hasValidEmail && <EmailWarningBanner sessionId={sessionId} />}

      {/* No Team - Show Create Form */}
      {hasValidEmail && !team && (
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8 md:p-10">
          {!showCreateForm ? (
            <div className="text-center py-8">
              <UsersRound className="w-16 h-16 mx-auto text-bfl-muted mb-6" />
              <h3 className="text-xl text-white mb-3">You're not in a team yet</h3>
              <p className="text-bfl-muted mb-8 max-w-md mx-auto">
                Create a team to start collaborating with other participants. You'll need the team number assigned by the organizers.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-8 py-4 bg-bfl-green text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-bfl-green/90 transition-all flex items-center gap-3 mx-auto"
              >
                <Plus size={18} />
                Create Team
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <UsersRound className="text-bfl-green" size={24} />
                <h3 className="text-xl text-white">Create Your Team</h3>
              </div>

              <div>
                <label className="block text-sm text-bfl-muted mb-2">Team Name *</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., The Innovators"
                  required
                  maxLength={100}
                  className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 font-mono text-sm focus:ring-1 focus:ring-bfl-green outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-bfl-muted mb-2">Team Number (from organizers) *</label>
                <input
                  type="text"
                  value={teamNumber}
                  onChange={(e) => setTeamNumber(e.target.value)}
                  placeholder="e.g., 42"
                  required
                  maxLength={20}
                  className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 font-mono text-sm focus:ring-1 focus:ring-bfl-green outline-none transition-all"
                />
                <p className="mt-2 text-xs text-bfl-muted">
                  You should have received a team number from the hackathon organizers.
                </p>
              </div>

              {createError && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm">
                  <p className="text-red-400 text-sm">{createError}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-6 py-4 border border-white/10 text-bfl-muted font-bold text-xs uppercase tracking-[0.15em] hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !teamName || !teamNumber}
                  className="flex-1 px-6 py-4 bg-bfl-green text-black font-bold text-xs uppercase tracking-[0.15em] hover:bg-bfl-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Team"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Has Team - Show Team Management */}
      {team && (
        <div className="space-y-8">
          {/* Team Info Card */}
          <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8 md:p-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <UsersRound className="text-bfl-green" size={24} />
                  <h2 className="text-2xl text-white">{team.name}</h2>
                </div>
                <p className="text-bfl-muted font-mono text-sm">Team #{team.teamNumber}</p>
              </div>
              {isLead && (
                <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-wider">
                  <Crown size={14} />
                  Team Lead
                </span>
              )}
            </div>

            {/* Members List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-bfl-muted font-mono uppercase tracking-wider">
                  Team Members ({members.length})
                </h3>
                {isLead && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/15 text-bfl-green text-xs font-mono uppercase tracking-wider hover:bg-white/10 transition-all"
                  >
                    <UserPlus size={14} />
                    Add Member
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-white/[0.04] border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      {member.profile?.images?.[0] ? (
                        <img
                          src={member.profile.images[0]}
                          alt={member.profile.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <UsersRound size={18} className="text-bfl-muted" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">
                            {member.profile?.displayName || "Unknown"}
                          </p>
                          {member.isLead && (
                            <Crown size={14} className="text-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-bfl-muted">
                          {member.profile?.contactEmail || "No email"}
                        </p>
                      </div>
                    </div>
                    {isLead && !member.isLead && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={actionLoading}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        title="Remove member"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-white/10 flex gap-4">
              {isLead ? (
                <button
                  onClick={handleDeleteTeam}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-3 border border-red-500/30 text-red-400 text-xs font-mono uppercase tracking-wider hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete Team
                </button>
              ) : (
                <button
                  onClick={handleLeaveTeam}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-3 border border-red-500/30 text-red-400 text-xs font-mono uppercase tracking-wider hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  <LogOut size={16} />
                  Leave Team
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Teams Section */}
      {allTeams.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-white/20" />
            <span className="font-mono text-[10px] text-bfl-muted uppercase tracking-[0.4em]">
              All Teams ({allTeams.length})
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {allTeams.map((t) => (
              <div
                key={t.id}
                className={`p-6 border transition-all ${
                  team?.id === t.id
                    ? "bg-bfl-green/10 border-bfl-green/30"
                    : "bg-white/[0.04] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg text-white font-medium">{t.name}</h3>
                    <p className="text-xs text-bfl-muted font-mono">Team #{t.teamNumber}</p>
                  </div>
                  {team?.id === t.id && (
                    <span className="px-2 py-1 bg-bfl-green/20 text-bfl-green text-[10px] font-mono uppercase tracking-wider">
                      Your Team
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {t.leadProfile?.images?.[0] ? (
                    <img
                      src={t.leadProfile.images[0]}
                      alt={t.leadProfile.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Crown size={14} className="text-amber-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {t.leadProfile?.displayName || "Unknown Lead"}
                    </p>
                    <p className="text-xs text-bfl-muted">Team Lead</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{t.memberCount}</p>
                    <p className="text-xs text-bfl-muted">
                      {t.memberCount === 1 ? "member" : "members"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => {
            setShowAddMember(false);
            setSearchQuery("");
            setSearchResults([]);
            setHasSearched(false);
          }} />
          <div className="relative bg-bfl-black border border-white/10 p-8 max-w-md w-full">
            <button
              onClick={() => {
                setShowAddMember(false);
                setSearchQuery("");
                setSearchResults([]);
                setHasSearched(false);
              }}
              className="absolute top-4 right-4 text-bfl-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl text-white mb-6">Add Team Member</h3>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                  placeholder="Search by email..."
                  className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm focus:ring-1 focus:ring-bfl-green outline-none transition-all"
                />
                <button
                  onClick={handleSearchUsers}
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-3 bg-bfl-green text-black font-bold text-xs hover:bg-bfl-green/90 transition-all disabled:opacity-50"
                >
                  {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>

              <p className="text-xs text-bfl-muted">
                Search for participants by their contact email. Only users with a valid contact email can be added.
              </p>

              {/* Search Results */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.userId}
                    className="flex items-center justify-between p-3 bg-white/[0.04] border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      {result.images?.[0] ? (
                        <img
                          src={result.images[0]}
                          alt={result.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <UsersRound size={14} className="text-bfl-muted" />
                        </div>
                      )}
                      <div>
                        <p className="text-white text-sm">{result.displayName}</p>
                        <p className="text-xs text-bfl-muted">{result.contactEmail}</p>
                      </div>
                    </div>
                    {result.isInTeam ? (
                      <span className="text-xs text-amber-400">Already in a team</span>
                    ) : (
                      <button
                        onClick={() => handleAddMember(result.userId)}
                        disabled={addingMember === result.userId}
                        className="px-3 py-1.5 bg-bfl-green text-black text-xs font-bold hover:bg-bfl-green/90 transition-all disabled:opacity-50"
                      >
                        {addingMember === result.userId ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Add"
                        )}
                      </button>
                    )}
                  </div>
                ))}
                {searchResults.length === 0 && !hasSearched && !searching && (
                  <p className="text-center text-bfl-muted text-sm py-4">
                    Enter an email and click search to find users
                  </p>
                )}
                {searchResults.length === 0 && hasSearched && !searching && (
                  <p className="text-center text-bfl-muted text-sm py-4">
                    No users found matching "{searchQuery}"
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
