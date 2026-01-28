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
  Link as HeroLink,
} from "@heroui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { label: "概览 / Dashboard", href: "/" },
  { label: "交易", href: "/trade" },
  { label: "链上查询", href: "/explorer" },
  // { label: "工具 / 设置", href: "/tools" },
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
            <HeroLink
              isExternal
              href="https://github.com/Lsq128/web3-lab"
              aria-label="View source on GitHub"
              className="text-white/60 hover:text-white"
            >
              <svg
                aria-hidden="true"
                height="20"
                width="20"
                viewBox="0 0 16 16"
                className="fill-current"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
            </HeroLink>
          </NavbarItem>

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

