import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALYN AI | Decide in Minutes. Not Days.",
  description:
    "ALYN helps aerospace suppliers understand whether they should accept complex orders before teams lose days chasing information.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#050506] text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
