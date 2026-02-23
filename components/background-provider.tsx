"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

// Default background for unmatched routes
const defaultBackground = "/backgrounds/home.jpg";

// Get background image based on the last segment of the pathname
function getBackgroundForPath(pathname: string): string {
  // Exact matches for specific routes
  if (pathname === "/") return "/backgrounds/home.jpg";
  if (pathname === "/login") return "/backgrounds/login.jpg";
  if (pathname === "/register") return "/backgrounds/register.jpg";
  if (pathname === "/sessions/new") return "/backgrounds/sessions-new.jpg";
  if (pathname === "/sessions/join") return "/backgrounds/sessions-join.jpg";

  // For dynamic routes, check the ending segment
  // More specific matches first (profile/edit before profile)
  if (pathname.endsWith("/profile/edit")) return "/backgrounds/profile-edit.jpg";
  if (pathname.endsWith("/profile/new")) return "/backgrounds/profile-new.jpg";
  if (pathname.endsWith("/profile")) return "/backgrounds/profile.jpg";
  if (pathname.endsWith("/discover")) return "/backgrounds/discover.jpg";
  if (pathname.endsWith("/matches")) return "/backgrounds/matches.jpg";
  if (pathname.endsWith("/interested")) return "/backgrounds/interested.jpg";
  if (pathname.endsWith("/directory")) return "/backgrounds/directory.jpg";
  if (pathname.endsWith("/teams")) return "/backgrounds/teams.jpg";
  if (pathname.endsWith("/submissions")) return "/backgrounds/submissions.jpg";

  // Also check if the path contains these segments (for nested routes)
  if (pathname.includes("/profile/edit")) return "/backgrounds/profile-edit.jpg";
  if (pathname.includes("/profile/new")) return "/backgrounds/profile-new.jpg";
  if (pathname.includes("/discover")) return "/backgrounds/discover.jpg";
  if (pathname.includes("/matches")) return "/backgrounds/matches.jpg";
  if (pathname.includes("/interested")) return "/backgrounds/interested.jpg";
  if (pathname.includes("/directory")) return "/backgrounds/directory.jpg";
  if (pathname.includes("/teams")) return "/backgrounds/teams.jpg";
  if (pathname.includes("/submissions")) return "/backgrounds/submissions.jpg";
  if (pathname.includes("/profile")) return "/backgrounds/profile.jpg";

  return defaultBackground;
}

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const backgroundImage = useMemo(() => {
    return getBackgroundForPath(pathname);
  }, [pathname]);

  return (
    <div className="relative min-h-screen">
      {/* Fixed background layer with mountain image */}
      <div
        className="fixed inset-0 z-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(22, 40, 34, 0.4), rgba(22, 40, 34, 0.95)), url('${backgroundImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          transform: 'scale(1.05)'
        }}
      />

      {/* Subtle grid lines overlay */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-20">
        <div
          className="absolute top-0 right-1/4 h-full w-px hidden lg:block"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
        />
        <div
          className="absolute top-0 left-1/4 h-full w-px hidden lg:block"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
        />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
