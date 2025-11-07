"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, Loader2, RefreshCw, ExternalLink, User } from "lucide-react";

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
        <div className="mb-4">
          <SidebarTrigger />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Loading directory...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col p-4">
        <div className="mb-4">
          <SidebarTrigger />
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="max-w-md text-center">
            <p className="text-destructive mb-2">{error}</p>
            <Button onClick={() => loadProfiles()} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <SidebarTrigger />
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Directory</h1>
          <p className="text-muted-foreground">Browse all profiles in this session</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => loadProfiles(undefined, false, true)}
          disabled={refreshing}
          title="Refresh directory"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="border-2 rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 flex-wrap">
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
            <Button onClick={handleSearch} disabled={!searchQuery.trim() || searching}>
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

      {/* Profile List */}
      {profiles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-2">No profiles found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search query" : "Be the first to join this session!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => {
            const discordDmUrl = profile.discordId 
              ? `https://discord.com/users/${profile.discordId}`
              : null;

            return (
              <Card 
                key={profile.id} 
                className="transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-200 dark:hover:border-purple-800 cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{profile.displayName}</h3>
                      {profile.similarity !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {Math.round(profile.similarity * 100)}% match
                        </p>
                      )}
                    </div>
                    {profile.images && profile.images.length > 0 && (
                      <img
                        src={profile.images[0]}
                        alt={profile.displayName}
                        className="w-16 h-16 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">What I Offer:</p>
                      <p className="text-sm text-foreground line-clamp-2">{profile.whatIOffer}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">What I'm Looking For:</p>
                      <p className="text-sm text-foreground line-clamp-2">{profile.whatImLookingFor}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/sessions/${sessionId}/matches/profile/${profile.id}`);
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(searching || refreshing) && profiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium text-foreground">
              {searching ? "Searching profiles..." : "Refreshing directory..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

