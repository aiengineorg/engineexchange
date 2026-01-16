"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, User, ArrowRight } from "lucide-react";

interface Match {
  match: {
    id: string;
    createdAt: string;
  };
  otherProfile: {
    id: string;
    displayName: string;
    matchReason?: string;
    searchedField?: "what_i_offer" | "what_im_looking_for";
  };
  otherUserDiscordId: string | null;
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
}

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

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  const loadMatches = async (isRefresh = false) => {
    if (!sessionId) return;
    
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
    loadMatches();
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col p-4">
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex min-h-screen flex-col p-4">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No matches yet!</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep swiping to find your matches
            </p>
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
          <h2 className="text-6xl font-extrabold text-white tracking-tighter italic uppercase">Matches</h2>
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

      <div className="space-y-6">
        {sessionId && matches.length > 0 && matches.map((m) => {
          const discordDmUrl = m.otherUserDiscordId 
            ? `https://discord.com/users/${m.otherUserDiscordId}`
            : null;

          return (
            <div 
              key={m.match.id}
              className="group relative bg-white/[0.02] border border-white/5 rounded-none p-0 hover:bg-white/[0.04] hover:border-white/10 transition-all flex flex-col md:flex-row overflow-hidden shadow-2xl"
            >
              {/* Square Image - No Rounding */}
              <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0">
                <div className="w-full h-full bg-bfl-dark flex items-center justify-center">
                  <User className="text-white/20" size={48} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-bfl-black/60 to-transparent md:hidden" />
                <div className="absolute bottom-4 left-4 md:hidden">
                  <span className="font-mono text-[9px] text-bfl-green uppercase tracking-widest font-bold">Verified Profile</span>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-8 flex flex-col">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[9px] text-bfl-muted uppercase tracking-[0.3em]">{m.otherProfile.id}</span>
                      <div className="w-1 h-1 rounded-full bg-bfl-green" />
                      <span className="font-mono text-[9px] text-bfl-muted uppercase tracking-[0.3em]">{m.lastMessage?.createdAt ? new Date(m.lastMessage.createdAt).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                    <h3 className="text-3xl font-bold text-white uppercase tracking-tighter italic group-hover:text-glow transition-all">
                      {m.otherProfile.displayName}
                    </h3>
                  </div>
                </div>
                
                {m.otherProfile.matchReason && (
                  <div className="relative mb-8">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-bfl-green/30" />
                    <div className="pl-6">
                      <p className="font-mono text-[9px] font-bold text-bfl-muted uppercase tracking-[0.3em] mb-2">Match Analysis</p>
                      <p className="text-bfl-muted text-sm leading-relaxed italic font-light">
                        "{m.otherProfile.matchReason}"
                      </p>
                    </div>
                  </div>
                )}
                
                {m.lastMessage && (
                  <div className="relative mb-8">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-bfl-green/30" />
                    <p className="text-bfl-muted text-sm pl-6 leading-relaxed italic font-light">
                      "{m.lastMessage.content}"
                    </p>
                  </div>
                )}

                <div className="mt-auto pt-6 border-t border-white/5 flex flex-wrap gap-4 items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/sessions/${sessionId}/matches/profile/${m.otherProfile.id}`);
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
                  <div className="ml-auto hidden lg:flex items-center gap-2">
                    <span className="font-mono text-[8px] text-white/20 uppercase tracking-[0.4em]">Connection Status: Optimal</span>
                    <ArrowRight size={14} className="text-white/20" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {matches.length === 0 && (
          <div className="text-center py-32 bg-white/[0.01] border border-dashed border-white/10 rounded-none">
            <div className="font-mono text-[10px] text-white/20 uppercase tracking-[0.6em] mb-4">No Matches Yet</div>
            <p className="text-bfl-muted font-medium text-sm">Go to Discover to find people and make connections.</p>
          </div>
        )}
      </div>
    </div>
  );
}
