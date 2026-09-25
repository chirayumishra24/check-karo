import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari, Plus_Jakarta_Sans } from "next/font/google";
import { Footer } from "@/components/footer";
import { BottomNav, Header } from "@/components/header";
import { LanguageGate } from "@/components/language-gate";
import { I18nProvider, themeBootScript } from "@/components/providers";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"] });

export const metadata: Metadata = {
  title: { default: "Check Karo — verify before you believe", template: "%s · Check Karo" },
  description:
    "Check WhatsApp forwards, links and screenshots, and find Indian government schemes you qualify for. Free, in Hindi and English.",
  applicationName: "Check Karo",
  appleWebApp: { capable: true, title: "Check Karo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d1a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${devanagari.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider>
          <Header />
          <main className="flex-1 pb-16 lg:pb-20">{children}</main>
          <Footer />
          <BottomNav />
          <LanguageGate />
          <ServiceWorker />
        </I18nProvider>
      </body>
    </html>
  );
}
