"use client";

import Form from "next/form";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";

export const SignOutForm = () => {
  return (
    <Form action={signOutAction} className="w-full">
      <button 
        type="submit"
        className="flex items-center gap-4 px-4 py-2 w-full text-bfl-muted hover:text-white transition-colors"
      >
        <LogOut size={16} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Terminate Session</span>
      </button>
    </Form>
  );
};
