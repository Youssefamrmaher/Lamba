import type { Metadata, Viewport } from "next";
import { Baloo_Bhaijaan_2 } from "next/font/google";
import "./globals.css";

// Rounded, friendly, and covers both Latin and Arabic for the RTL step later.
const baloo = Baloo_Bhaijaan_2({
  variable: "--font-baloo",
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Watt Pet",
  description: "Know your electricity tier before the bill does.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf7ea",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Font variable sits on <html> so the theme's --font-sans (defined on :root) can see it.
    <html lang="en" className={baloo.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
