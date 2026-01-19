import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientSessionProvider } from "@/components/session-provider";
import { SidebarProvider } from "@/components/sidebar-context";
import { BackgroundProvider } from "@/components/background-provider";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aiengine.exchange"),
  title: "AI Exchange",
  description: "Fast matching through intelligent exchange - AI-powered connections using vector embeddings.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "AI Exchange",
    description: "Fast matching through intelligent exchange - AI-powered connections using vector embeddings.",
    url: "https://www.aiengine.exchange",
    siteName: "AI Exchange",
    images: [
      {
        url: "/images/thumbnail.jpg",
        width: 1200,
        height: 630,
        alt: "AI Exchange",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Exchange",
    description: "Fast matching through intelligent exchange - AI-powered connections using vector embeddings.",
    images: ["/images/thumbnail.jpg"],
  },
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

// FluxHack uses Inter for body text
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const LIGHT_THEME_COLOR = "#F8FAF8"; // FluxHack light mode
const DARK_THEME_COLOR = "#162822"; // FluxHack dark mode (lightened)
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
      className={inter.variable}
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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem
        >
          <BackgroundProvider>
            <Toaster position="top-center" />
            <SidebarProvider>
              <ClientSessionProvider>{children}</ClientSessionProvider>
            </SidebarProvider>
          </BackgroundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
