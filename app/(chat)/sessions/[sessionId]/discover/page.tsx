"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardStack } from "@/components/matching/card-stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  age: number;
  bio: string | null;
  whatIOffer: string;
  whatImLookingFor: string;
  similarity?: number;
}

export default function DiscoverPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadProfiles = async (customQuery?: string) => {
    setLoading(true);
    setError("");

    try {
      const url = new URL("/api/feed/discover", window.location.origin);
      url.searchParams.set("sessionId", params.sessionId);
      if (customQuery) {
        url.searchParams.set("query", customQuery);
      }

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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [params.sessionId]);

  const handleSwipe = async (profileId: string, decision: "yes" | "no") => {
    try {
      const response = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: profileId,
          sessionId: params.sessionId,
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
        router.push(`/sessions/${params.sessionId}/matches`);
      }
    } catch (err) {
      console.error("Swipe error:", err);
      throw err;
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      loadProfiles(searchQuery);
    }
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => loadProfiles()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Discover</h1>
          <p className="text-muted-foreground">AI-powered semantic matching</p>
        </div>

        {/* Custom Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search for specific traits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
            <Search className="h-4 w-4" />
          </Button>
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                loadProfiles();
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Card Stack */}
        <CardStack
          profiles={profiles}
          sessionId={params.sessionId}
          onSwipe={handleSwipe}
        />
      </div>
    </div>
  );
}
