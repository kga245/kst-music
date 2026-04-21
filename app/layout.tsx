import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kst-music",
  description:
    "Demystifying AI-generated music making and sample creation for producers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
