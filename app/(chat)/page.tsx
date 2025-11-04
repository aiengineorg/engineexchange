import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionsByUserId } from "@/lib/db/queries";
import { auth } from "../(auth)/auth";

export default async function LandingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user's existing sessions
  const sessions = await getSessionsByUserId(session.user.id);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Semantic Match
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            AI-powered matching using vector embeddings
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        {sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Sessions</CardTitle>
              <CardDescription>
                Continue where you left off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}/discover`}
                    className="block"
                  >
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Code: {s.code}
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
      </div>
    </div>
  );
}
