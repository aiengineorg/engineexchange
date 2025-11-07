"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function JoinSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromQuery = searchParams.get("code") || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showDiscordStep, setShowDiscordStep] = useState(false);
  const [discordJoined, setDiscordJoined] = useState(false);

  // Pre-fill code from query parameter
  useEffect(() => {
    if (codeFromQuery) {
      setCode(codeFromQuery.toUpperCase().slice(0, 6));
    }
  }, [codeFromQuery]);

  const handleCodeChange = (value: string) => {
    // Auto-uppercase and limit to 6 characters
    setCode(value.toUpperCase().slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join session");
      }

      const session = await response.json();
      setSessionId(session.id);
      setShowDiscordStep(true);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const handleContinueToProfile = () => {
    if (sessionId) {
      router.push(`/sessions/${sessionId}/profile/new`);
    }
  };

  const handleDiscordClick = () => {
    setDiscordJoined(true);
  };

  if (showDiscordStep) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {/* Discord Join Card */}
          <Card
            className={`w-full border-primary/50 bg-card/90 backdrop-blur-sm shadow-xl shadow-primary/30 ring-2 ring-primary/20 transition-all ${
              discordJoined ? "opacity-75" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    1
                  </span>
                  Join Our Discord Server
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </CardTitle>
                <Badge variant="destructive" className="animate-pulse">
                  ⚠️ Important
                </Badge>
              </div>
              <CardDescription className="mt-2 text-base font-medium">
                <strong>Required:</strong> You must join our Discord server before creating your profile. This is where you'll chat with your matches!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <a
                href="https://discord.gg/9bxYTCef"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                onClick={handleDiscordClick}
              >
                <Button className="w-full" size="lg" disabled={discordJoined}>
                  {discordJoined ? (
                    <>
                      <svg
                        className="mr-2 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Joined Discord
                    </>
                  ) : (
                    "Join Discord Server"
                  )}
                </Button>
              </a>
              {discordJoined && (
                <p className="text-center text-sm text-muted-foreground">
                  Great! Now you can create your profile →
                </p>
              )}
            </CardContent>
          </Card>

          {/* Create Profile Card */}
          <Card
            className={`w-full transition-all ${
              discordJoined
                ? "border-primary/50 bg-card/90 backdrop-blur-sm shadow-xl shadow-primary/30 ring-2 ring-primary/20"
                : "border-muted bg-muted/30 opacity-50"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      discordJoined
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    2
                  </span>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Create Your Profile
                </CardTitle>
                {!discordJoined && (
                  <Badge variant="outline" className="animate-pulse">
                    🔒 Locked
                  </Badge>
                )}
                {discordJoined && (
                  <Badge variant="default" className="bg-green-600">
                    ✓ Unlocked
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-2 text-base font-medium">
                {discordJoined ? (
                  <>
                    <strong>Ready!</strong> Create your profile to start matching with others in this session.
                  </>
                ) : (
                  <>
                    <strong>Locked:</strong> Join Discord first to unlock profile creation.
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleContinueToProfile}
                className="w-full"
                size="lg"
                variant={discordJoined ? "default" : "secondary"}
                disabled={!discordJoined}
              >
                {discordJoined ? (
                  "Create Profile →"
                ) : (
                  <>
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Join Discord to Unlock
                  </>
                )}
              </Button>
              {!discordJoined && (
                <p className="text-center text-sm text-muted-foreground">
                  Complete the Discord step first
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Session</CardTitle>
          <CardDescription>
            Enter the 6-character code you received to join a matching session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Session Code</Label>
              <Input
                id="code"
                placeholder="ABC123"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                required
                maxLength={6}
                disabled={loading}
                className="text-center text-2xl font-mono tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Codes are 6 characters long (letters and numbers)
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1"
              >
                {loading ? "Joining..." : "Join Session"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
