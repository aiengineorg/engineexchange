"use client";

import { useFormStatus } from "react-dom";

import { LoaderIcon } from "@/components/icons";

import { Button } from "./ui/button";

export function SubmitButton({
  children,
  isSuccessful,
}: {
  children: React.ReactNode;
  isSuccessful: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending || isSuccessful}
      className="relative w-full px-10 py-5 bg-white text-bfl-black rounded-sm font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-bfl-offwhite transition-all transform hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      disabled={pending || isSuccessful}
      type={pending ? "button" : "submit"}
    >
      {children}

      {(pending || isSuccessful) && (
        <span className="absolute right-4 animate-spin">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {pending || isSuccessful ? "Loading" : "Submit form"}
      </output>
    </button>
  );
}
