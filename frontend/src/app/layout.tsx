
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tablekeeper | Find Your Table",
    template: "%s | Tablekeeper",
  },
  description:
    "Discover restaurants, explore dining experiences, and reserve your table with Tablekeeper.",
  applicationName: "Tablekeeper",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f7f2",
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