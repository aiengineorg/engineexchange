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
            Welcome to Ai Engine Exchange
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Fast matching through intelligent exchange - AI-powered connections using vector embeddings
          </p>
        </div>

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
