"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Sparkles, Search } from "lucide-react";

export default function NewProfilePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    displayName: "",
    whatIOffer: "",
    whatImLookingFor: "",
  });

  // Pre-fill display name with Discord username if available
  useEffect(() => {
    if (session?.user?.discordUsername && !formData.displayName) {
      setFormData((prev) => ({
        ...prev,
        displayName: session.user.discordUsername || "",
      }));
    }
  }, [session?.user?.discordUsername, formData.displayName]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mb-6 mx-auto">
            <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-bfl-green" size={24} />
            </div>
          </div>
          <p className="font-mono text-xs font-bold text-white uppercase tracking-[0.5em] mb-2">Creating Profile</p>
          <p className="text-sm text-bfl-muted">Generating AI embeddings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Get Started</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter italic uppercase mb-4">
          Create Profile
        </h1>
        <p className="text-bfl-muted font-medium max-w-lg">
          Tell us about yourself. Our AI will analyze your profile to find the best matches for you.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Display Name Section */}
        <div className="bg-white/[0.02] subtle-border p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              01 / Identity
            </span>
            <div className="flex items-center gap-3 mb-6">
              <User className="text-bfl-green" size={20} />
              <h2 className="text-xl font-bold text-white italic">Display Name</h2>
            </div>
            <input
              type="text"
              id="displayName"
              placeholder="How should others see you?"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              required
              maxLength={50}
              className="w-full px-6 py-4 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all"
            />
            {session?.user?.discordUsername && (
              <p className="mt-3 text-xs text-bfl-muted font-mono">
                Pre-filled from Discord: {session.user.discordUsername}
              </p>
            )}
          </div>
        </div>

        {/* What I Offer Section */}
        <div className="bg-white/[0.02] subtle-border p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              02 / What I Offer
            </span>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-bfl-green" size={20} />
              <h2 className="text-xl font-bold text-white italic">What I Offer</h2>
            </div>
            <p className="text-sm text-bfl-muted mb-6">
              Describe yourself, your interests, values, and what you bring to a connection.
            </p>
            <textarea
              id="whatIOffer"
              placeholder="I'm passionate about..."
              value={formData.whatIOffer}
              onChange={(e) =>
                setFormData({ ...formData, whatIOffer: e.target.value })
              }
              required
              minLength={10}
              maxLength={1000}
              rows={5}
              className="w-full px-6 py-4 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
            />
            <div className="flex justify-between mt-3">
              <p className="text-xs text-bfl-muted font-mono">Min 10 characters</p>
              <p className="text-xs text-bfl-muted font-mono">
                {formData.whatIOffer.length}/1000
              </p>
            </div>
          </div>
        </div>

        {/* What I'm Looking For Section */}
        <div className="bg-white/[0.02] subtle-border p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              03 / Search Parameters
            </span>
            <div className="flex items-center gap-3 mb-4">
              <Search className="text-bfl-green" size={20} />
              <h2 className="text-xl font-bold text-white italic">What I'm Looking For</h2>
            </div>
            <p className="text-sm text-bfl-muted mb-6">
              Describe the qualities, interests, and values you're looking for in a match.
            </p>
            <textarea
              id="whatImLookingFor"
              placeholder="I'm looking for someone who..."
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
              rows={5}
              className="w-full px-6 py-4 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
            />
            <div className="flex justify-between mt-3">
              <p className="text-xs text-bfl-muted font-mono">Min 10 characters</p>
              <p className="text-xs text-bfl-muted font-mono">
                {formData.whatImLookingFor.length}/1000
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-sm">
            <p className="text-red-400 text-sm font-mono">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex-1 px-8 py-5 border border-white/10 text-bfl-muted font-bold text-xs uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all rounded-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              !formData.displayName ||
              formData.whatIOffer.length < 10 ||
              formData.whatImLookingFor.length < 10
            }
            className="flex-[2] px-12 py-5 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.3em] hover:bg-bfl-offwhite transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-sm"
          >
            Create Profile
          </button>
        </div>
      </form>
    </div>
  );
}
