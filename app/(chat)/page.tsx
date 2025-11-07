import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getSessionsByUserId, getAvailableSessions } from "@/lib/db/queries";
import { auth } from "../(auth)/auth";

export default async function LandingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user's existing sessions and available sessions
  const [userSessions, availableSessions] = await Promise.all([
    getSessionsByUserId(session.user.id),
    getAvailableSessions(session.user.id),
  ]);

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mb-4">
        <SidebarTrigger />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to AI Engine Talent Matcher
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            AI-powered matching using vector embeddings
          </p>
        </div>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Join Our Discord Server
            </CardTitle>
            <CardDescription>
              Make sure you join our Discord server before proceeding so you can chat with your matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="https://discord.gg/9bxYTCef"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full" size="lg">
                Join Discord Server
              </Button>
            </a>
          </CardContent>
        </Card>

        {userSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Sessions</CardTitle>
              <CardDescription>
                Continue where you left off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userSessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}/discover`}
                    className="block"
                  >
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Code: {s.code} • {s.profileCount} {s.profileCount === 1 ? 'profile' : 'profiles'}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Open →
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {availableSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Sessions</CardTitle>
              <CardDescription>
                Join these sessions to start matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableSessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/sessions/join?code=${s.code}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Code: {s.code} • {s.profileCount} {s.profileCount === 1 ? 'profile' : 'profiles'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Join →
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Join Session</CardTitle>
            <CardDescription>
              Enter a 6-character code to join an existing session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/sessions/join">
              <Button className="w-full" size="lg" variant="outline">
                Join with Code
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Create Session</CardTitle>
            <CardDescription>
              Start a new matching session and invite others with a code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/sessions/new">
              <Button className="w-full" size="lg">
                Create New Session
              </Button>
            </Link>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
