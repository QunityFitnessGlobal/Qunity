import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka, Rubik } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Rounded display face for challenge titles/points (see globals.css's
// --font-display and the `font-display` utility it gives Tailwind). Fredoka
// ships a real Hebrew subset (unlike most "fun" display fonts), so Hebrew
// challenge titles actually render in it instead of falling back silently.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["hebrew", "latin"],
  weight: ["500", "600", "700"],
});

// The mockups' text face, Hebrew included (see globals.css's --font-ui and
// the `font-ui` utility) — used for the bottom tab labels.
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: "Qunity",
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dir = locale === "en" ? "ltr" : "rtl";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${rubik.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
