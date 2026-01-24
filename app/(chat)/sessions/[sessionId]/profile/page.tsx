"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, ArrowLeft, Pencil, Users, Linkedin, Globe } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  images: string[];
  whatIOffer: string;
  whatImLookingFor: string;
  linkedinUrl?: string | null;
  websiteOrGithub?: string | null;
  hasTeam?: boolean;
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

        if (response.status === 404 || response.status === 401) {
          // No profile or user not found, redirect to create
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
          <p className="font-mono text-xs font-normal text-white uppercase tracking-[0.5em]">Loading Profile</p>
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
        <h2 className="text-6xl font-normal text-white tracking-tighter uppercase">My Profile</h2>
      </div>

      {/* Action Buttons - Top */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => router.push(`/sessions/${sessionId}/discover`)}
          className="flex items-center gap-2 px-5 py-3 border border-white/10 text-white font-normal text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all rounded-lg"
        >
          <ArrowLeft size={14} />
          Back to Discover
        </button>
        <button
          onClick={() => router.push(`/sessions/${sessionId}/profile/edit`)}
          className="flex items-center gap-2 px-5 py-3 bg-white text-bfl-black font-medium text-[10px] uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all rounded-lg"
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
            <h3 className="text-3xl font-normal text-white tracking-tight drop-shadow-lg uppercase">
              {profile.displayName}
            </h3>
          </div>
        </div>

        {/* Profile Details Section - Team Status & Links */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-3">
          {/* Team Status Indicator */}
          <div className="flex items-center gap-2">
            {profile.hasTeam ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-bfl-green/15 border border-bfl-green/30 rounded-full">
                <Users size={11} className="text-bfl-green" />
                <span className="text-[10px] font-bold text-bfl-green uppercase tracking-wider">Has Team</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full">
                <User size={11} className="text-bfl-muted" />
                <span className="text-[10px] font-medium text-bfl-muted uppercase tracking-wider">Looking for Team</span>
              </div>
            )}
          </div>

          {/* Social Links - Only show if URL exists */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-[#0077b5]/30 hover:bg-[#0077b5]/50 transition-all border border-[#0077b5]/50 hover:scale-105"
              >
                <Linkedin size={18} className="text-[#0077b5]" />
              </a>
            )}
            {profile.websiteOrGithub && (
              <a
                href={profile.websiteOrGithub.startsWith("http") ? profile.websiteOrGithub : `https://${profile.websiteOrGithub}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20 hover:scale-105"
              >
                <Globe size={18} className="text-white/90" />
              </a>
            )}
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

