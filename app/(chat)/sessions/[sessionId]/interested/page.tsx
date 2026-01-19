"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Heart, ExternalLink, User, Maximize2, X, Briefcase, GraduationCap, Check, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Profile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
  images?: string[];
  similarity?: number;
  matchReason?: string;
  currentRole?: string;
  currentCompany?: string;
  university?: string;
}

// Mock data for test mode
const TEST_PROFILES: Profile[] = [
  {
    id: "test-interested-1",
    displayName: "Emily Zhang",
    whatIOffer: "Product management experience at top tech companies. Led teams shipping products used by millions. Can help with product strategy, roadmap planning, and user research.",
    whatImLookingFor: "Technical co-founder for a developer tools startup. Looking for someone passionate about improving developer experience.",
    images: ["https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop"],
    similarity: 0.88,
    matchReason: "Your technical background in developer tools aligns perfectly with what she's looking for in a co-founder.",
    currentRole: "Product Manager",
    currentCompany: "Meta",
    university: "Carnegie Mellon University",
  },
  {
    id: "test-interested-2",
    displayName: "Marcus Johnson",
    whatIOffer: "Deep expertise in mobile development (iOS/Android). Built apps with 10M+ downloads. Happy to share knowledge about app store optimization and mobile UX.",
    whatImLookingFor: "Backend engineer for a fitness tech startup. Need someone who can build scalable APIs and handle real-time data syncing.",
    images: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"],
    similarity: 0.75,
    matchReason: "His mobile expertise complements your backend skills for building a full-stack product.",
    currentRole: "iOS Lead",
    currentCompany: "Peloton",
    university: "Georgia Tech",
  },
  {
    id: "test-interested-3",
    displayName: "Priya Patel",
    whatIOffer: "Data science and ML expertise. Experience building recommendation systems and predictive models. Can help with data strategy and analytics infrastructure.",
    whatImLookingFor: "Founders building in the AI/ML space. Interested in joining as an early team member or advisor for equity.",
    images: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop"],
    similarity: 0.92,
    matchReason: "Her ML expertise could be invaluable for building intelligent features in your product.",
    currentRole: "Senior Data Scientist",
    currentCompany: "Spotify",
    university: "Columbia University",
  },
  {
    id: "test-interested-4",
    displayName: "David Kim",
    whatIOffer: "Venture capital experience and investor network. Previously founded and exited a SaaS company. Can help with fundraising strategy and investor introductions.",
    whatImLookingFor: "Promising early-stage startups to angel invest in. Particularly interested in B2B software and fintech.",
    images: ["https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"],
    similarity: 0.68,
    matchReason: "His experience as a founder and investor could provide valuable guidance for your startup journey.",
    currentRole: "Partner",
    currentCompany: "Sequoia Capital",
    university: "Harvard Business School",
  },
];

