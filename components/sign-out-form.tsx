"use client";

import Form from "next/form";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export const SignOutForm = () => {
  return (
    <Form action={signOutAction} className="w-full">
      <SidebarMenuButton
        className="w-full text-red-500 hover:text-red-600 hover:bg-sidebar-accent"
        type="submit"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign out</span>
      </SidebarMenuButton>
    </Form>
  );
};
