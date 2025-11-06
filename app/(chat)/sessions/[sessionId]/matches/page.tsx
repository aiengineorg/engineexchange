"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "@/components/toast";
import { Loader2, MessageCircle, Copy, Check } from "lucide-react";

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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  useEffect(() => {
    if (!sessionId) return;
    
    const checkProfileAndLoadMatches = async () => {
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
        setLoading(false);
      }
    };

    checkProfileAndLoadMatches();
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
      
      <h1 className="mb-6 text-3xl font-bold">Your Matches</h1>

      <div className="space-y-3">
        {sessionId && matches.map((m) => {
          const discordDmUrl = m.otherUserDiscordId 
            ? `https://discord.com/users/${m.otherUserDiscordId}`
            : null;
          
          const discordDmProtocol = m.otherUserDiscordId
            ? `discord://-/channels/@me/${m.otherUserDiscordId}`
            : null;
          
          const handleCopyDiscordId = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (m.otherUserDiscordId) {
              try {
                await navigator.clipboard.writeText(m.otherUserDiscordId);
                setCopiedId(m.otherUserDiscordId);
                toast({
                  type: "success",
                  description: "Discord User ID copied to clipboard!",
                });
                // Reset copied state after 2 seconds
                setTimeout(() => {
                  setCopiedId(null);
                }, 2000);
              } catch (error) {
                console.error("Failed to copy:", error);
                toast({
                  type: "error",
                  description: "Failed to copy Discord ID",
                });
              }
            }
          };

          return (
            <Card key={m.match.id} className="hover:bg-accent">
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
                {discordDmUrl ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {m.lastMessage
                        ? m.lastMessage.content.slice(0, 50) + "..."
                        : "Start chatting on Discord!"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopyDiscordId}
                        className="flex-1"
                        variant="outline"
                      >
                        {copiedId === m.otherUserDiscordId ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Discord ID
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (discordDmUrl) {
                            window.open(discordDmUrl, "_blank", "noopener,noreferrer");
                          }
                        }}
                        className="flex-1"
                        variant="default"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Open Profile
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Copy the Discord ID to find them in Discord, or open their profile
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {m.lastMessage
                      ? m.lastMessage.content.slice(0, 50) + "..."
                      : "Start chatting!"}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
