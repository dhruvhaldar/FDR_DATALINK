import type { Metadata } from "next";
import { B612, B612_Mono } from "next/font/google";
import "./globals.css";

const b612 = B612({
  weight: ["400", "700"],
  variable: "--font-b612",
  subsets: ["latin"],
});

const b612Mono = B612_Mono({
  weight: ["400", "700"],
  variable: "--font-b612-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FDR DATALINK",
  description: "Flight Recorder Analysis Interface v1.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${b612.variable} ${b612Mono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
