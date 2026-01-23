"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ExternalLink, User, Maximize2, X, Users, Linkedin, Globe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Match {
  match: {
    id: string;
    createdAt: string;
  };
  otherProfile: {
    id: string;
    displayName: string;
    whatIOffer: string;
    whatImLookingFor: string;
    images: string[];
    matchReason?: string;
    searchedField?: "what_i_offer" | "what_im_looking_for";
    linkedinUrl?: string | null;
    websiteOrGithub?: string | null;
    hasTeam?: boolean | null;
  };
  otherUserDiscordId: string | null;
}

// Mock data for test mode
const TEST_MATCHES: Match[] = [
  {
    match: {
      id: "test-match-1",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
    otherProfile: {
      id: "test-1",
      displayName: "Alex Chen",
      whatIOffer: "Full-stack development expertise with React, Node.js, and PostgreSQL. 5+ years building scalable web applications. Happy to mentor junior developers and provide code reviews.",
      whatImLookingFor: "Looking for a co-founder for a B2B SaaS startup. Need someone with sales/marketing experience who can help with go-to-market strategy.",
      images: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"],
      matchReason: "Strong technical background matches your need for a technical co-founder. Their mentorship offering aligns with your interest in learning.",
      linkedinUrl: "https://linkedin.com/in/alexchen",
      websiteOrGithub: "https://github.com/alexchen",
      hasTeam: true,
    },
    otherUserDiscordId: "123456789",
  },
  {
    match: {
      id: "test-match-2",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
    otherProfile: {
      id: "test-2",
      displayName: "Sarah Miller",
      whatIOffer: "Growth marketing expertise - helped 3 startups scale from 0 to 100k users. Can help with SEO, content strategy, and paid acquisition.",
      whatImLookingFor: "Technical co-founder for a consumer social app. Looking for someone who can build iOS/Android apps and has experience with real-time features.",
      images: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"],
      matchReason: "Her marketing expertise complements your technical skills perfectly for a startup partnership.",
      linkedinUrl: "https://linkedin.com/in/sarahmiller",
      hasTeam: false,
    },
    otherUserDiscordId: "987654321",
  },
  {
    match: {
      id: "test-match-3",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    },
    otherProfile: {
      id: "test-3",
      displayName: "Jordan Lee",
      whatIOffer: "AI/ML expertise with focus on NLP and computer vision. Published researcher with experience deploying models at scale. Can help with technical architecture for AI products.",
      whatImLookingFor: "Looking to join an early-stage startup as a technical advisor or part-time contributor. Interested in healthcare or education tech.",
      images: ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop"],
      matchReason: "Their AI expertise could be valuable for building intelligent features in your product.",
      websiteOrGithub: "https://jordanlee.ai",
      hasTeam: false,
    },
    otherUserDiscordId: null,
  },
];

export default function MatchesPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expandedProfile, setExpandedProfile] = useState<Match | null>(null);
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

  const loadMatches = async (isRefresh = false) => {
    if (!sessionId) return;

    // In test mode, use mock data
    if (testMode) {
      setMatches(TEST_MATCHES);
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

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

      // Profile exists, load matches
      const url = new URL("/api/matches", window.location.origin);
      url.searchParams.set("sessionId", sessionId);

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      }
    } catch (err) {
      console.error("Failed to load matches:", err);
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
    loadMatches();
  }, [sessionId, router, testMode]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col p-4">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mb-6 mx-auto">
              <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
              <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
            </div>
            <p className="font-mono text-xs font-normal text-white uppercase tracking-[0.5em]">Loading Matches</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-5xl mx-auto min-h-screen">
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Your Connections</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-6xl font-normal text-white tracking-tighter uppercase">Matches</h2>
          <button
            onClick={() => loadMatches(true)}
            disabled={refreshing}
            className="flex items-center gap-3 px-6 py-3 border border-white/10 text-bfl-muted font-bold text-[10px] uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-32 px-12 bg-white/[0.02] border border-white/5 rounded-sm w-full max-w-2xl mx-auto">
          <div className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.6em] mb-8">No Matches Yet</div>
          <h3 className="text-5xl font-normal text-white mb-6 tracking-tighter">KEEP SWIPING!</h3>
          <p className="text-bfl-muted mb-12 font-medium max-w-md mx-auto leading-relaxed">
            Go to Discover to find people and make connections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessionId && matches.map((m) => {
            const discordDmUrl = m.otherUserDiscordId
              ? `https://discord.com/users/${m.otherUserDiscordId}`
              : null;
            const profile = m.otherProfile;

            return (
              <div
                key={m.match.id}
                className="relative bg-white/[0.03] backdrop-blur-sm rounded-[1rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-pointer"
                onClick={() => setExpandedProfile(m)}
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
                      setExpandedProfile(m);
                    }}
                    className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/70 transition-colors"
                  >
                    <Maximize2 size={14} className="text-white/80" />
                  </button>

                  {/* Match date badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-bfl-green/20 backdrop-blur-sm rounded text-[9px] font-mono text-bfl-green uppercase tracking-wider">
                      Matched {new Date(m.match.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Name overlay at bottom of image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-normal text-white tracking-tight uppercase drop-shadow-lg">
                      {profile.displayName}
                    </h3>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-4">
                  {/* Team Status & Social Links */}
                  <div className="mb-3 pb-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {profile.hasTeam ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-bfl-green/15 border border-bfl-green/30 rounded-full">
                          <Users size={10} className="text-bfl-green" />
                          <span className="text-[9px] font-bold text-bfl-green uppercase tracking-wider">Has Team</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-full">
                          <User size={10} className="text-bfl-muted" />
                          <span className="text-[9px] font-medium text-bfl-muted uppercase tracking-wider">Looking for Team</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.linkedinUrl && (
                        <a
                          href={profile.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-[#0077b5]/30 hover:bg-[#0077b5]/50 transition-all border border-[#0077b5]/50 hover:scale-105"
                        >
                          <Linkedin size={16} className="text-[#0077b5]" />
                        </a>
                      )}
                      {profile.websiteOrGithub && (
                        <a
                          href={profile.websiteOrGithub.startsWith("http") ? profile.websiteOrGithub : `https://${profile.websiteOrGithub}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20 hover:scale-105"
                        >
                          <Globe size={16} className="text-white/90" />
                        </a>
                      )}
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

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-white/10 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedProfile(m);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-bfl-black font-medium text-[9px] uppercase tracking-[0.15em] hover:bg-bfl-offwhite transition-all rounded-sm"
                    >
                      <Maximize2 size={12} />
                      Expand
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (discordDmUrl) {
                          window.open(discordDmUrl, "_blank", "noopener,noreferrer");
                        }
                      }}
                      disabled={!discordDmUrl}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-white/10 text-white font-normal text-[9px] uppercase tracking-[0.15em] hover:bg-white/5 transition-all rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ExternalLink size={12} />
                      Discord
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
                {expandedProfile.otherProfile.images && expandedProfile.otherProfile.images.length > 0 ? (
                  <img
                    src={expandedProfile.otherProfile.images[0]}
                    alt={expandedProfile.otherProfile.displayName}
                    className="w-full h-full object-cover object-[center_20%]"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                    <User className="text-white/20" size={80} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Match date badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-bfl-green/20 backdrop-blur-sm rounded text-[10px] font-mono text-bfl-green uppercase tracking-wider">
                    Matched {new Date(expandedProfile.match.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-3xl font-normal text-white tracking-tight uppercase">
                    {expandedProfile.otherProfile.displayName}
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Team Status & Social Links */}
                <div className="mb-4 pb-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedProfile.otherProfile.hasTeam ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-bfl-green/15 border border-bfl-green/30 rounded-full">
                        <Users size={14} className="text-bfl-green" />
                        <span className="text-xs font-bold text-bfl-green uppercase tracking-wider">Has Team</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                        <User size={14} className="text-bfl-muted" />
                        <span className="text-xs font-medium text-bfl-muted uppercase tracking-wider">Looking for Team</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedProfile.otherProfile.linkedinUrl && (
                      <a
                        href={expandedProfile.otherProfile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-[#0077b5]/30 hover:bg-[#0077b5]/50 transition-all border border-[#0077b5]/50 hover:scale-105"
                      >
                        <Linkedin size={18} className="text-[#0077b5]" />
                      </a>
                    )}
                    {expandedProfile.otherProfile.websiteOrGithub && (
                      <a
                        href={expandedProfile.otherProfile.websiteOrGithub.startsWith("http") ? expandedProfile.otherProfile.websiteOrGithub : `https://${expandedProfile.otherProfile.websiteOrGithub}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20 hover:scale-105"
                      >
                        <Globe size={18} className="text-white/90" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Match Reason */}
                {expandedProfile.otherProfile.matchReason && (
                  <div className="relative mb-4 pb-4 border-b border-white/10">
                    <div className="absolute left-0 top-0 bottom-4 w-px bg-bfl-green/30" />
                    <div className="pl-4">
                      <p className="font-mono text-[9px] font-bold text-bfl-muted uppercase tracking-[0.3em] mb-2">Match Analysis</p>
                      <p className="text-bfl-muted text-sm leading-relaxed font-light">
                        "{expandedProfile.otherProfile.matchReason}"
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
                      {expandedProfile.otherProfile.whatIOffer}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px w-3 bg-bfl-muted" />
                      <h4 className="font-mono text-[10px] font-bold text-bfl-muted uppercase tracking-[0.15em]">Looking For</h4>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {expandedProfile.otherProfile.whatImLookingFor}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const discordDmUrl = expandedProfile.otherUserDiscordId
                        ? `https://discord.com/users/${expandedProfile.otherUserDiscordId}`
                        : null;
                      if (discordDmUrl) {
                        window.open(discordDmUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    disabled={!expandedProfile.otherUserDiscordId}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-bfl-black font-medium text-[10px] uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ExternalLink size={14} />
                    Open Discord
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
