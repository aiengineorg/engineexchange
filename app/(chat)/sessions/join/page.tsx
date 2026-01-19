"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Loader2, Users, MessageCircle, Check, Lock } from "lucide-react";

export default function JoinSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromQuery = searchParams.get("code") || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showDiscordStep, setShowDiscordStep] = useState(false);
  const [discordJoined, setDiscordJoined] = useState(false);

  // Pre-fill code from query parameter
  useEffect(() => {
    if (codeFromQuery) {
      setCode(codeFromQuery.toUpperCase().slice(0, 6));
    }
  }, [codeFromQuery]);

  const handleCodeChange = (value: string) => {
    // Auto-uppercase and limit to 6 characters
    setCode(value.toUpperCase().slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join session");
      }

      const session = await response.json();
      setSessionId(session.id);
      setShowDiscordStep(true);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const handleContinueToProfile = () => {
    if (sessionId) {
      router.push(`/sessions/${sessionId}/profile/new`);
    }
  };

  const handleDiscordClick = () => {
    setDiscordJoined(true);
  };

  if (showDiscordStep) {
    return (
      <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto min-h-screen">
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-bfl-green" />
            <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Almost There</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-normal text-white tracking-tighter uppercase mb-4">
            Complete Setup
          </h1>
          <p className="text-bfl-muted font-medium max-w-lg">
            Just two quick steps to start matching with others.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discord Join Card */}
          <div className={`bg-white/[0.02] subtle-border p-8 ${discordJoined ? "opacity-60" : ""}`}>
            <div className="relative pt-8 border-t border-white/10">
              <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
                01 / Required
              </span>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="text-bfl-green" size={20} />
                  <h2 className="text-xl font-normal text-white">Join Discord</h2>
                </div>
                {discordJoined && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-mono uppercase tracking-widest">
                    <Check size={12} /> Done
                  </span>
                )}
              </div>
              <p className="text-sm text-bfl-muted mb-6">
                Join our Discord server to chat with your matches. This is required before creating your profile.
              </p>
              <a
                href="https://discord.gg/9bxYTCef"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDiscordClick}
              >
                <button
                  disabled={discordJoined}
                  className="w-full px-8 py-4 bg-white text-bfl-black font-medium text-xs uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {discordJoined ? "Joined Discord" : "Join Discord Server"}
                </button>
              </a>
            </div>
          </div>

          {/* Create Profile Card */}
          <div className={`bg-white/[0.02] subtle-border p-8 ${!discordJoined ? "opacity-40" : ""}`}>
            <div className="relative pt-8 border-t border-white/10">
              <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
                02 / Profile
              </span>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users className="text-bfl-green" size={20} />
                  <h2 className="text-xl font-normal text-white">Create Profile</h2>
                </div>
                {!discordJoined && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 text-bfl-muted text-[10px] font-mono uppercase tracking-widest">
                    <Lock size={12} /> Locked
                  </span>
                )}
              </div>
              <p className="text-sm text-bfl-muted mb-6">
                {discordJoined
                  ? "You're ready! Create your profile to start matching with others."
                  : "Complete the Discord step first to unlock profile creation."
                }
              </p>
              <button
                onClick={handleContinueToProfile}
                disabled={!discordJoined}
                className="w-full px-8 py-4 bg-white text-bfl-black font-medium text-xs uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {discordJoined ? "Create Profile" : "Join Discord First"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-xl mx-auto min-h-screen flex flex-col justify-center">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Access Code</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-normal text-white tracking-tighter uppercase mb-4">
          Join Event
        </h1>
        <p className="text-bfl-muted font-medium">
          Enter the 6-character code you received to join a matching event.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white/[0.02] subtle-border p-8">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              01 / Event Code
            </span>
            <div className="flex items-center gap-3 mb-6">
              <KeyRound className="text-bfl-green" size={20} />
              <h2 className="text-xl font-normal text-white">Enter Code</h2>
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="ABC123"
              required
              maxLength={6}
              disabled={loading}
              className="w-full px-6 py-5 bg-white/[0.02] border border-white/10 rounded-sm text-white text-center text-2xl font-mono tracking-[0.5em] uppercase focus:ring-1 focus:ring-bfl-green outline-none transition-all"
            />
            <p className="mt-3 text-xs text-bfl-muted font-mono text-center">
              6 characters (letters and numbers)
            </p>
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
            disabled={loading || code.length !== 6}
            className="flex-[2] px-12 py-5 bg-white text-bfl-black font-medium text-xs uppercase tracking-[0.3em] hover:bg-bfl-offwhite transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-sm flex items-center justify-center gap-3"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Joining..." : "Join Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
