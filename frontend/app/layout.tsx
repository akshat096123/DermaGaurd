import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DermaGuard — Clinical Triage & Diagnostic Intelligence",
  description: "Editorial multi-agent dermatological diagnostic and triage system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FAF4F0] text-[#1C1917] selection:bg-[#F2765E]/15 selection:text-[#F2765E]">
        {children}
      </body>
    </html>
  );
}
