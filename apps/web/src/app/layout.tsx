import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bidding agents",
  description: "Agent auction for product tasks",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontSans.variable} h-full`}>
      <body
        className={`${fontMono.variable} min-h-full flex flex-col font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
