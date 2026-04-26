"use client";

import type { ComponentType, ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  Settings2,
  UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <nav className="space-y-1.5">
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
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition",
              active
                ? "bg-blue-100/90 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon size={18} />
            <span className="text-base font-medium">{item.label}</span>
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
      className="w-full justify-start rounded-xl px-3 py-2 text-base font-normal text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    >
      <LogOut size={16} />
      退出登录
    </Button>
  );
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl p-1", compact ? "mb-0" : "mb-7")}>
      <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm">
        <BookOpenText size={20} />
      </div>
      <div>
        <p className={cn("font-bold text-blue-600", compact ? "text-2xl" : "text-3xl")}>EduScore</p>
        <p className={cn("text-slate-500", compact ? "text-xs" : "text-sm")}>教学成绩分析系统</p>
      </div>
    </div>
  );
}

function TeacherBlock() {
  return (
    <Card className="border border-slate-200 bg-white/90">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <UserRound size={21} />
        </div>
        <div>
          <p className="font-medium text-slate-700">历史老师</p>
          <p className="text-xs text-emerald-600">教师</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <main className="min-h-screen p-4 md:p-6">{children}</main>;
  }

  return (
    <div className="min-h-screen md:flex">
      <header className="sticky top-0 z-40 border-b bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <BrandBlock compact />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu size={16} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[290px] bg-slate-50">
              <SheetTitle className="sr-only">主导航菜单</SheetTitle>
              <div className="flex h-full flex-col">
                <BrandBlock />
                <SideNav pathname={pathname} />
                <div className="mt-auto space-y-3 border-t pt-3">
                  <TeacherBlock />
                  <LogoutNavItem />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <aside className="hidden w-[320px] flex-col border-r bg-slate-50/90 px-4 py-6 md:flex">
        <BrandBlock />
        <SideNav pathname={pathname} />
        <div className="mt-auto space-y-3 border-t pt-3">
          <TeacherBlock />
          <LogoutNavItem />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
