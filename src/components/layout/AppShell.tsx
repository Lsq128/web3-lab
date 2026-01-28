"use client";

import {
  Button,
  Card,
  CardBody,
  Divider,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { label: "概览 / Dashboard", href: "/" },
  { label: "交易", href: "/trade" },
  { label: "链上查询", href: "/explorer" },
  { label: "工具 / 设置", href: "/tools" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar
        maxWidth="xl"
        classNames={{
          base: "border-b border-white/10 bg-black/60 backdrop-blur-sm",
          wrapper: "px-4 sm:px-6 lg:px-8",
        }}
      >
        <NavbarBrand className="gap-2">
          <div className="h-7 w-7 rounded-lg bg-linear-to-tr from-purple-500 to-cyan-400" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-wide">Web3 Lab</span>
            <span className="text-[11px] text-white/50">学习 · 实验 · 调试</span>
          </div>
        </NavbarBrand>

        <NavbarContent justify="end" className="gap-3">
          <NavbarItem className="hidden sm:flex">
            <ConnectButton showBalance={false} />
          </NavbarItem>

        </NavbarContent>
      </Navbar>

      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-52 shrink-0 sm:block">
          <Card className="border border-white/10 bg-white/5">
            <CardBody className="gap-2 p-3">
              <div className="px-2 text-[11px] font-medium uppercase tracking-wide text-white/40">
                导航
              </div>

              <Divider className="bg-white/10" />

              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Button
                      key={item.href}
                      as={Link}
                      href={item.href}
                      size="sm"
                      variant={isActive ? "solid" : "light"}
                      className={[
                        "justify-start",
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/70",
                      ].join(" ")}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </aside>

        <main className="min-w-0 flex-1">
          <Card className="border border-white/10 bg-white/5">
            <CardBody className="p-4 sm:p-6">{children}</CardBody>
          </Card>
        </main>
      </div>
    </div>
  );
}

