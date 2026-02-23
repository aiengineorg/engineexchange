"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Maximize2, User, Users, Linkedin, Globe, ChevronLeft, ChevronRight, Award } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
  similarity?: number;
  matchReason?: string;
  searchedField?: "what_i_offer" | "what_im_looking_for";
  images?: string[];
  linkedinUrl?: string;
  websiteOrGithub?: string;
  hasTeam?: boolean;
  isBflAlumni?: boolean;
}

interface TinderCardProps {
  profile: Profile;
  onSwipe: (direction: "left" | "right") => void;
  onClick?: (profile: Profile) => void;
  style?: React.CSSProperties;
}

export function TinderCard({ profile, onSwipe, onClick, style }: TinderCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 120) {
      // Animate card off screen to the right, then trigger swipe
      animate(x, 500, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      }).then(() => onSwipe('right'));
    } else if (info.offset.x < -120) {
      // Animate card off screen to the left, then trigger swipe
      animate(x, -500, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      }).then(() => onSwipe('left'));
    } else {
      animate(x, 0, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
  };

  return (
    <motion.div
      style={{ x, rotate, ...style }}
      drag="x"
      dragConstraints={{ left: -400, right: 400 }}
      onDragEnd={handleDragEnd}
      onClick={() => Math.abs(x.get()) < 5 && onClick?.(profile)}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="absolute w-full h-[700px] cursor-grab active:cursor-grabbing max-w-[420px] touch-pan-x"
    >
      <div className="relative h-full w-full bg-bfl-black rounded-[1rem] overflow-hidden subtle-border shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col group border-t border-white/20">
        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute inset-0 z-40 bg-green-500/10 backdrop-blur-[2px] flex items-center justify-center border-4 border-green-500/50 m-4 rounded-xl pointer-events-none"
        >
          <span className="text-6xl font-black text-green-500 tracking-tighter uppercase italic">Connect</span>
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute inset-0 z-40 bg-red-500/10 backdrop-blur-[2px] flex items-center justify-center border-4 border-red-500/50 m-4 rounded-xl pointer-events-none"
        >
          <span className="text-6xl font-black text-red-500 tracking-tighter uppercase italic">Skip</span>
        </motion.div>

        {/* Hero Image Section - object-[center_20%] focuses on upper portion where faces typically are */}
        <div className="relative h-[260px] w-full flex-shrink-0">
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
          <div className="absolute inset-0 bg-gradient-to-t from-bfl-black via-transparent to-transparent" />

          {/* Name overlay at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight italic drop-shadow-lg">
                  {profile.displayName.toUpperCase()}
                </h3>
                {profile.similarity !== undefined && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-bfl-green animate-pulse" />
                    <span className="font-mono text-xs text-bfl-green font-bold drop-shadow">
                      {Math.round(profile.similarity * 100)}% Match
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.(profile);
                }}
                className="p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/70 transition-colors cursor-pointer"
              >
                <Maximize2 size={16} className="text-white/80" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details - Team Status & Links */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-3">
          {/* Team Status & Alumni Badge */}
          <div className="flex items-center gap-2">
            {profile.isBflAlumni && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full">
                <Award size={10} className="text-amber-400" />
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">BFL Hack</span>
              </div>
            )}
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
                onClick={(e) => e.stopPropagation()}
                className="p-2.5 rounded-lg bg-[#0077b5]/30 hover:bg-[#0077b5]/50 transition-all border border-[#0077b5]/50 hover:scale-105"
                title="LinkedIn"
              >
                <Linkedin size={18} className="text-[#0077b5]" />
              </a>
            )}
            {profile.websiteOrGithub && (
              <a
                href={profile.websiteOrGithub.startsWith("http") ? profile.websiteOrGithub : `https://${profile.websiteOrGithub}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20 hover:scale-105"
                title="Website / GitHub"
              >
                <Globe size={18} className="text-white/90" />
              </a>
            )}
          </div>
        </div>

        {/* Two Column Layout for Offer/Looking For */}
        <div className="flex-1 px-4 py-3 overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 gap-3 flex-1">
            {/* What I Can Offer */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className="h-px w-2 bg-bfl-green" />
                <h4 className="font-mono text-[8px] font-bold text-bfl-green uppercase tracking-[0.1em]">What I Offer</h4>
              </div>
              <p className="text-[11px] text-white leading-relaxed font-medium line-clamp-4">
                {profile.whatIOffer}
              </p>
            </div>

            {/* What I'm Looking For */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className="h-px w-2 bg-bfl-muted" />
                <h4 className="font-mono text-[8px] font-bold text-bfl-muted uppercase tracking-[0.1em]">Looking For</h4>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed font-medium line-clamp-4">
                {profile.whatImLookingFor}
              </p>
            </div>
          </div>

          {/* Match Reason - Full width below columns */}
          {profile.matchReason && (
            <div className="mt-3 pt-2.5 border-t border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-px w-2 bg-bfl-green" />
                <h4 className="font-mono text-[8px] font-bold text-bfl-green uppercase tracking-[0.1em]">Why You Match</h4>
              </div>
              <p className="text-[11px] text-bfl-green/80 leading-relaxed font-medium italic line-clamp-2">
                {profile.matchReason}
              </p>
            </div>
          )}
        </div>

        {/* Swipe Hint */}
        <div className="px-4 py-2 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1 text-red-500/60">
            <ChevronLeft size={14} />
            <span className="font-mono text-[9px] uppercase tracking-wider">Skip</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-0.5 bg-white/20 rounded-full" />
              <div className="w-2 h-2 border border-white/30 rounded-full" />
              <div className="w-8 h-0.5 bg-white/20 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-500/60">
            <span className="font-mono text-[9px] uppercase tracking-wider">Connect</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Action Buttons - Smaller */}
        <div className="p-4 border-t border-white/10 flex items-center justify-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              animate(x, -500, {
                type: "spring",
                stiffness: 300,
                damping: 30,
              }).then(() => onSwipe('left'));
            }}
            className="w-14 h-14 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-all active:scale-95"
            aria-label="Skip"
          >
            <span className="text-red-500 text-2xl font-bold">✕</span>
          </button>

          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[12px] text-white/30 uppercase tracking-[0.2em]">swipe or tap</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              animate(x, 500, {
                type: "spring",
                stiffness: 300,
                damping: 30,
              }).then(() => onSwipe('right'));
            }}
            className="w-14 h-14 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center hover:bg-green-500/20 transition-all active:scale-95"
            aria-label="Connect"
          >
            <span className="text-green-500 text-2xl font-bold">✓</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
