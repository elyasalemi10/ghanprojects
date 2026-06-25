import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

// Self-hosted via next/font: no render-blocking Google Fonts request, and a
// size-adjusted fallback font is generated automatically so text doesn't
// resize when the web font loads (kills the first-paint flash).
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/shared/JsonLd";
import { organizationLd, websiteLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL("https://ghanprojects.com.au"),
  title: {
    default:
      "Ghan Projects | Property Development & Investment Consulting Melbourne",
    template: "%s | Ghan Projects",
  },
  description:
    "Melbourne's leading property development and investment consulting firm. Expert property advisory, joint venture structuring, buyer's agent services, and strategic property investment guidance.",
  keywords:
    "property development Melbourne, property investment consulting, property advisory Melbourne, joint venture property development, buyer's agent Melbourne, Ghan Projects, Ghan Property Group, property consulting Melbourne",
  authors: [{ name: "Ghan Projects" }],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Ghan Projects",
    locale: "en_AU",
    url: "https://ghanprojects.com.au",
    title:
      "Ghan Projects | Property Development & Investment Consulting Melbourne",
    description:
      "Melbourne's leading property development and investment consulting firm. Expert property advisory, joint venture structuring, and strategic property investment guidance.",
    images: [
      {
        url: "/images/ghan-projects-logo-blue.webp",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Ghan Projects | Property Development & Investment Consulting Melbourne",
    description:
      "Melbourne's leading property development and investment consulting firm.",
    images: ["/images/ghan-projects-logo-blue.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <JsonLd data={organizationLd()} />
        <JsonLd data={websiteLd()} />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow pt-20">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
