import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EDHKeep — Commander Collection Vault",
  description:
    "MTG Commander collection optimizer. Categorize your cards as Keep, Pending, or Fail using EDHRec inclusion-rate data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
