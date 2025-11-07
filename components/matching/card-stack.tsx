"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
}

export function CardStack({ profiles, sessionId, onSwipe, onMatch }: CardStackProps) {
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
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <p className="text-lg text-muted-foreground">
          No more profiles to show!
        </p>
        <p className="text-sm text-muted-foreground">
          Check back later for new matches
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Card Stack */}
      <div className="relative h-[400px] w-[350px] md:w-[550px]">
        {/* Desktop Swipe Indicators */}
        <div className="pointer-events-none absolute inset-0 hidden md:flex items-center justify-between">
          <div className="flex flex-col items-center gap-3 text-muted-foreground opacity-50 -ml-4">
            <ChevronLeft className="h-16 w-16 text-red-600" />
            <span className="text-sm font-bold text-red-600 whitespace-nowrap">
              Swipe to reject
            </span>
          </div>
          <div className="flex flex-col items-center gap-3 text-muted-foreground opacity-30">
            <ChevronRight className="h-16 w-16 text-green-500" />
            <span className="text-sm font-medium text-green-500 whitespace-nowrap">
              Swipe to like
            </span>
          </div>
        </div>
        {/* Show next 3 cards in stack */}
        {profiles.slice(currentIndex, currentIndex + 3).map((profile, index) => (
          <TinderCard
            key={profile.id}
            profile={profile}
            onSwipe={index === 0 ? handleSwipe : () => {}}
            style={{
              zIndex: 3 - index,
              left: "50%",
              marginLeft: "-175px", // Half of card width (350px / 2) to center
              transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
              filter: index > 0 ? "blur(4px)" : "none",
            }}
          />
        ))}
      </div>

      {/* Mobile Swipe Indicators */}
      <div className="flex items-center justify-center gap-8 md:hidden -mt-4">
        <div className="flex items-center gap-2 text-red-600 opacity-50">
          <ChevronLeft className="h-6 w-6" />
          <span className="text-sm font-bold">Swipe left to reject</span>
        </div>
        <div className="flex items-center gap-2 text-green-500 opacity-30">
          <span className="text-sm font-medium">Swipe right to like</span>
          <ChevronRight className="h-6 w-6" />
        </div>
      </div>

      {/* Progress */}
      <p className="text-sm text-muted-foreground">
        {currentIndex + 1} / {profiles.length}
      </p>
    </div>
  );
}
