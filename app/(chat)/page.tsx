import { redirect } from "next/navigation";
import { auth } from "../(auth)/auth";

// Hardcoded default session ID
const DEFAULT_SESSION_ID = "1784d222-27f9-4fed-a28f-f454444e760f";

export default async function LandingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Redirect to the default session
  redirect(`/sessions/${DEFAULT_SESSION_ID}/discover`);
}
