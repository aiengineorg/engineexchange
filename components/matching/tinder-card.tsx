"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { X, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Profile {
  id: string;
  displayName: string;
  age: number;
  bio: string | null;
  whatIOffer: string;
  whatImLookingFor: string;
  similarity?: number;
}

interface TinderCardProps {
  profile: Profile;
  onSwipe: (direction: "left" | "right") => void;
  style?: React.CSSProperties;
}

export function TinderCard({ profile, onSwipe, style }: TinderCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      const direction = info.offset.x > 0 ? "right" : "left";
      onSwipe(direction);
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        ...style,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute cursor-grab active:cursor-grabbing"
    >
      <Card className="w-[350px] select-none overflow-hidden shadow-xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{profile.displayName}</h3>
                <p className="text-muted-foreground">{profile.age} years old</p>
              </div>
              {profile.similarity !== undefined && (
                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {Math.round(profile.similarity * 100)}% match
                </div>
              )}
            </div>

            {profile.bio && (
              <div>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <h4 className="mb-1 text-sm font-semibold">What I Offer:</h4>
                <p className="text-sm leading-relaxed">{profile.whatIOffer}</p>
              </div>

              <div>
                <h4 className="mb-1 text-sm font-semibold">What I'm Looking For:</h4>
                <p className="text-sm leading-relaxed">{profile.whatImLookingFor}</p>
              </div>
            </div>
          </div>

          {/* Swipe indicators */}
          <motion.div
            style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
            className="pointer-events-none absolute left-8 top-8 flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-lg font-bold text-destructive-foreground"
          >
            <X className="h-6 w-6" />
            NOPE
          </motion.div>

          <motion.div
            style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
            className="pointer-events-none absolute right-8 top-8 flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-lg font-bold text-white"
          >
            <Heart className="h-6 w-6" />
            LIKE
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
