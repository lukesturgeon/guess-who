import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  weight: ["600"],
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guess who",
  description: "A guessing game for children, what is the animal, where are they?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* Add other meta tags or links here if needed */}
      </head>
      <body
        className={`${fredoka.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
