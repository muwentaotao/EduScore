"use client";

import type { ComponentType, ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Menu, School, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems: { href: Route; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/analysis", label: "年级分析", icon: BarChart3 },
  { href: "/class", label: "班级成绩", icon: School },
  { href: "/class/manage", label: "班级管理", icon: Settings2 }
];

function SideNav({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = item.href === "/class" ? pathname.startsWith("/class/") || pathname === "/class" : pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            href={item.href}
            key={item.href}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
              active ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen md:flex">
      <header className="sticky top-0 z-40 border-b bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-800">EduScore</p>
            <p className="text-xs text-slate-500">初三社会成绩分析</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu size={16} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 p-4 text-white shadow-soft">
                <p className="text-lg font-semibold">EduScore</p>
                <p className="text-xs opacity-90">导航</p>
              </div>
              <SideNav pathname={pathname} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <aside className="hidden w-64 border-r bg-white/95 p-4 backdrop-blur md:block">
        <div className="mb-7 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 p-4 text-white shadow-soft">
          <p className="text-lg font-semibold">EduScore</p>
          <p className="text-xs opacity-90">初三社会成绩分析</p>
        </div>
        <SideNav pathname={pathname} />
      </aside>

      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
