import { Outfit } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";
import { AuthProvider } from "@/context/AuthContext";
import QueryProvider from "@/components/providers/QueryProvider";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});

export const metadata: Metadata = {
  title: "Future School System",
  description: "Comprehensive school management system",
  themeColor: "#1a7b9b",
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${outfit.className} overflow-x-hidden`}>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <SidebarProvider>
                <ToastProvider>{children}</ToastProvider>
              </SidebarProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
