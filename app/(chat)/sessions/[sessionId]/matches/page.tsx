"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2, RefreshCw, ExternalLink, User } from "lucide-react";

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
        <div className="mb-4">
          <SidebarTrigger />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex min-h-screen flex-col p-4">
        <div className="mb-4">
          <SidebarTrigger />
        </div>
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
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-4">
        <SidebarTrigger />
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Matches</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => loadMatches(true)}
          disabled={refreshing}
          title="Refresh matches"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="space-y-3">
        {sessionId && matches.map((m) => {
          const discordDmUrl = m.otherUserDiscordId 
            ? `https://discord.com/users/${m.otherUserDiscordId}`
            : null;

          return (
            <Card key={m.match.id} className="transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-200 dark:hover:border-purple-800 cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{m.otherProfile.displayName}</h3>
                </div>
                {m.otherProfile.matchReason && (
                  <div className="mb-3 rounded-lg bg-muted/30 border border-border p-2">
                    <p className="text-xs font-medium text-foreground mb-1">Why you matched:</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.otherProfile.matchReason}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {m.lastMessage && (
                    <p className="text-sm text-muted-foreground">
                      {m.lastMessage.content.slice(0, 50) + "..."}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/sessions/${sessionId}/matches/profile/${m.otherProfile.id}`);
                      }}
                      className="flex-1"
                      variant="outline"
                    >
                      <User className="mr-2 h-4 w-4" />
                      View Profile Details
                    </Button>
                    {discordDmUrl && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(discordDmUrl, "_blank", "noopener,noreferrer");
                        }}
                        className="flex-1"
                        variant="default"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Chat on Discord
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