export default function InterestedPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expandedProfile, setExpandedProfile] = useState<Profile | null>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [testMode, setTestMode] = useState<boolean | null>(null);

  // Check for test mode from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setTestMode(urlParams.get("test") === "true");
  }, []);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  const loadProfiles = async (isRefresh = false) => {
    if (!sessionId) return;

    // In test mode, use mock data
    if (testMode) {
      setProfiles(TEST_PROFILES);
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      // Check if profile exists first
      const profileCheck = await fetch(`/api/profiles/me?sessionId=${sessionId}`);

      if (profileCheck.status === 404) {
        // Profile doesn't exist, redirect to profile creation
        router.push(`/sessions/${sessionId}/profile/new`);
        return;
      }

      if (!profileCheck.ok) {
        throw new Error("Failed to check profile");
      }

      // Profile exists, load interested profiles
      const url = new URL("/api/feed/interested", window.location.origin);
      url.searchParams.set("sessionId", sessionId);

      const response = await fetch(url.toString());

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load profiles");
      }

      const data = await response.json();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Wait for testMode to be determined
    if (testMode === null) return;
    loadProfiles();
  }, [sessionId, router, testMode]);

  const handleSwipe = async (profileId: string, decision: "yes" | "no") => {
    if (!sessionId || swipingId) return;

    setSwipingId(profileId);

    // In test mode, just remove from local state without API call
    if (testMode) {
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      if (expandedProfile?.id === profileId) {
        setExpandedProfile(null);
      }
      setSwipingId(null);
      return;
    }

    try {
      const response = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: profileId,
          sessionId: sessionId,
          decision,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to swipe");
      }

      const result = await response.json();

      // Remove the profile from the list
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));

      // Close expanded view if this profile was expanded
      if (expandedProfile?.id === profileId) {
        setExpandedProfile(null);
      }

      if (result.matched) {
        alert(`It's a Match! 🎉`);
        router.push(`/sessions/${sessionId}/matches`);
      }
    } catch (err) {
      console.error("Swipe error:", err);
    } finally {
      setSwipingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mb-6 mx-auto">
            <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="text-bfl-green" size={24} />
            </div>
          </div>
          <p className="font-mono text-xs font-normal text-white uppercase tracking-[0.5em]">Loading</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center bg-white/[0.02] subtle-border p-8">
          <p className="text-red-400 mb-4 font-mono text-sm">{error}</p>
          <button
            onClick={() => loadProfiles()}
            className="px-8 py-3 bg-white text-bfl-black font-medium text-xs uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-5xl mx-auto min-h-screen">
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">People Who Like You</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-6xl font-normal text-white tracking-tighter uppercase">Interested In You</h2>
          <button
            onClick={() => loadProfiles(true)}
            disabled={refreshing}
            className="flex items-center gap-3 px-6 py-3 border border-white/10 text-bfl-muted font-bold text-[10px] uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-32 px-12 bg-white/[0.02] border border-white/5 rounded-sm w-full max-w-2xl mx-auto">
          <div className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.6em] mb-8">No One Yet</div>
          <h3 className="text-5xl font-normal text-white mb-6 tracking-tighter">KEEP SWIPING!</h3>
          <p className="text-bfl-muted mb-12 font-medium max-w-md mx-auto leading-relaxed">
            No one has shown interest yet. Keep discovering and connecting with people!
          </p>
          <button
            onClick={() => router.push(`/sessions/${sessionId}/discover`)}
            className="px-12 py-5 bg-white text-bfl-black font-medium text-xs uppercase tracking-[0.3em] hover:bg-bfl-offwhite transition-all"
          >
            Go to Discover
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="relative bg-white/[0.03] backdrop-blur-sm rounded-[1rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-pointer"
              onClick={() => setExpandedProfile(profile)}
            >
              {/* Image - slightly smaller on mobile */}
              <div className="relative h-[200px] sm:aspect-square w-full">
                {profile.images && profile.images.length > 0 ? (
                  <img
                    src={profile.images[0]}
                    alt={profile.displayName}
                    className="w-full h-full object-cover object-[center_20%]"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                    <User className="text-white/20" size={64} />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Expand button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedProfile(profile);
                  }}
                  className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/70 transition-colors"
                >
                  <Maximize2 size={14} className="text-white/80" />
                </button>

                {/* Interested badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-pink-500/20 backdrop-blur-sm rounded text-[9px] font-mono text-pink-400 uppercase tracking-wider flex items-center gap-1">
                    <Heart size={10} className="fill-pink-400" />
                    Interested
                  </span>
                </div>

                {/* Name overlay at bottom of image */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl font-normal text-white tracking-tight uppercase drop-shadow-lg">
                    {profile.displayName}
                  </h3>
                  {profile.similarity !== undefined && profile.similarity > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-bfl-green animate-pulse" />
                      <span className="font-mono text-xs text-bfl-green font-bold drop-shadow">
                        {Math.round(profile.similarity * 100)}% Match
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4">
                {/* Role & Company */}
                <div className="mb-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2 text-white/80 mb-1">
                    <Briefcase size={11} className="text-bfl-muted flex-shrink-0" />
                    <span className="text-[11px] font-medium truncate">
                      {profile.currentRole || "Role"} at {profile.currentCompany || "Company"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <GraduationCap size={11} className="text-bfl-muted flex-shrink-0" />
                    <span className="text-[11px] truncate">
                      {profile.university || "University"}
                    </span>
                  </div>
                </div>

                {/* Two Column Layout for Offer/Looking For */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-px w-2 bg-bfl-green" />
                      <h4 className="font-mono text-[8px] font-bold text-bfl-green uppercase tracking-[0.1em]">What I Offer</h4>
                    </div>
                    <p className="text-[11px] text-white leading-relaxed font-medium line-clamp-3">
                      {profile.whatIOffer}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-px w-2 bg-bfl-muted" />
                      <h4 className="font-mono text-[8px] font-bold text-bfl-muted uppercase tracking-[0.1em]">Looking For</h4>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed font-medium line-clamp-3">
                      {profile.whatImLookingFor}
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Connect/Skip */}
                <div className="pt-3 border-t border-white/10 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwipe(profile.id, "yes");
                    }}
                    disabled={swipingId === profile.id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500/20 border border-green-500/30 text-green-400 font-medium text-[9px] uppercase tracking-[0.15em] hover:bg-green-500/30 transition-all rounded-sm disabled:opacity-50"
                  >
                    <Check size={12} />
                    Connect
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwipe(profile.id, "no");
                    }}
                    disabled={swipingId === profile.id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-normal text-[9px] uppercase tracking-[0.15em] hover:bg-red-500/20 transition-all rounded-sm disabled:opacity-50"
                  >
                    <XIcon size={12} />
                    Skip
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Profile Overlay */}
      <AnimatePresence>
        {expandedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setExpandedProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white/[0.05] backdrop-blur-md rounded-[1rem] overflow-hidden border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setExpandedProfile(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/70 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>

              {/* Image */}
              <div className="relative h-64 w-full">
                {expandedProfile.images && expandedProfile.images.length > 0 ? (
                  <img
                    src={expandedProfile.images[0]}
                    alt={expandedProfile.displayName}
                    className="w-full h-full object-cover object-[center_20%]"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                    <User className="text-white/20" size={80} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Interested badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-pink-500/20 backdrop-blur-sm rounded text-[10px] font-mono text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart size={12} className="fill-pink-400" />
                    Interested in You
                  </span>
                </div>

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-3xl font-normal text-white tracking-tight uppercase">
                    {expandedProfile.displayName}
                  </h2>
                  {expandedProfile.similarity !== undefined && expandedProfile.similarity > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-2 w-2 rounded-full bg-bfl-green animate-pulse" />
                      <span className="font-mono text-sm text-bfl-green font-bold">
                        {Math.round(expandedProfile.similarity * 100)}% Match
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Role & Company */}
                <div className="mb-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2 text-white/80 mb-1">
                    <Briefcase size={14} className="text-bfl-muted" />
                    <span className="text-sm font-medium">
                      {expandedProfile.currentRole || "Role"} at {expandedProfile.currentCompany || "Company"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <GraduationCap size={14} className="text-bfl-muted" />
                    <span className="text-sm">
                      {expandedProfile.university || "University"}
                    </span>
                  </div>
                </div>

                {/* Match Reason */}
                {expandedProfile.matchReason && (
                  <div className="relative mb-4 pb-4 border-b border-white/10">
                    <div className="absolute left-0 top-0 bottom-4 w-px bg-bfl-green/30" />
                    <div className="pl-4">
                      <p className="font-mono text-[9px] font-bold text-bfl-muted uppercase tracking-[0.3em] mb-2">Why You Match</p>
                      <p className="text-bfl-muted text-sm leading-relaxed font-light italic">
                        "{expandedProfile.matchReason}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Offer / Looking For */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px w-3 bg-bfl-green" />
                      <h4 className="font-mono text-[10px] font-bold text-bfl-green uppercase tracking-[0.15em]">What I Offer</h4>
                    </div>
                    <p className="text-sm text-white leading-relaxed">
                      {expandedProfile.whatIOffer}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px w-3 bg-bfl-muted" />
                      <h4 className="font-mono text-[10px] font-bold text-bfl-muted uppercase tracking-[0.15em]">Looking For</h4>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {expandedProfile.whatImLookingFor}
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Connect/Skip */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSwipe(expandedProfile.id, "yes")}
                    disabled={swipingId === expandedProfile.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/30 text-green-400 font-medium text-[10px] uppercase tracking-[0.2em] hover:bg-green-500/30 transition-all rounded-sm disabled:opacity-50"
                  >
                    <Check size={14} />
                    Connect
                  </button>
                  <button
                    onClick={() => handleSwipe(expandedProfile.id, "no")}
                    disabled={swipingId === expandedProfile.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 font-normal text-[10px] uppercase tracking-[0.2em] hover:bg-red-500/20 transition-all rounded-sm disabled:opacity-50"
                  >
                    <XIcon size={14} />
                    Skip
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
