import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: {
    default: "Tablekeeper | A Table Worth Keeping",
    template: "%s | Tablekeeper",
  },
  description:
    "Discover curated dining, select your exact table from interactive floor plans, and reserve seamlessly with Tablekeeper.",
  applicationName: "Tablekeeper",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#244b38",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-[#244b38] selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}