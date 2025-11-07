"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardStack } from "@/components/matching/card-stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, Loader2, RefreshCw } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
  similarity?: number;
  matchReason?: string;
  searchedField?: "what_i_offer" | "what_im_looking_for";
}

export default function DiscoverPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
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
      const url = new URL("/api/feed/discover", window.location.origin);
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

  const handleSwipe = async (profileId: string, decision: "yes" | "no") => {
    try {
      const response = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: profileId,
          sessionId,
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
        router.push(`/sessions/${sessionId}/matches`);
      }
    } catch (err) {
      console.error("Swipe error:", err);
      throw err;
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      loadProfiles(searchQuery, true);
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
        <div className="max-w-md text-center">
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            If you just created your profile, please wait a moment for embeddings to be generated.
          </p>
          <Button onClick={() => loadProfiles()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
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
              <h1 className="text-3xl font-bold">Discover</h1>
              <p className="text-muted-foreground">AI-powered semantic matching</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadProfiles(undefined, false, true)}
              disabled={refreshing}
              title="Refresh profiles"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

        {/* Custom Search */}
        <div className="flex justify-center">
          <div className="w-full max-w-3xl border-2 rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Select value={searchField} onValueChange={(value: "offers" | "looking_for") => setSearchField(value)}>
                <SelectTrigger className="w-auto min-w-[140px]">
                  <SelectValue placeholder="Search field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offers">I can offer</SelectItem>
                  <SelectItem value="looking_for">I am looking for</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">
                {searchField === "offers" ? "expertise in" : "someone who"}
              </span>
              <div className="flex-1 min-w-[200px] max-w-md">
                <Input
                  placeholder={searchField === "offers" 
                    ? "React, TypeScript, Node.js..." 
                    : "has React experience..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full"
                />
              </div>
              <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Search
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
          </div>
        </div>

        {/* Empty State or Card Stack */}
        {profiles.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-2">No profiles found</p>
            <p className="text-sm text-muted-foreground">
              Be the first to explore or wait for others to join this session!
            </p>
          </div>
        ) : (
          <div className="relative">
            <CardStack
              profiles={profiles}
              sessionId={sessionId}
              onSwipe={handleSwipe}
            />
            {(searching || refreshing) && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm font-medium text-foreground">
                  {searching ? "Generating new suggestions..." : "Refreshing profiles..."}
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
