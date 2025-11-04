"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewProfilePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    displayName: "",
    age: "",
    bio: "",
    whatIOffer: "",
    whatImLookingFor: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          displayName: formData.displayName,
          age: Number.parseInt(formData.age),
          bio: formData.bio || null,
          images: [],
          whatIOffer: formData.whatIOffer,
          whatImLookingFor: formData.whatImLookingFor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create profile");
      }

      // Redirect to discover feed
      router.push(`/sessions/${sessionId}/discover`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create Your Profile</CardTitle>
          <CardDescription>
            Tell us about yourself. We'll use AI to find your best matches.
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
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                min="18"
                max="120"
                placeholder="18"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell us a bit about yourself..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                maxLength={500}
                disabled={loading}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/500 characters
              </p>
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
                onClick={() => router.push("/")}
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
                  !formData.age ||
                  formData.whatIOffer.length < 10 ||
                  formData.whatImLookingFor.length < 10
                }
                className="flex-1"
              >
                {loading ? "Creating Profile..." : "Create Profile"}
              </Button>
            </div>

            {loading && (
              <p className="text-center text-sm text-muted-foreground">
                Generating AI embeddings... This may take a moment.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
