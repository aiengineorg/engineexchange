"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, ArrowLeft, Pencil, Briefcase, GraduationCap, Linkedin, Github } from "lucide-react";

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
    <div className="px-6 py-12 md:px-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Your Info</span>
        </div>
        <h2 className="text-6xl font-extrabold text-white tracking-tighter italic uppercase">My Profile</h2>
      </div>

      {/* Action Buttons - Top */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => router.push(`/sessions/${sessionId}/discover`)}
          className="flex items-center gap-2 px-5 py-3 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all rounded-lg"
        >
          <ArrowLeft size={14} />
          Back to Discover
        </button>
        <button
          onClick={() => router.push(`/sessions/${sessionId}/profile/edit`)}
          className="flex items-center gap-2 px-5 py-3 bg-white text-bfl-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all rounded-lg"
        >
          <Pencil size={14} />
          Edit Profile
        </button>
      </div>

      {/* Profile Card - Same dimensions as Discover Card */}
      <div className="flex justify-center">
        <div className="w-full max-w-[420px] h-[700px] bg-bfl-black rounded-[1rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 border-t-white/20 flex flex-col">
        {/* Hero Image Section */}
        <div className="relative h-[350px] w-full flex-shrink-0">
          {profile.images?.[0] ? (
            <img
              src={profile.images[0]}
              className="w-full h-full object-cover object-[center_20%]"
              alt={profile.displayName}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-bfl-dark to-bfl-black flex items-center justify-center">
              <User className="text-white/20" size={80} />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-bfl-black via-bfl-black/20 to-transparent" />

          {/* Name overlay at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-3xl font-extrabold text-white tracking-tight italic drop-shadow-lg uppercase">
              {profile.displayName}
            </h3>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-0.5">
            {/* Role & Company */}
            <div className="flex items-center gap-2 text-white/80">
              <Briefcase size={11} className="text-bfl-muted flex-shrink-0" />
              <span className="text-[11px] font-medium truncate">
                Role at Company
              </span>
            </div>
            {/* University */}
            <div className="flex items-center gap-2 text-white/60">
              <GraduationCap size={11} className="text-bfl-muted flex-shrink-0" />
              <span className="text-[11px] truncate">
                University
              </span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href="#"
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Linkedin size={11} className="text-white/50 hover:text-[#0077b5]" />
            </a>
            <a
              href="#"
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-[11px] h-[11px] text-white/50 hover:text-white fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="#"
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Github size={11} className="text-white/50 hover:text-white" />
            </a>
          </div>
        </div>

        {/* Content Section - Stacked Layout */}
        <div className="flex-1 px-4 py-3 overflow-y-auto flex flex-col gap-4">
          {/* What I Offer */}
          <div className="space-y-2 p-4 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-px w-4 bg-bfl-green" />
              <h4 className="font-mono text-[10px] font-bold text-bfl-green uppercase tracking-[0.15em]">What I Offer</h4>
            </div>
            <p className="text-sm text-white leading-relaxed">
              {profile.whatIOffer}
            </p>
          </div>

          {/* What I'm Looking For */}
          <div className="space-y-2 p-4 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-px w-4 bg-bfl-muted" />
              <h4 className="font-mono text-[10px] font-bold text-bfl-muted uppercase tracking-[0.15em]">Looking For</h4>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              {profile.whatImLookingFor}
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

