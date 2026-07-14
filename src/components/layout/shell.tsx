"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import type { ComponentType, ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  Settings2,
  Upload,
  UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems: { href: Route; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/analysis", label: "年级分析", icon: BarChart3 },
  { href: "/class", label: "班级成绩", icon: School },
  { href: "/import", label: "成绩导入", icon: Upload },
  { href: "/class/manage", label: "班级管理", icon: Settings2 },
  { href: "/students", label: "学生管理", icon: UserRound }
];

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", compact ? "justify-center" : "px-1")}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <BookOpenText size={18} />
      </div>
      {!compact && <span className="text-lg font-bold tracking-tight text-foreground">EduScore</span>}
    </div>
  );
}

function NavList({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active =
          item.href === "/class"
            ? pathname === "/class" || (pathname.startsWith("/class/") && !pathname.startsWith("/class/manage"))
            : item.href === "/students"
              ? pathname === "/students" || pathname.startsWith("/students/")
              : pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            href={item.href}
            key={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon size={18} />
            {!collapsed && <span>{item.label}</span>}
            {active && collapsed && (
              <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutNavItem({ collapsed }: { collapsed: boolean }) {
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
      className={cn(
        "w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center"
      )}
    >
      <LogOut size={18} />
      {!collapsed && <span>退出登录</span>}
    </Button>
  );
}

function UserBlock({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg bg-muted/60 p-2.5", collapsed && "justify-center p-2")}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UserRound size={16} />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">历史老师</p>
          <p className="text-xs text-muted-foreground">教师</p>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("eduscore_sidebar_collapsed");
    if (saved) setCollapsed(saved === "true");
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("eduscore_sidebar_collapsed", String(next));
  }

  if (pathname === "/login") {
    return <main className="min-h-screen p-4 md:p-6">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden flex-col border-r bg-card transition-all duration-200 md:flex",
          collapsed ? "w-[72px] px-2 py-4" : "w-[220px] px-3 py-4"
        )}
      >
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <BrandBlock compact={collapsed} />
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={toggleSidebar}
            className="mx-auto mt-4 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight size={18} />
          </button>
        )}
        <div className="mt-8 flex-1">
          <NavList pathname={pathname} collapsed={collapsed} />
        </div>
        <div className="mt-auto space-y-2 border-t pt-3">
          <UserBlock collapsed={collapsed} />
          <LogoutNavItem collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <BrandBlock compact />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[220px] bg-card p-3">
            <SheetTitle className="sr-only">主导航菜单</SheetTitle>
            <div className="flex h-full flex-col">
              <BrandBlock />
              <div className="mt-6 flex-1">
                <NavList pathname={pathname} collapsed={false} />
              </div>
              <div className="mt-auto space-y-2 border-t pt-3">
                <UserBlock collapsed={false} />
                <LogoutNavItem collapsed={false} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
