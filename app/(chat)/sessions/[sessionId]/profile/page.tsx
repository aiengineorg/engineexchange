"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  images: string[];
  whatIOffer: string;
  whatImLookingFor: string;
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/profiles/me?sessionId=${sessionId}`);
        
        if (response.status === 404) {
          // No profile, redirect to create
          router.push(`/sessions/${sessionId}/profile/new`);
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
  }, [sessionId, router]);

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
        <div className="text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto">
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Your Info</span>
        </div>
        <h2 className="text-6xl font-extrabold text-white tracking-tighter italic uppercase">My Profile</h2>
      </div>

      <div className="bg-white/[0.02] subtle-border p-10 space-y-12">
        <div className="relative pt-8 border-t border-white/10">
          <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">01 / Name</span>
          <h4 className="text-2xl font-bold text-white italic mb-6">Display Name</h4>
          <p className="text-xl text-bfl-muted leading-relaxed font-light italic">
            {profile.displayName}
          </p>
        </div>

        <div className="relative pt-8 border-t border-white/10">
          <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">02 / Strategic Value</span>
          <h4 className="text-2xl font-bold text-white italic mb-6">"I am currently offering..."</h4>
          <p className="text-xl text-bfl-muted leading-relaxed font-light italic whitespace-pre-wrap">
            {profile.whatIOffer}
          </p>
        </div>

        <div className="relative pt-8 border-t border-white/10">
          <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">03 / Search Parameters</span>
          <h4 className="text-2xl font-bold text-white italic mb-6">"I'm searching for nodes with..."</h4>
          <p className="text-xl text-bfl-muted leading-relaxed font-light italic whitespace-pre-wrap">
            {profile.whatImLookingFor}
          </p>
        </div>

        <div className="pt-8 border-t border-white/5 flex gap-4">
          <button
            onClick={() => router.push(`/sessions/${sessionId}/discover`)}
            className="flex-1 px-6 py-3 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all rounded-none"
          >
            Back to Discover
          </button>
          <button
            onClick={() => {
              router.push(`/sessions/${sessionId}/profile/edit`);
            }}
            className="flex-2 px-12 py-3 bg-white text-bfl-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all rounded-none"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}

