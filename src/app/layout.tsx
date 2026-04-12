import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { ThemeToggle } from "./components/ThemeToggle";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IIIT Bhopal Resume Analyzer - AI Career Guidance",
  description: "Predict your career path with AI-powered resume analysis and job matching",
  icons: {
    icon: "/CareerPredict.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/CareerPredict.png" type="image/png" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300`}>
        <Navbar />
        <div className="pt-16 flex-grow">
          {children}
        </div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
