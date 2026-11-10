import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

import { AppToaster } from "@/components/app-toaster";
import { PromotionPopup } from "@/components/promotional/PromotionPopup";
import { ThemeProvider, type ThemePreference } from "@/components/theme-provider";
import { getPlatformSettings } from "@/lib/platform";
import { DEFAULT_SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

const defaultTitle = "LearnCode — Belajar Coding dengan Praktik dan AI";

export async function generateMetadata(): Promise<Metadata> {
  const platform = await getPlatformSettings();
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: {
      default: defaultTitle,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    alternates: { canonical: "/" },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: defaultTitle,
      description: DEFAULT_SITE_DESCRIPTION,
      url: "/",
      type: "website",
      locale: "id_ID",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary",
      title: defaultTitle,
      description: DEFAULT_SITE_DESCRIPTION,
    },
    icons: platform.faviconUrl
      ? { icon: [{ url: platform.faviconUrl }] }
      : { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#121310" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `
(function () {
  try {
    var key = "learncode-theme";
    var match = document.cookie.match(/(?:^|; )learncode-theme=([^;]+)/);
    var stored = match ? decodeURIComponent(match[1]) : window.localStorage.getItem(key);
    var theme = (stored === "light" || stored === "dark" || stored === "system") ? stored : "system";
    var isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.dataset.theme = theme;
  } catch (error) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("learncode-theme")?.value;
  const initialTheme: ThemePreference =
    cookieTheme === "light" || cookieTheme === "dark" || cookieTheme === "system"
      ? cookieTheme
      : "system";

  return (
    <html
      lang="id"
      className={initialTheme === "dark" ? "dark" : undefined}
      data-theme={initialTheme}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <ThemeProvider initialTheme={initialTheme}>
          <a href="#main-content" className="skip-link">
            Lewati ke konten utama
          </a>
          {children}
          <PromotionPopup />
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
