import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../../styles/globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Web3 Lab",
  description: "一个用于学习和实验 Web3 的 Next.js 应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body cz-shortcut-listen="true">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

