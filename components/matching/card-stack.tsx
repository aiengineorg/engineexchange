"use client";

import { useState } from "react";
import { X, Heart, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TinderCard } from "./tinder-card";

interface Profile {
  id: string;
  displayName: string;
  age: number;
  bio: string | null;
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
  const [swipeHistory, setSwipeHistory] = useState<Array<{ profileId: string; decision: "yes" | "no" }>>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentProfile = profiles[currentIndex];
  const hasMore = currentIndex < profiles.length;

  const handleSwipe = async (direction: "left" | "right") => {
    if (isAnimating || !currentProfile) return;

    setIsAnimating(true);
    const decision = direction === "right" ? "yes" : "no";

    try {
      await onSwipe(currentProfile.id, decision);
      setSwipeHistory([...swipeHistory, { profileId: currentProfile.id, decision }]);
      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error("Swipe failed:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleUndo = () => {
    if (swipeHistory.length === 0 || isAnimating) return;

    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory(swipeHistory.slice(0, -1));
    setCurrentIndex(currentIndex - 1);
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
      <div className="relative h-[500px] w-[350px]">
        {/* Show next 3 cards in stack */}
        {profiles.slice(currentIndex, currentIndex + 3).map((profile, index) => (
          <TinderCard
            key={profile.id}
            profile={profile}
            onSwipe={index === 0 ? handleSwipe : () => {}}
            style={{
              zIndex: 3 - index,
              transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
            }}
          />
        ))}
      </div>

      {/* Swipe Buttons */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={() => handleSwipe("left")}
          disabled={isAnimating}
        >
          <X className="h-6 w-6 text-destructive" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={handleUndo}
          disabled={isAnimating || swipeHistory.length === 0}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={() => handleSwipe("right")}
          disabled={isAnimating}
        >
          <Heart className="h-6 w-6 text-green-500" />
        </Button>
      </div>

      {/* Progress */}
      <p className="text-sm text-muted-foreground">
        {currentIndex + 1} / {profiles.length}
      </p>
    </div>
  );
}
