"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardStack } from "@/components/matching/card-stack";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2, RefreshCw } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
}

export default function InterestedPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  const loadProfiles = async (isRefresh = false) => {
    if (!sessionId) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    
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

      // Profile exists, load interested profiles
      const url = new URL("/api/feed/interested", window.location.origin);
      url.searchParams.set("sessionId", sessionId);

      const response = await fetch(url.toString());

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load profiles");
      }

      const data = await response.json();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [sessionId, router]);

  const handleSwipe = async (profileId: string, decision: "yes" | "no") => {
    if (!sessionId) return;
    
    try {
      const response = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: profileId,
          sessionId: sessionId,
          decision,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to swipe");
      }

      const result = await response.json();

      if (result.matched) {
        alert(`It's a Match! 🎉`);
        router.push(`/sessions/${sessionId}/matches`);
      }
    } catch (err) {
      console.error("Swipe error:", err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">{error}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mb-4">
        <SidebarTrigger />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold">Interested in You</h1>
              <p className="text-muted-foreground">People who swiped YES on you</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadProfiles(true)}
              disabled={refreshing}
              title="Refresh profiles"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {sessionId && (
            <CardStack
              profiles={profiles}
              sessionId={sessionId}
              onSwipe={handleSwipe}
            />
          )}
        </div>
      </div>
    </div>
  );
}
