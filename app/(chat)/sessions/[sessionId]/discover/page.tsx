"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CardStack } from "@/components/matching/card-stack";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, Zap, Users, User, Linkedin, Globe, ChevronLeft, ChevronRight } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
  similarity?: number;
  matchReason?: string;
  searchedField?: "what_i_offer" | "what_im_looking_for";
  images?: string[];
  linkedinUrl?: string;
  websiteOrGithub?: string;
  hasTeam?: boolean;
}

export default function DiscoverPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"offers" | "looking_for">("looking_for");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Check for test mode from URL
  const [testMode, setTestMode] = useState<boolean | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTestMode(params.get("test") === "true");
  }, []);

  const loadProfiles = async (customQuery?: string, isSearch = false, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (isSearch) {
      setSearching(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const url = new URL("/api/feed/discover", window.location.origin);
      url.searchParams.set("sessionId", sessionId);
      if (testMode === true) {
        url.searchParams.set("test", "true");
      }
      if (customQuery) {
        url.searchParams.set("query", customQuery);
        url.searchParams.set("searchField", searchField);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.details || data.error || "Failed to load profiles";
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setProfiles(data);
    } catch (err) {
      console.error("Failed to load profiles:", err);
      setError(err instanceof Error ? err.message : "Failed to load profiles");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else if (isSearch) {
        setSearching(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Check if profile exists on mount (skip in test mode)
  useEffect(() => {
    // Wait for testMode to be determined
    if (testMode === null) return;

    const checkProfile = async () => {
      // In test mode, skip profile check and load test cards directly
      if (testMode) {
        loadProfiles();
        return;
      }

      try {
        const response = await fetch(`/api/profiles/me?sessionId=${sessionId}`);

        if (response.status === 404) {
          // Profile doesn't exist, redirect to profile creation
          router.push(`/sessions/${sessionId}/profile/new`);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to check profile");
        }

        // Profile exists, load profiles
        loadProfiles();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      }
    };

    checkProfile();
  }, [sessionId, router, testMode]);

  const handleSwipe = async (profileId: string, decision: "yes" | "no") => {
    // Clear selectedProfile if we're swiping that profile
    if (selectedProfile?.id === profileId) {
      setSelectedProfile(null);
    }

    // In test mode, just remove from local state without API call
    if (testMode) {
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      return;
    }

    try {
      const response = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: profileId,
          sessionId,
          decision,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to swipe");
      }

      const result = await response.json();

      // Remove swiped profile from array
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));

      // Show match modal if matched
      if (result.matched) {
        alert(`It's a Match! 🎉`); // TODO: Replace with proper match modal
        router.push(`/sessions/${sessionId}/matches`);
      }
    } catch (err) {
      console.error("Swipe error:", err);
      // On error, still remove from local state to prevent stuck cards
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      loadProfiles(searchQuery, true);
    }
  };

  const handleCardClick = (profile: Profile) => {
    setSelectedProfile(profile);
  };

  const handleSwipeFromDetail = (direction: "left" | "right") => {
    if (selectedProfile) {
      const profileId = selectedProfile.id;
      const decision = direction === "right" ? "yes" : "no";
      // Close dialog first, then swipe
      setSelectedProfile(null);
      handleSwipe(profileId, decision);
    }
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mb-6 mx-auto">
            <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="text-bfl-green" size={24} />
            </div>
          </div>
          <p className="font-mono text-xs font-normal text-white uppercase tracking-[0.5em]">Loading Profiles</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center bg-white/[0.02] subtle-border p-8">
          <p className="text-red-400 mb-4 font-mono text-sm">{error}</p>
          <p className="text-sm text-bfl-muted mb-6 font-medium">
            If you just created your profile, please wait a moment for embeddings to be generated.
          </p>
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

  const ProfileDetail = ({ profile, onClose, onSwipe }: { profile: Profile; onClose: () => void; onSwipe: (dir: "left" | "right") => void }) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-[100] bg-bfl-black flex flex-col overflow-y-auto"
      >
        {/* Fixed Header */}
        <div className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col">
              <span className="font-mono text-[8px] text-bfl-green uppercase tracking-[0.3em]">Profile Details</span>
              <h2 className="text-white font-normal text-sm uppercase">{profile.displayName}</h2>
            </div>
          </div>
          {profile.similarity !== undefined && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-bfl-green animate-pulse" />
              <span className="font-mono text-sm text-bfl-green font-bold">
                {Math.round(profile.similarity * 100)}% Match
              </span>
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto w-full pb-32">
          {/* Hero Image */}
          <div className="relative h-[50vh] w-full">
            {profile.images?.[0] ? (
              <img
                src={profile.images[0]}
                className="w-full h-full object-cover object-[center_20%]"
                alt={profile.displayName}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-bfl-dark to-bfl-black flex items-center justify-center">
                <div className="text-white/20 text-8xl font-bold">{profile.displayName.charAt(0)}</div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bfl-black via-bfl-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-4xl md:text-5xl font-normal text-white tracking-tight uppercase mb-2">
                {profile.displayName}
              </h1>
            </div>
          </div>

          {/* Profile Details Section - Team Status & Links */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Team Status Indicator */}
              <div className="flex items-center gap-2">
                {profile.hasTeam ? (
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

              {/* Social Links - Only show if URL exists */}
              <div className="flex items-center gap-2">
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-[#0077b5]/20 transition-colors border border-white/10"
                  >
                    <Linkedin size={16} className="text-white/60 hover:text-[#0077b5]" />
                  </a>
                )}
                {profile.websiteOrGithub && (
                  <a
                    href={profile.websiteOrGithub.startsWith("http") ? profile.websiteOrGithub : `https://${profile.websiteOrGithub}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                  >
                    <Globe size={16} className="text-white/60 hover:text-white" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* What I Offer */}
              <div className="space-y-3 p-4 bg-white/[0.02] rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="h-px w-4 bg-bfl-green" />
                  <h4 className="font-mono text-[10px] font-bold text-bfl-green uppercase tracking-[0.15em]">What I Offer</h4>
                </div>
                <p className="text-sm text-white leading-relaxed">
                  {profile.whatIOffer}
                </p>
              </div>

              {/* What I'm Looking For */}
              <div className="space-y-3 p-4 bg-white/[0.02] rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="h-px w-4 bg-bfl-muted" />
                  <h4 className="font-mono text-[10px] font-bold text-bfl-muted uppercase tracking-[0.15em]">Looking For</h4>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {profile.whatImLookingFor}
                </p>
              </div>
            </div>

            {/* Match Reason */}
            {profile.matchReason && (
              <div className="mt-6 p-4 bg-bfl-green/5 rounded-lg border border-bfl-green/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="text-bfl-green" size={14} fill="currentColor" />
                  <h4 className="font-mono text-[10px] font-bold text-bfl-green uppercase tracking-[0.15em]">Why You Match</h4>
                </div>
                <p className="text-sm text-bfl-green/90 leading-relaxed">
                  {profile.matchReason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Persistent Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-6 glass border-t border-white/10">
          <div className="max-w-2xl mx-auto">
            {/* Swipe Hint */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center gap-1 text-red-500/60">
                <ChevronLeft size={14} />
                <span className="font-mono text-[9px] uppercase tracking-wider">Skip</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-0.5 bg-white/20 rounded-full" />
                  <div className="w-2 h-2 border border-white/30 rounded-full" />
                  <div className="w-8 h-0.5 bg-white/20 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-500/60">
                <span className="font-mono text-[9px] uppercase tracking-wider">Connect</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => onSwipe("left")}
                className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-all active:scale-95"
                aria-label="Skip"
              >
                <span className="text-red-500 text-2xl font-bold">✕</span>
              </button>

              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">swipe or tap</span>
              </div>

              <button
                onClick={() => onSwipe("right")}
                className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center hover:bg-green-500/20 transition-all active:scale-95"
                aria-label="Connect"
              >
                <span className="text-green-500 text-2xl font-bold">✓</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="px-6 py-12 md:px-12 max-w-5xl mx-auto flex flex-col min-h-screen">
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Find People</span>
        </div>
        <h2 className="text-6xl font-normal text-white tracking-tighter uppercase">Discover</h2>
      </div>

      <div className="mb-20">
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          <Select value={searchField} onValueChange={(value: "offers" | "looking_for") => setSearchField(value)}>
            <SelectTrigger className="w-full md:w-auto min-w-[180px] h-auto py-6 px-6 bg-white/[0.02] border border-white/10 rounded-sm text-white font-mono text-sm uppercase tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all">
              <SelectValue placeholder="Search field" />
            </SelectTrigger>
            <SelectContent className="bg-bfl-dark border border-white/10 rounded-sm">
              <SelectItem value="offers" className="font-mono text-sm uppercase tracking-widest py-3 text-white focus:bg-white/10 focus:text-white">I can offer</SelectItem>
              <SelectItem value="looking_for" className="font-mono text-sm uppercase tracking-widest py-3 text-white focus:bg-white/10 focus:text-white">Looking for</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="text-white/20" size={20} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by skills, expertise..."
              className="w-full pl-16 pr-14 py-6 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all"
            />
            <button
              onClick={() => loadProfiles(undefined, false, true)}
              disabled={refreshing}
              className="absolute inset-y-0 right-4 flex items-center text-bfl-muted hover:text-white transition-all"
              title="Refresh profiles"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || searching}
            className="px-10 py-6 bg-white text-bfl-black font-medium text-xs uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all disabled:opacity-50 rounded-sm whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start relative">
        {profiles.length === 0 && !loading ? (
          <div className="text-center py-32 px-12 bg-white/[0.02] border border-white/5 rounded-sm w-full max-w-2xl">
            <div className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.6em] mb-8">All Caught Up</div>
            <h3 className="text-5xl font-normal text-white mb-6 tracking-tighter">NO MORE FOR NOW!</h3>
            <p className="text-bfl-muted mb-12 font-medium max-w-md mx-auto leading-relaxed">
              You've seen everyone for today. Check back later for new people or try adjusting your search.
            </p>
            <button
              onClick={() => loadProfiles()}
              className="px-12 py-5 bg-white text-bfl-black font-medium text-xs uppercase tracking-[0.3em] hover:bg-bfl-offwhite transition-all"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="relative w-full flex justify-center h-[700px]">
            <CardStack
              profiles={profiles}
              sessionId={sessionId}
              onSwipe={handleSwipe}
              onCardClick={setSelectedProfile}
            />
            {(searching || refreshing) && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center glass rounded-sm max-w-[420px] border border-white/20">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
                  <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="text-bfl-green" size={32} />
                  </div>
                </div>
                <p className="font-mono text-xs font-normal text-white uppercase tracking-[0.5em]">Computing Embeddings</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Profile Detail Overlay */}
      <AnimatePresence>
        {selectedProfile && (
          <ProfileDetail
            profile={selectedProfile}
            onClose={() => setSelectedProfile(null)}
            onSwipe={handleSwipeFromDetail}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
