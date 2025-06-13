import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "SignSpeak - Real-time Sign Language Translation for Google Meet",
  description: "Break the barrier with real-time sign language translation. Seamlessly integrate with Google Meet for inclusive communication.",
  keywords: "sign language, translation, accessibility, Google Meet, real-time, communication",
  authors: [{ name: "SignSpeak Team" }],
  openGraph: {
    title: "SignSpeak - Real-time Sign Language Translation",
    description: "Break the barrier with real-time sign language translation for Google Meet",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}