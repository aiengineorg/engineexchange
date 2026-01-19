"use client";

import { useState } from "react";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/toast";
import { ShieldCheck } from "lucide-react";

export default function Page() {
  const [consentAccepted, setConsentAccepted] = useState(false);

  const handleDiscordSignIn = async () => {
    if (!consentAccepted) {
      toast({
        type: "error",
        description: "Please accept the data consent agreement to continue",
      });
      return;
    }

    try {
      await nextAuthSignIn("discord", {
        callbackUrl: "/",
      });
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to sign in with Discord",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-20 md:px-12">
      <div className="w-full max-w-4xl">
        {/* Hero Section */}
        <section className="mb-16 relative">
          <div className="max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 bg-white/5 mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-bfl-green animate-pulse" />
              <span className="font-mono text-[10px] font-bold text-bfl-muted uppercase tracking-[0.4em]">Exchange Intelligence Platform 2.5</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-normal text-white tracking-tighter mb-8 leading-[0.9] text-glow">
              WELCOME TO <br />
              <span className="text-bfl-green not-italic">AI ENGINE EXCHANGE.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-bfl-muted mb-12 leading-relaxed max-w-2xl font-light">
              Engineered for high-impact professional matching. Utilizing neural embeddings to bridge the gap between human ambition and technical capability.
            </p>
          </div>
        </section>

        {/* Sign In Card */}
        <div className="bg-white/[0.02] subtle-border p-10 space-y-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 blueprint-line" />
            <h2 className="font-mono text-xs font-bold text-bfl-green uppercase tracking-[0.5em]">Authentication Protocol</h2>
            <div className="h-px flex-1 blueprint-line" />
          </div>

          <div className="space-y-6">
            <button
              type="button"
              onClick={handleDiscordSignIn}
              disabled={!consentAccepted}
              className="w-full px-10 py-5 bg-white text-bfl-black rounded-sm font-medium text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-bfl-offwhite transition-all transform hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Continue with Discord
            </button>

            <div className="bg-white/5 p-6 rounded-sm border border-white/5">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  id="consent-signin"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-white/20 bg-white/5 text-bfl-green focus:ring-bfl-green focus:ring-2"
                  required
                />
                <div className="flex-1">
                  <Label
                    htmlFor="consent-signin"
                    className="text-sm text-white/80 leading-relaxed cursor-pointer font-medium"
                  >
                    I consent to my data being stored and processed for matching purposes. 
                    This includes my profile information, preferences, and interaction data 
                    used to facilitate connections with other users.
                  </Label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center gap-3">
              <ShieldCheck size={16} className="text-bfl-green" />
              <span className="font-mono text-[9px] text-bfl-muted uppercase tracking-[0.3em]">
                Secure authentication via Discord OAuth 2.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
