"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

export default function CreateSessionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create session");
      }

      const session = await response.json();

      // Redirect to profile creation for this session
      router.push(`/sessions/${session.id}/profile/new`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-12 md:px-12 max-w-xl mx-auto min-h-screen flex flex-col justify-center">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">New Event</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-normal text-white tracking-tighter uppercase mb-4">
          Create Event
        </h1>
        <p className="text-bfl-muted font-medium">
          Give your event a name. You'll get a unique code to share with others.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white/[0.02] subtle-border p-8">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              01 / Event Details
            </span>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-bfl-green" size={20} />
              <h2 className="text-xl font-normal text-white">Event Name</h2>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Friday Night Speed Dating"
              required
              maxLength={100}
              disabled={loading}
              className="w-full px-6 py-5 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-sm">
            <p className="text-red-400 text-sm font-mono">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1 px-8 py-5 border border-white/10 text-bfl-muted font-bold text-xs uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all rounded-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex-[2] px-12 py-5 bg-white text-bfl-black font-medium text-xs uppercase tracking-[0.3em] hover:bg-bfl-offwhite transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-sm flex items-center justify-center gap-3"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
