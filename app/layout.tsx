import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALYN AI | Intelligent Growth System",
  description:
    "AI agents, strategy, content, ads, and optimization in one execution platform."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
