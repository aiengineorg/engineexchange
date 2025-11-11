import { cookies } from "next/headers";
import { ClientSidebarLayout } from "@/components/client-sidebar-layout";
import { auth } from "../(auth)/auth";

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <ClientSidebarLayout defaultOpen={!isCollapsed}>
      {children}
    </ClientSidebarLayout>
  );
}
