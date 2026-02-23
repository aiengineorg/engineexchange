"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { TinderCard } from "./tinder-card";

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

interface CardStackProps {
  profiles: Profile[];
  sessionId: string;
  onSwipe: (profileId: string, decision: "yes" | "no") => Promise<void>;
  onMatch?: (matchId: string) => void;
  onCardClick?: (profile: Profile) => void;
}

export function CardStack({ profiles, sessionId, onSwipe, onMatch, onCardClick }: CardStackProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // The top card is always the first profile in the array
  // Parent is responsible for removing swiped profiles from the array
  const currentProfile = profiles[0];
  const hasMore = profiles.length > 0;

  const handleSwipe = async (direction: "left" | "right") => {
    if (isAnimating || !currentProfile) return;

    setIsAnimating(true);
    const decision = direction === "right" ? "yes" : "no";

    try {
      await onSwipe(currentProfile.id, decision);
      // Parent will remove the profile from the array
    } catch (error) {
      console.error("Swipe failed:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  if (!hasMore) {
    return (
      <div className="text-center py-32 px-12 bg-white/[0.02] border border-white/5 rounded-sm w-full max-w-2xl">
        <div className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.6em] mb-8">All Caught Up</div>
        <h3 className="text-5xl font-extrabold text-white mb-6 italic tracking-tighter">NO MORE FOR NOW!</h3>
        <p className="text-bfl-muted mb-12 font-medium max-w-md mx-auto leading-relaxed">
          You've seen everyone available. Check back later for new people to connect with!
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full flex justify-center">
      {/* Show next 2 cards in stack */}
      <AnimatePresence mode="popLayout">
        {profiles.slice(0, 2).reverse().map((profile, index, arr) => {
          const isTop = index === arr.length - 1;
          return (
            <TinderCard
              key={profile.id}
              profile={profile}
              onSwipe={isTop ? handleSwipe : () => {}}
              onClick={onCardClick}
              style={{
                zIndex: isTop ? 10 : 1,
                transform: isTop ? undefined : `scale(0.96) translateY(20px)`,
                filter: isTop ? 'none' : 'blur(2px) grayscale(1)',
                opacity: isTop ? 1 : 0.3,
                pointerEvents: isTop ? 'auto' : 'none',
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
