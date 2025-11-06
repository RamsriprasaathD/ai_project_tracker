import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HierarchIQ - Intelligent Project Management",
  description: "Hierarchical project management with AI-powered insights for teams and organizations",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white antialiased`}
      >
        {/* 🌌 Animated Background Lights */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-700/20 to-purple-700/20 rounded-full blur-3xl top-[-200px] left-[-150px] animate-pulse"></div>
          <div className="absolute w-[600px] h-[600px] bg-gradient-to-l from-indigo-800/20 to-cyan-700/20 rounded-full blur-3xl bottom-[-200px] right-[-150px] animate-pulse"></div>
        </div>

        {/* 🧭 Page Content */}
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
