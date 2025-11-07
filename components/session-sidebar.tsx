"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Heart, MessageCircle, Sparkles, User, Home, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/">
                      <Home className="h-4 w-4" />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-2">
            <SignOutForm />
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  // Session navigation
  const navItems = [
    {
      title: "Discover",
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
      title: "Matches",
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
      title: "Profile",
      href: `/sessions/${sessionId}/profile`,
      icon: User,
      description: "Edit your profile",
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Session</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Match</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          <SignOutForm />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

