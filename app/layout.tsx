import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://chat.vercel.ai"),
  title: "AI Engine Talent Matcher",
  description: "Next.js chatbot template using the AI SDK.",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const LIGHT_THEME_COLOR = "hsl(220 13% 18%)";
const DARK_THEME_COLOR = "hsl(220 13% 18%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable}`}
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        {/* Neon green accents at top and bottom */}
        <div
          className="fixed top-0 left-0 right-0 h-[400px] pointer-events-none z-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(120 100% 60% / 0.8) 0%, hsl(142 100% 50% / 0.6) 15%, hsl(200 100% 60% / 0.4) 35%, hsl(280 100% 70% / 0.2) 55%, transparent 100%)",
            filter: "blur(100px)",
            boxShadow:
              "0 0 200px hsl(120 100% 60% / 0.6), 0 0 120px hsl(142 100% 50% / 0.5), 0 0 60px hsl(142 100% 50% / 0.4)",
          }}
        />
        <div
          className="fixed bottom-0 left-0 right-0 h-[400px] pointer-events-none z-0"
          style={{
            background:
              "linear-gradient(0deg, hsl(120 100% 60% / 0.8) 0%, hsl(142 100% 50% / 0.6) 15%, hsl(330 100% 70% / 0.4) 35%, hsl(280 100% 70% / 0.2) 55%, transparent 100%)",
            filter: "blur(100px)",
            boxShadow:
              "0 0 200px hsl(120 100% 60% / 0.6), 0 0 120px hsl(142 100% 50% / 0.5), 0 0 60px hsl(142 100% 50% / 0.4)",
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem
        >
          <div className="relative z-10">
            <Toaster position="top-center" />
            <SessionProvider>{children}</SessionProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
