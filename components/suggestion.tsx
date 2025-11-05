"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuggestionProps {
  suggestion: string;
  onClick: (suggestion: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Suggestion({
  suggestion,
  onClick,
  children,
  className,
}: SuggestionProps) {
  return (
    <Button
      variant="outline"
      onClick={() => onClick(suggestion)}
      className={cn("justify-start", className)}
      type="button"
    >
      {children}
    </Button>
  );
}

