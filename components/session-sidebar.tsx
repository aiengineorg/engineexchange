"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Heart, MessageCircle, Sparkles, User, Home, Users, PlusCircle, ShieldCheck, UsersRound, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SignOutForm } from "@/components/sign-out-form";

export function SessionSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const sessionId = params?.sessionId as string | undefined;

  // If no sessionId, show home navigation
  if (!sessionId) {
    return (
      <Sidebar className="bg-bfl-black border-r border-white/10">
        <SidebarContent>
          <div className="p-8 border-b border-white/10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center bg-white/5">
                <PlusCircle className="text-white w-6 h-6" />
              </div>
              <h1 className="text-lg font-black tracking-[0.2em] text-white italic">AI EXCHANGE</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-bfl-green" />
              <span className="font-mono text-[9px] text-bfl-muted uppercase tracking-[0.4em]">Secure Node</span>
            </div>
          </div>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="flex items-center gap-5 px-5 py-4 transition-all duration-300 text-bfl-muted hover:text-white hover:bg-white/[0.02]">
                    <Link href="/">
                      <Home className="h-[18px] w-[18px] text-white/20" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-8 border-t border-white/10">
            <SignOutForm />
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  // Session navigation
  const navItems = [
    {
      title: "Neural Scan",
      href: `/sessions/${sessionId}/discover`,
      icon: Sparkles,
      description: "Find new matches",
    },
    {
      title: "Interested",
      href: `/sessions/${sessionId}/interested`,
      icon: Heart,
      description: "People who liked you",
    },
    {
      title: "Syncs",
      href: `/sessions/${sessionId}/matches`,
      icon: MessageCircle,
      description: "Your matches",
    },
    {
      title: "Directory",
      href: `/sessions/${sessionId}/directory`,
      icon: Users,
      description: "Browse all profiles",
    },
    {
      title: "Teams",
      href: `/sessions/${sessionId}/teams`,
      icon: UsersRound,
      description: "Manage your team",
    },
    {
      title: "Submissions",
      href: `/sessions/${sessionId}/submissions`,
      icon: FileText,
      description: "Project submissions",
    },
    {
      title: "My Profile",
      href: `/sessions/${sessionId}/profile`,
      icon: User,
      description: "Edit your profile",
    },
  ];

  return (
    <Sidebar className="bg-bfl-black border-r border-white/10">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 border border-white/20 flex items-center justify-center bg-white/5">
              <PlusCircle className="text-white w-6 h-6" />
            </div>
            <h1 className="text-lg font-black tracking-[0.2em] text-white italic">AI EXCHANGE</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-bfl-green" />
            <span className="font-mono text-[9px] text-bfl-muted uppercase tracking-[0.4em]">Secure Node 81-X</span>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-2">
          <div className="px-4 py-2 mb-4">
            <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.5em]">Nav Systems</span>
          </div>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    className={`flex items-center gap-5 px-5 py-4 transition-all duration-300 group ${
                      isActive 
                        ? 'bg-white/5 border-l-2 border-bfl-green text-white' 
                        : 'text-bfl-muted hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <Link href={item.href}>
                      <item.icon 
                        size={18} 
                        className={isActive ? 'text-bfl-green' : 'text-white/20 group-hover:text-white/50'} 
                      />
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-8 border-t border-white/10">
          <div className="bg-white/5 p-5 rounded-sm border border-white/5 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck size={14} className="text-bfl-green" />
              <span className="font-mono text-[9px] font-bold text-white uppercase tracking-widest">Privacy Active</span>
            </div>
            <p className="text-[10px] text-bfl-muted leading-relaxed">Local decryption mode enabled. Your data is restricted to this session.</p>
          </div>
          <div className="p-2">
            <SignOutForm />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

