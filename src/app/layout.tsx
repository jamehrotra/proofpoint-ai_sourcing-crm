import type { Metadata } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { getCurrentUser } from "@/lib/session";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proofpoint Signal Scout",
  description: "AI-powered sourcing workflow for Vertical AI investing",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const headerStore = await headers();
  const pathname = headerStore.get('x-pathname') ?? '';
  const onLoginPage = pathname === '/login';

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#faf7f2] text-[#1a1816]"
      >
        {!onLoginPage && user && (
          <Nav currentUserDisplayName={user.displayName} currentUsername={user.username} />
        )}
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
