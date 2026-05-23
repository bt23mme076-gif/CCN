import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CableEasy - Cable Operator Recharge Portal",
  description: "Recharge your cable connection online with instant activation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
