"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Match {
  match: {
    id: string;
    createdAt: string;
  };
  otherProfile: {
    id: string;
    displayName: string;
    age: number;
    bio: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
}

export default function MatchesPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileAndLoadMatches = async () => {
      try {
        // Check if profile exists first
        const profileCheck = await fetch(`/api/profiles/me?sessionId=${params.sessionId}`);
        
        if (profileCheck.status === 404) {
          // Profile doesn't exist, redirect to profile creation
          router.push(`/sessions/${params.sessionId}/profile/new`);
          return;
        }
        
        if (!profileCheck.ok) {
          throw new Error("Failed to check profile");
        }

        // Profile exists, load matches
        const url = new URL("/api/matches", window.location.origin);
        url.searchParams.set("sessionId", params.sessionId);

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
  }, [params.sessionId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No matches yet!</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep swiping to find your matches
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-3xl font-bold">Your Matches</h1>

      <div className="space-y-3">
        {matches.map((m) => (
          <Link
            key={m.match.id}
            href={`/sessions/${params.sessionId}/matches/${m.match.id}`}
          >
            <Card className="hover:bg-accent">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold">{m.otherProfile.displayName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {m.lastMessage
                      ? m.lastMessage.content.slice(0, 50) + "..."
                      : "Start chatting!"}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {m.otherProfile.age}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
