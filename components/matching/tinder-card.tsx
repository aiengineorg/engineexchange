"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Maximize2, User } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
  similarity?: number;
  matchReason?: string;
  searchedField?: "what_i_offer" | "what_im_looking_for";
  images?: string[];
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
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 120) {
      onSwipe('right');
    } else if (info.offset.x < -120) {
      onSwipe('left');
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
      style={{ x, rotate, opacity, ...style }}
      drag="x"
      dragConstraints={{ left: -400, right: 400 }}
      onDragEnd={handleDragEnd}
      onClick={() => Math.abs(x.get()) < 5 && onClick?.(profile)}
      className="absolute w-full h-[640px] cursor-grab active:cursor-grabbing max-w-[420px]"
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

        {/* Header with small image and name */}
        <div className="p-6 flex items-center gap-4 border-b border-white/10">
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20">
            {profile.images?.[0] ? (
              <img
                src={profile.images[0]}
                className="w-full h-full object-cover"
                alt={profile.displayName}
              />
            ) : (
              <div className="w-full h-full bg-bfl-dark flex items-center justify-center">
                <User className="text-white/30" size={24} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-extrabold text-white tracking-tight italic truncate">
              {profile.displayName.toUpperCase()}
            </h3>
            {profile.similarity !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-bfl-green" />
                <span className="font-mono text-xs text-bfl-green font-bold">
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
            className="p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
          >
            <Maximize2 size={16} className="text-white/50" />
          </button>
        </div>

        {/* Main Content - Text focused */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* What I Can Offer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px w-6 bg-bfl-green" />
              <h4 className="font-mono text-[10px] font-bold text-bfl-green uppercase tracking-[0.3em]">What I Can Offer</h4>
            </div>
            <p className="text-sm text-white leading-relaxed font-medium">
              {profile.whatIOffer}
            </p>
          </div>

          {/* What I'm Looking For */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px w-6 bg-bfl-muted" />
              <h4 className="font-mono text-[10px] font-bold text-bfl-muted uppercase tracking-[0.3em]">What I'm Looking For</h4>
            </div>
            <p className="text-sm text-white/80 leading-relaxed font-medium">
              {profile.whatImLookingFor}
            </p>
          </div>

          {/* Match Reason if available */}
          {profile.matchReason && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-px w-6 bg-bfl-green" />
                <h4 className="font-mono text-[10px] font-bold text-bfl-green uppercase tracking-[0.3em]">Why You Match</h4>
              </div>
              <p className="text-sm text-bfl-green/80 leading-relaxed font-medium italic">
                {profile.matchReason}
              </p>
            </div>
          )}
        </div>

        {/* Bottom hint */}
        <div className="p-4 border-t border-white/10 text-center">
          <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.3em]">
            Swipe right to connect · Swipe left to skip
          </span>
        </div>
      </div>
    </motion.div>
  );
}
