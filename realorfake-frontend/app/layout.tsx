import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

const heebo = Heebo({ subsets: ["latin", "hebrew"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "RealOrFake — גלאי תוכן AI",
  description: "כלי לזיהוי תמונות שנוצרו ע״י בינה מלאכותית",
  openGraph: { title: "RealOrFake", description: "AI image detector" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // dir is set client-side by LocaleProvider via a small useEffect that mutates documentElement.
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <Header />
          <main className="container mx-auto max-w-6xl px-4 py-6 md:py-10">{children}</main>
          <Footer />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
