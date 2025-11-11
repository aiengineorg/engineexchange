"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SessionSidebar } from "@/components/session-sidebar";
import type { ReactNode } from "react";

export function ClientSidebarLayout({
  children,
  defaultOpen,
}: {
  children: ReactNode;
  defaultOpen: boolean;
}) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SessionSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
