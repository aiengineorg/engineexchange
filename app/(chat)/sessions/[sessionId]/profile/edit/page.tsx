"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Loader2 } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mb-6 mx-auto">
            <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="text-bfl-green" size={24} />
            </div>
          </div>
          <p className="font-mono text-xs font-bold text-white uppercase tracking-[0.5em]">Loading Profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto">
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Update Info</span>
        </div>
        <h2 className="text-6xl font-extrabold text-white tracking-tighter italic uppercase">Edit Profile</h2>
        <p className="text-bfl-muted mt-4 font-medium">Update your profile. AI matching will be recalculated.</p>
      </div>

      <div className="bg-white/[0.02] subtle-border p-10">
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">01 / Name</span>
            <label htmlFor="displayName" className="text-2xl font-bold text-white italic mb-6 block">Display Name *</label>
            <input
              id="displayName"
              type="text"
              placeholder="How should others see you?"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
              maxLength={50}
              disabled={loading}
              className="w-full px-6 py-5 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">02 / What I Offer</span>
            <label htmlFor="whatIOffer" className="text-2xl font-bold text-white italic mb-6 block">"I am currently offering..." *</label>
            <textarea
              id="whatIOffer"
              placeholder="Describe your skills, expertise, and what value you bring..."
              value={formData.whatIOffer}
              onChange={(e) => setFormData({ ...formData, whatIOffer: e.target.value })}
              required
              minLength={10}
              maxLength={1000}
              disabled={loading}
              rows={5}
              className="w-full px-6 py-5 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none disabled:opacity-50"
            />
            <p className="font-mono text-[10px] text-bfl-muted mt-2 tracking-widest">
              {formData.whatIOffer.length}/1000 characters (min 10)
            </p>
          </div>

          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">03 / Search Parameters</span>
            <label htmlFor="whatImLookingFor" className="text-2xl font-bold text-white italic mb-6 block">"I'm looking for..." *</label>
            <textarea
              id="whatImLookingFor"
              placeholder="Describe the skills and expertise you're looking for in collaborators..."
              value={formData.whatImLookingFor}
              onChange={(e) => setFormData({ ...formData, whatImLookingFor: e.target.value })}
              required
              minLength={10}
              maxLength={1000}
              disabled={loading}
              rows={5}
              className="w-full px-6 py-5 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none disabled:opacity-50"
            />
            <p className="font-mono text-[10px] text-bfl-muted mt-2 tracking-widest">
              {formData.whatImLookingFor.length}/1000 characters (min 10)
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm">
              <p className="font-mono text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.push(`/sessions/${sessionId}/profile`)}
              disabled={loading}
              className="flex-1 px-6 py-4 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all rounded-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.displayName ||
                formData.whatIOffer.length < 10 ||
                formData.whatImLookingFor.length < 10
              }
              className="flex-1 px-12 py-4 bg-white text-bfl-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all rounded-none disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>

          {loading && (
            <p className="text-center font-mono text-[10px] text-bfl-muted uppercase tracking-[0.3em]">
              Regenerating AI embeddings... This may take a moment.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

