"use client";

import { BFLSidebar } from "@/components/bfl-sidebar";
import { useSidebar } from "@/components/sidebar-context";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";

function MobileHeader() {
  const { open } = useSidebar();

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-bfl-black/95 backdrop-blur-sm border-b border-white/10">
      <div className="flex items-center gap-4 px-4 py-2">
        <button
          onClick={open}
          className="p-2 text-white/70 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span className="text-xs font-black tracking-[0.15em] text-white italic">AI EXCHANGE</span>
      </div>
    </div>
  );
}

export function ClientSidebarLayout({
  children,
  defaultOpen,
}: {
  children: ReactNode;
  defaultOpen: boolean;
}) {
  return (
    <div className="min-h-screen bg-background font-sans">
      <MobileHeader />
      <BFLSidebar />
      <main className="md:ml-72 relative min-h-screen pt-12 md:pt-0">
        <div className="relative">{children}</div>
      </main>
    </div>
  );
}
