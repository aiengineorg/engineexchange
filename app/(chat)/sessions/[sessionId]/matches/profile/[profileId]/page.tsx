"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, User, ExternalLink, Search } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  images: string[];
  whatIOffer: string;
  whatImLookingFor: string;
  linkedinUrl?: string | null;
  linkedinEnrichmentSummary?: string | null;
  discordId?: string | null;
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center bg-white/[0.02] subtle-border p-8">
          <p className="text-red-400 mb-4 font-mono text-sm">{error}</p>
          <button
            onClick={() => router.push(`/sessions/${sessionId}/matches`)}
            className="px-8 py-3 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const discordDmUrl = profile.discordId
    ? `https://discord.com/users/${profile.discordId}`
    : null;

  return (
    <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto">
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Profile</span>
        </div>
        <h2 className="text-6xl font-extrabold text-white tracking-tighter italic uppercase">{profile.displayName}</h2>
      </div>

      {/* Profile Image */}
      {profile.images && profile.images.length > 0 && (
        <div className="mb-12">
          <div className="grid grid-cols-2 gap-4">
            {profile.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${profile.displayName} image ${index + 1}`}
                className="w-full h-64 object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500"
              />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white/[0.02] subtle-border p-10 space-y-12">
        <div className="relative pt-8 border-t border-white/10">
          <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">01 / Strategic Value</span>
          <h4 className="text-2xl font-bold text-white italic mb-6">"I am currently offering..."</h4>
          <p className="text-xl text-bfl-muted leading-relaxed font-light italic whitespace-pre-wrap">
            {profile.whatIOffer}
          </p>
        </div>

        <div className="relative pt-8 border-t border-white/10">
          <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">02 / Search Parameters</span>
          <h4 className="text-2xl font-bold text-white italic mb-6">"I'm searching for nodes with..."</h4>
          <p className="text-xl text-bfl-muted leading-relaxed font-light italic whitespace-pre-wrap">
            {profile.whatImLookingFor}
          </p>
        </div>

        {profile.linkedinEnrichmentSummary && (
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">03 / AI Summary</span>
            <h4 className="text-2xl font-bold text-white italic mb-6">LinkedIn Intelligence</h4>
            <p className="text-xl text-bfl-muted leading-relaxed font-light italic whitespace-pre-wrap">
              {profile.linkedinEnrichmentSummary}
            </p>
          </div>
        )}

        <div className="pt-8 border-t border-white/5 flex flex-wrap gap-4">
          <button
            onClick={() => router.push(`/sessions/${sessionId}/matches`)}
            className="flex items-center gap-3 px-6 py-3 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all rounded-none"
          >
            <ArrowLeft size={14} />
            Back to Matches
          </button>
          {discordDmUrl && (
            <button
              onClick={() => window.open(discordDmUrl, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-3 px-6 py-3 bg-white text-bfl-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all rounded-none"
            >
              <ExternalLink size={14} />
              Open Discord
            </button>
          )}
          {profile.linkedinUrl && (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all rounded-none"
            >
              <ExternalLink size={14} />
              LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}



