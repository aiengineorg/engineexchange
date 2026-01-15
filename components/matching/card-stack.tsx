"use client";

import { useState } from "react";
import { TinderCard } from "./tinder-card";

interface Profile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
  similarity?: number;
}

interface CardStackProps {
  profiles: Profile[];
  sessionId: string;
  onSwipe: (profileId: string, decision: "yes" | "no") => Promise<void>;
  onMatch?: (matchId: string) => void;
  onCardClick?: (profile: Profile) => void;
}

export function CardStack({ profiles, sessionId, onSwipe, onMatch, onCardClick }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentProfile = profiles[currentIndex];
  const hasMore = currentIndex < profiles.length;

  const handleSwipe = async (direction: "left" | "right") => {
    if (isAnimating || !currentProfile) return;

    setIsAnimating(true);
    const decision = direction === "right" ? "yes" : "no";

    try {
      await onSwipe(currentProfile.id, decision);
      setCurrentIndex(currentIndex + 1);
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
      {profiles.slice(currentIndex, currentIndex + 2).reverse().map((profile, index) => (
        <TinderCard 
          key={profile.id}
          profile={profile}
          onSwipe={index === 0 ? handleSwipe : () => {}}
          onClick={onCardClick}
          style={{
            zIndex: 2 - index,
            transform: `scale(${1 - index * 0.04}) translateY(${index * 20}px)`,
            filter: index > 0 ? 'blur(2px) grayscale(1)' : 'none',
            opacity: index > 0 ? 0.3 : 1
          }}
        />
      ))}
    </div>
  );
}
