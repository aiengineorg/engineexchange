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
import { Search, RefreshCw, X, Zap } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
  similarity?: number;
  matchReason?: string;
  searchedField?: "what_i_offer" | "what_im_looking_for";
  images?: string[];
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

  // Check if profile exists on mount
  useEffect(() => {
    const checkProfile = async () => {
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
  }, [sessionId, router]);

  const handleSwipe = async (profileId: string, decision: "yes" | "no") => {
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

      // Show match modal if matched
      if (result.matched) {
        alert(`It's a Match! 🎉`); // TODO: Replace with proper match modal
        router.push(`/sessions/${sessionId}/matches`);
      }
    } catch (err) {
      console.error("Swipe error:", err);
      // On error, just remove from local state
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
      const decision = direction === "right" ? "yes" : "no";
      handleSwipe(selectedProfile.id, decision);
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
          <p className="font-mono text-xs font-bold text-white uppercase tracking-[0.5em]">Loading Profiles</p>
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
            className="px-8 py-3 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all"
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
        {/* Fixed Technical Header */}
        <div className="sticky top-0 z-50 glass border-b border-white/10 p-6 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-bfl-green uppercase tracking-[0.4em]">Neural Sync View</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-white font-black tracking-widest text-sm uppercase italic">{profile.displayName}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-w-3xl mx-auto w-full pb-32">
          {/* Immersive Hero Image */}
          <div className="relative h-[60vh] w-full mb-12">
            {profile.images?.[0] ? (
              <img
                src={profile.images[0]}
                className="w-full h-full object-cover grayscale-[0.1]"
                alt={profile.displayName}
              />
            ) : (
              <div className="w-full h-full bg-bfl-dark" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bfl-black via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10">
              <h1 className="text-7xl font-black text-white italic tracking-tighter uppercase mb-2 text-glow">
                {profile.displayName}
              </h1>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-bfl-green font-bold uppercase tracking-[0.3em]">
                  {profile.id} / SYNCHRONIZED
                </span>
              </div>
            </div>
          </div>

          {/* Technical Sections */}
          <div className="px-6 space-y-16">
            <div className="relative pt-8 border-t border-white/10">
              <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
                01 / What I Offer
              </span>
              <h4 className="text-2xl font-bold text-white italic mb-6">"I am currently offering..."</h4>
              <p className="text-xl text-bfl-muted leading-relaxed font-light italic">{profile.whatIOffer}</p>
            </div>

            <div className="relative pt-8 border-t border-white/10">
              <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
                02 / Search Parameters
              </span>
              <h4 className="text-2xl font-bold text-white italic mb-6">"I'm looking for..."</h4>
              <p className="text-xl text-bfl-muted leading-relaxed font-light italic">{profile.whatImLookingFor}</p>
            </div>

            {profile.similarity !== undefined && (
              <div className="relative pt-8 border-t border-white/10">
                <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
                  03 / AI Synergy Analysis
                </span>
                <div className="bg-white/[0.02] subtle-border p-8 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-bfl-green" />
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Zap className="text-bfl-green" size={20} fill="currentColor" />
                      <span className="font-mono text-sm font-bold text-white uppercase tracking-widest">
                        Similarity: {Math.round(profile.similarity * 100)}%
                      </span>
                    </div>
                    <div className="px-3 py-1 bg-bfl-green/20 border border-bfl-green/50 text-[10px] text-bfl-green font-black uppercase tracking-widest rounded">
                      Validated
                    </div>
                  </div>
                  {profile.matchReason && (
                    <p className="text-sm text-bfl-muted leading-relaxed italic border-l border-white/10 pl-6 py-2">
                      {profile.matchReason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Persistent Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-8 glass border-t border-white/10">
          <div className="max-w-xl mx-auto flex gap-6">
            <button
              onClick={() => {
                onSwipe("left");
                onClose();
              }}
              className="flex-1 py-5 border border-red-500/20 text-red-500 font-black text-xs uppercase tracking-[0.4em] hover:bg-red-500/10 transition-all italic rounded-sm"
            >
              Skip
            </button>
            <button
              onClick={() => {
                onSwipe("right");
                onClose();
              }}
              className="flex-2 px-12 py-5 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.4em] hover:bg-bfl-offwhite transition-all italic rounded-sm"
            >
              Initiate Connection
            </button>
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
        <h2 className="text-6xl font-extrabold text-white tracking-tighter italic uppercase">Discover</h2>
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
            className="px-10 py-6 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all disabled:opacity-50 rounded-sm whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start relative">
        {profiles.length === 0 && !loading ? (
          <div className="text-center py-32 px-12 bg-white/[0.02] border border-white/5 rounded-sm w-full max-w-2xl">
            <div className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.6em] mb-8">All Caught Up</div>
            <h3 className="text-5xl font-extrabold text-white mb-6 italic tracking-tighter">NO MORE FOR NOW!</h3>
            <p className="text-bfl-muted mb-12 font-medium max-w-md mx-auto leading-relaxed">
              You've seen everyone for today. Check back later for new people or try adjusting your search.
            </p>
            <button
              onClick={() => loadProfiles()}
              className="px-12 py-5 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.3em] hover:bg-bfl-offwhite transition-all"
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
                <p className="font-mono text-xs font-bold text-white uppercase tracking-[0.5em]">Computing Embeddings</p>
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
