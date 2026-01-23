"use client";

import Link from "next/link";
import { AlertTriangle, Mail } from "lucide-react";

interface EmailWarningBannerProps {
  sessionId: string;
  message?: string;
}

export function EmailWarningBanner({
  sessionId,
  message = "Add a contact email to your profile to participate in teams and submissions",
}: EmailWarningBannerProps) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-sm mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <p className="text-amber-200 font-medium mb-2">{message}</p>
          <Link
            href={`/sessions/${sessionId}/profile/edit`}
            className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors font-mono uppercase tracking-wider"
          >
            <Mail size={14} />
            Add Contact Email
          </Link>
        </div>
      </div>
    </div>
  );
}
