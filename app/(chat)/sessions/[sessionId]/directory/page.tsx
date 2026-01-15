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
import { Search, RefreshCw, ExternalLink, User, Loader2 } from "lucide-react";

interface DirectoryProfile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
  images: string[];
  discordId: string | null;
  similarity?: number;
  searchedField?: "what_i_offer" | "what_im_looking_for";
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
  const [searchField, setSearchField] = useState<"offers" | "looking_for">("offers");

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
            <p className="font-mono text-xs font-bold text-white uppercase tracking-[0.5em]">Loading Registry</p>
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
              className="px-8 py-3 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all"
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
        <div className="flex items-center justify-between">
          <h2 className="text-6xl font-extrabold text-white tracking-tighter italic uppercase">Directory</h2>
          <button
            onClick={() => loadProfiles(undefined, false, true)}
            disabled={refreshing}
            className="flex items-center gap-3 px-6 py-3 border border-white/10 text-bfl-muted font-bold text-[10px] uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
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
              className="w-full pl-16 pr-6 py-6 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all"
            />
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

      {/* Profile List */}
      {profiles.length === 0 ? (
        <div className="text-center py-32 px-12 bg-white/[0.02] border border-white/5 rounded-sm w-full max-w-2xl mx-auto">
          <div className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.6em] mb-8">No Results</div>
          <h3 className="text-5xl font-extrabold text-white mb-6 italic tracking-tighter">NOTHING HERE YET</h3>
          <p className="text-bfl-muted mb-12 font-medium max-w-md mx-auto leading-relaxed">
            {searchQuery ? "Try adjusting your search query" : "Be the first to join this session!"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {profiles.map((profile) => {
            const discordDmUrl = profile.discordId 
              ? `https://discord.com/users/${profile.discordId}`
              : null;

            return (
              <div 
                key={profile.id} 
                className="group relative bg-white/[0.02] border border-white/5 rounded-none p-0 hover:bg-white/[0.04] hover:border-white/10 transition-all flex flex-col md:flex-row overflow-hidden shadow-2xl"
              >
                {/* Square Image */}
                <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0">
                  {profile.images && profile.images.length > 0 ? (
                    <img
                      src={profile.images[0]}
                      alt={profile.displayName}
                      className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-bfl-dark flex items-center justify-center">
                      <User className="text-white/20" size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-bfl-black/60 to-transparent md:hidden" />
                  <div className="absolute bottom-4 left-4 md:hidden">
                    <span className="font-mono text-[9px] text-bfl-green uppercase tracking-widest font-bold">Verified Node</span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 flex flex-col">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-[9px] text-bfl-muted uppercase tracking-[0.3em]">{profile.id}</span>
                        {profile.similarity !== undefined && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-bfl-green" />
                            <span className="font-mono text-[9px] text-bfl-muted uppercase tracking-[0.3em]">Match: {Math.round(profile.similarity * 100)}%</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-3xl font-bold text-white uppercase tracking-tighter italic group-hover:text-glow transition-all">
                        {profile.displayName}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <h4 className="font-mono text-[9px] font-bold text-bfl-muted uppercase tracking-[0.3em]">Value Offering</h4>
                      <p className="text-sm text-white/80 leading-relaxed font-medium line-clamp-3">{profile.whatIOffer}</p>
                    </div>
                    <div className="space-y-2 border-l border-white/5 pl-4">
                      <h4 className="font-mono text-[9px] font-bold text-bfl-muted uppercase tracking-[0.3em]">Strategic Need</h4>
                      <p className="text-sm text-white/80 leading-relaxed font-medium line-clamp-3">{profile.whatImLookingFor}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/5 flex flex-wrap gap-4 items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/sessions/${sessionId}/matches/profile/${profile.id}`);
                      }}
                      className="flex items-center gap-3 px-6 py-3 bg-white text-bfl-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all rounded-none"
                    >
                      <User size={14} />
                      Profile Data
                    </button>
                    {discordDmUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(discordDmUrl, "_blank", "noopener,noreferrer");
                        }}
                        className="flex items-center gap-3 px-6 py-3 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all rounded-none"
                      >
                        <ExternalLink size={14} />
                        Open Discord
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
            <p className="font-mono text-xs font-bold text-white uppercase tracking-[0.5em]">
              {searching ? "Computing Embeddings" : "Refreshing Registry"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}



