"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, ExternalLink, User, Maximize2, X, Briefcase, GraduationCap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface DirectoryProfile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
  images: string[];
  discordId: string | null;
  similarity?: number;
  searchedField?: "what_i_offer" | "what_im_looking_for";
  currentRole?: string;
  currentCompany?: string;
  university?: string;
}

export default function DirectoryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"offers" | "looking_for">("looking_for");
  const [expandedProfile, setExpandedProfile] = useState<DirectoryProfile | null>(null);

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
      const url = new URL("/api/profiles/directory", window.location.origin);
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
      setError(err instanceof Error ? err.message : "Something went wrong");
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      loadProfiles(searchQuery, true);
    }
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="flex min-h-screen flex-col p-4">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mb-6 mx-auto">
              <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
              <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="text-bfl-green" size={24} />
              </div>
            </div>
            <p className="font-mono text-xs font-normal text-white uppercase tracking-[0.5em]">Loading Registry</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col p-4">
        <div className="flex flex-1 items-center justify-center p-4">
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
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-5xl mx-auto min-h-screen">
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">All People</span>
        </div>
        <h2 className="text-6xl font-normal text-white tracking-tighter uppercase">Directory</h2>
      </div>

      {/* Search and Filter */}
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

      {/* Profile Grid */}
      {profiles.length === 0 ? (
        <div className="text-center py-32 px-12 bg-white/[0.02] border border-white/5 rounded-sm w-full max-w-2xl mx-auto">
          <div className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.6em] mb-8">No Results</div>
          <h3 className="text-5xl font-normal text-white mb-6 tracking-tighter">NOTHING HERE YET</h3>
          <p className="text-bfl-muted mb-12 font-medium max-w-md mx-auto leading-relaxed">
            {searchQuery ? "Try adjusting your search query" : "Be the first to join this session!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => {
            const discordDmUrl = profile.discordId
              ? `https://discord.com/users/${profile.discordId}`
              : null;

            return (
              <div
                key={profile.id}
                className="group relative bg-white/[0.03] backdrop-blur-sm rounded-[1rem] overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                onClick={() => setExpandedProfile(profile)}
              >
                {/* Square Image */}
                <div className="relative aspect-square w-full">
                  {profile.images && profile.images.length > 0 ? (
                    <img
                      src={profile.images[0]}
                      alt={profile.displayName}
                      className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-700"
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
                    className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Maximize2 size={14} className="text-white/80" />
                  </button>

                  {/* Name overlay at bottom of image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-normal text-white tracking-tight uppercase drop-shadow-lg">
                      {profile.displayName}
                    </h3>
                    {profile.similarity !== undefined && (
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
                  {/* Role & Company placeholder */}
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

                  {/* Action Buttons - Same size */}
                  <div className="pt-3 border-t border-white/10 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedProfile(profile);
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

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-3xl font-normal text-white tracking-tight uppercase">
                    {expandedProfile.displayName}
                  </h2>
                  {expandedProfile.similarity !== undefined && (
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

                {/* Action Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const discordDmUrl = expandedProfile.discordId
                        ? `https://discord.com/users/${expandedProfile.discordId}`
                        : null;
                      if (discordDmUrl) {
                        window.open(discordDmUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    disabled={!expandedProfile.discordId}
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

      {(searching || refreshing) && profiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass">
          <div className="text-center">
            <div className="relative w-24 h-24 mb-6 mx-auto">
              <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
              <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="text-bfl-green" size={32} />
              </div>
            </div>
            <p className="font-mono text-xs font-normal text-white uppercase tracking-[0.5em]">
              {searching ? "Computing Embeddings" : "Refreshing Registry"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}



