"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2, ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  images: string[];
  whatIOffer: string;
  whatImLookingFor: string;
  linkedinUrl?: string | null;
  linkedinEnrichmentSummary?: string | null;
}

export default function ProfileDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string; profileId: string }>;
}) {
  const { sessionId, profileId } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/profiles/${profileId}`);
        
        if (response.status === 404) {
          setError("Profile not found");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => router.push(`/sessions/${sessionId}/matches`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Matches
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="mb-4">
        <SidebarTrigger />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{profile.displayName}</CardTitle>
          <CardDescription>
            Profile Details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.images && profile.images.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Images
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {profile.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${profile.displayName} image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              What I Offer
            </h3>
            <p className="text-base whitespace-pre-wrap">{profile.whatIOffer}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              What I'm Looking For
            </h3>
            <p className="text-base whitespace-pre-wrap">
              {profile.whatImLookingFor}
            </p>
          </div>

          {profile.linkedinEnrichmentSummary && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                LinkedIn Summary
              </h3>
              <p className="text-base whitespace-pre-wrap text-muted-foreground">
                {profile.linkedinEnrichmentSummary}
              </p>
            </div>
          )}

          {profile.linkedinUrl && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                LinkedIn
              </h3>
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {profile.linkedinUrl}
              </a>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/sessions/${sessionId}/matches`)}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Matches
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


