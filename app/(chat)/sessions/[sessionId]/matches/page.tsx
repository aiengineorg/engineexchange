"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

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
        {sessionId && matches.map((m) => (
          <Link
            key={m.match.id}
            href={`/sessions/${sessionId}/matches/${m.match.id}`}
          >
            <Card className="hover:bg-accent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{m.otherProfile.displayName}</h3>
                </div>
                {m.otherProfile.matchReason && (
                  <div className="mb-2 rounded-lg bg-muted/30 border border-border p-2">
                    <p className="text-xs font-medium text-foreground mb-1">Why you matched:</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.otherProfile.matchReason}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {m.lastMessage
                    ? m.lastMessage.content.slice(0, 50) + "..."
                    : "Start chatting!"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
