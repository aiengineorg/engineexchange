import { redirect } from "next/navigation";
import { auth } from "../(auth)/auth";
import { DEFAULT_SESSION_ID } from "@/lib/constants";

export default async function LandingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Redirect to the default session
  redirect(`/sessions/${DEFAULT_SESSION_ID}/discover`);
}
