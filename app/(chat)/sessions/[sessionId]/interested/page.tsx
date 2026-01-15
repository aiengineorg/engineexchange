"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardStack } from "@/components/matching/card-stack";
import { RefreshCw, Heart } from "lucide-react";

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
        <div className="text-center">
          <div className="relative w-16 h-16 mb-6 mx-auto">
            <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="text-bfl-green" size={24} />
            </div>
          </div>
          <p className="font-mono text-xs font-bold text-white uppercase tracking-[0.5em]">Loading</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
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
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-5xl mx-auto flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-bfl-green" />
            <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">People Who Like You</span>
          </div>
          <h2 className="text-6xl font-extrabold text-white tracking-tighter italic uppercase">Interested In You</h2>
        </div>
        <button
          onClick={() => loadProfiles(true)}
          disabled={refreshing}
          className="flex items-center gap-3 px-6 py-3 border border-white/10 text-bfl-muted font-bold text-[10px] uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start relative">
        {profiles.length === 0 ? (
          <div className="text-center py-32 px-12 bg-white/[0.02] border border-white/5 rounded-sm w-full max-w-2xl">
            <div className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.6em] mb-8">No One Yet</div>
            <h3 className="text-5xl font-extrabold text-white mb-6 italic tracking-tighter">KEEP SWIPING!</h3>
            <p className="text-bfl-muted mb-12 font-medium max-w-md mx-auto leading-relaxed">
              No one has shown interest yet. Keep discovering and connecting with people!
            </p>
            <button
              onClick={() => router.push(`/sessions/${sessionId}/discover`)}
              className="px-12 py-5 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.3em] hover:bg-bfl-offwhite transition-all"
            >
              Go to Discover
            </button>
          </div>
        ) : (
          <div className="relative w-full flex justify-center h-[700px]">
            {sessionId && (
              <CardStack
                profiles={profiles}
                sessionId={sessionId}
                onSwipe={handleSwipe}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
