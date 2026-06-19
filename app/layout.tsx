import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "AlumniConnect - Bridging Graduates, Building Futures",
    template: "%s | AlumniConnect",
  },
  icons: {
    icon: "/favicon-32x32.png",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  description:
    "Reconnect with your alma mater, discover career opportunities, mentor students, and make a lasting impact on your community.",
  keywords: "alumni, network, career, mentorship, community, graduates",
  authors: [{ name: "AlumniConnect Team" }],
  creator: "AlumniConnect",
  publisher: "AlumniConnect",
  metadataBase: new URL("https://alumniconnect.example.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://alumniconnect.example.com",
    siteName: "AlumniConnect",
    title: "AlumniConnect - Bridging Graduates, Building Futures",
    description:
      "Reconnect with your alma mater, discover career opportunities, mentor students, and make a lasting impact.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AlumniConnect - Bridging Graduates, Building Futures",
    description:
      "Reconnect with your alma mater and build your professional network.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className={`${inter.className} antialiased`}>
          <AuthProvider>
            <div className="min-h-screen bg-white dark:bg-gray-900">
              {children}
            </div>
            <Toaster richColors closeButton position="top-center" />
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>

  );
}
