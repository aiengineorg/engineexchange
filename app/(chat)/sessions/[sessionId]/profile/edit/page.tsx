"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Profile {
  id: string;
  displayName: string;
  images: string[];
  whatIOffer: string;
  whatImLookingFor: string;
  linkedinUrl?: string | null;
}

export default function EditProfilePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    displayName: "",
    whatIOffer: "",
    whatImLookingFor: "",
  });

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/profiles/me?sessionId=${sessionId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const profile: Profile = await response.json();
        setFormData({
          displayName: profile.displayName,
          whatIOffer: profile.whatIOffer,
          whatImLookingFor: profile.whatImLookingFor,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First get the profile ID
      const profileResponse = await fetch(`/api/profiles/me?sessionId=${sessionId}`);
      if (!profileResponse.ok) {
        throw new Error("Failed to get profile");
      }
      const profile: Profile = await profileResponse.json();

      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.displayName,
          images: profile.images || [],
          whatIOffer: formData.whatIOffer,
          whatImLookingFor: formData.whatImLookingFor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Redirect back to profile view
      router.push(`/sessions/${sessionId}/profile`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Your Profile</CardTitle>
          <CardDescription>
            Update your profile information. We'll use AI to find your best matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="How should others see you?"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                required
                maxLength={50}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatIOffer">What I Offer *</Label>
              <Textarea
                id="whatIOffer"
                placeholder="Describe yourself, your interests, values, and what you bring to a relationship..."
                value={formData.whatIOffer}
                onChange={(e) =>
                  setFormData({ ...formData, whatIOffer: e.target.value })
                }
                required
                minLength={10}
                maxLength={1000}
                disabled={loading}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {formData.whatIOffer.length}/1000 characters (min 10)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatImLookingFor">What I'm Looking For *</Label>
              <Textarea
                id="whatImLookingFor"
                placeholder="Describe the qualities, interests, and values you're looking for in a match..."
                value={formData.whatImLookingFor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatImLookingFor: e.target.value,
                  })
                }
                required
                minLength={10}
                maxLength={1000}
                disabled={loading}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {formData.whatImLookingFor.length}/1000 characters (min 10)
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/sessions/${sessionId}/profile`)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !formData.displayName ||
                  formData.whatIOffer.length < 10 ||
                  formData.whatImLookingFor.length < 10
                }
                className="flex-1"
              >
                {loading ? "Updating Profile..." : "Update Profile"}
              </Button>
            </div>

            {loading && (
              <p className="text-center text-sm text-muted-foreground">
                Regenerating AI embeddings... This may take a moment.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

