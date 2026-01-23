"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Heart, MessageCircle, Compass, User, Home, ShieldCheck, X, Users, UsersRound, FileText } from "lucide-react";
import { SignOutForm } from "@/components/sign-out-form";
import { useSidebar } from "@/components/sidebar-context";

export function BFLSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const sessionId = params?.sessionId as string | undefined;
  const { isOpen, close, toggle } = useSidebar();

  const menuItems = sessionId
    ? [
        { icon: Compass, label: "Discover", path: `/sessions/${sessionId}/discover` },
        { icon: Heart, label: "Interested In You", path: `/sessions/${sessionId}/interested` },
        { icon: MessageCircle, label: "Matches", path: `/sessions/${sessionId}/matches` },
        { icon: Users, label: "Directory", path: `/sessions/${sessionId}/directory` },
        { icon: UsersRound, label: "Teams", path: `/sessions/${sessionId}/teams` },
        { icon: FileText, label: "Submissions", path: `/sessions/${sessionId}/submissions` },
        { icon: User, label: "My Profile", path: `/sessions/${sessionId}/profile` },
      ]
    : [{ icon: Home, label: "Home", path: "/" }];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-bfl-black/80 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-bfl-black border-r border-white/10 transition-transform duration-500 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-8 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-normal tracking-[0.2em] text-white">AI EXCHANGE</h1>
              </div>
              <button
                onClick={close}
                className="md:hidden p-2 text-white/50 hover:text-white transition-colors"
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-bfl-green" />
              <span className="font-mono text-[9px] text-bfl-muted uppercase tracking-[0.4em]">
                Online
              </span>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-2">
            <div className="px-4 py-2 mb-4">
              <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.5em]">Menu</span>
            </div>
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      close();
                    }
                  }}
                  className={`flex items-center gap-5 px-5 py-4 transition-all duration-300 group ${
                    isActive
                      ? "bg-white/5 border-l-2 border-bfl-green text-white"
                      : "text-bfl-muted hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <item.icon
                    size={18}
                    className={isActive ? "text-bfl-green" : "text-white/20 group-hover:text-white/50"}
                  />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-8 border-t border-white/10">
            <div className="bg-white/5 p-5 rounded-sm border border-white/5 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={14} className="text-bfl-green" />
                <span className="font-mono text-[9px] font-bold text-white uppercase tracking-widest">
                  Privacy Active
                </span>
              </div>
              <p className="text-[10px] text-bfl-muted leading-relaxed">
                Local decryption mode enabled. Your data is restricted to this session.
              </p>
            </div>
            <SignOutForm />
          </div>
        </div>
      </aside>
    </>
  );
}

