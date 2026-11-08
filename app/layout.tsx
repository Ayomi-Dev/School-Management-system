import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/src/providers/AppProvider";
import { headers } from "next/headers";
import { prisma } from "@/src/lib/prisma/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const schoolId = requestHeaders.get("x-school-id");

  if (schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    });

    if (school?.name) {
      return {
        title: school.name,
        description: `${school.name} school portal`,
      };
    }
  }

  return {
    title: "School Management System",
    description: "A comprehensive school management platform",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
