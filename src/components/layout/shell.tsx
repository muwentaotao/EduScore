"use client";

import type { ComponentType, ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, LayoutDashboard, LogOut, Menu, School, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
        const active =
          item.href === "/class"
            ? pathname === "/class" || (pathname.startsWith("/class/") && !pathname.startsWith("/class/manage"))
            : pathname === item.href;
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

function LogoutNavItem() {
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      onClick={onLogout}
      className="w-full justify-start rounded-xl px-3 py-2 text-sm font-normal text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    >
      <LogOut size={14} />
      退出登录
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <main className="min-h-screen p-4 md:p-6">{children}</main>;
  }

  return (
    <div className="min-h-screen md:flex">
      <header className="sticky top-0 z-40 border-b bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-800">EduScore</p>
            <p className="text-xs text-slate-500">初三社会成绩分析</p>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu size={16} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetTitle className="sr-only">主导航菜单</SheetTitle>
                <div className="flex h-full flex-col">
                  <div className="mb-6 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 p-4 text-white shadow-soft">
                    <p className="text-lg font-semibold">EduScore</p>
                    <p className="text-xs opacity-90">导航</p>
                  </div>
                  <SideNav pathname={pathname} />
                  <div className="mt-auto border-t pt-3">
                    <LogoutNavItem />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <aside className="hidden w-64 flex-col border-r bg-white/95 p-4 backdrop-blur md:flex">
        <div className="mb-7 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 p-4 text-white shadow-soft">
          <p className="text-lg font-semibold">EduScore</p>
          <p className="text-xs opacity-90">初三社会成绩分析</p>
        </div>
        <SideNav pathname={pathname} />
        <div className="mt-auto border-t pt-3">
          <LogoutNavItem />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
