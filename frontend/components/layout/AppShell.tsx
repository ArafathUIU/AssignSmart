"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  TrendingUp,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { getStoredUser, setStoredUser, setToken } from "@/lib/api";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { LogoIcon } from "@/components/ui/Logo";

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const adminNav: NavSection[] = [
  {
    label: "Menu",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
      { href: "/admin/classes", label: "Classes", icon: <GraduationCap className="h-4 w-4" /> },
      { href: "/admin/subjects", label: "Subjects", icon: <BookOpen className="h-4 w-4" /> },
      { href: "/admin/teacher-assignments", label: "Teacher Assignments", icon: <UserCog className="h-4 w-4" /> },
      { href: "/admin/assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" /> },
      { href: "/admin/submissions", label: "Submissions", icon: <Inbox className="h-4 w-4" /> },
      { href: "/admin/calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    ],
  },
];

const teacherNav: NavSection[] = [
  {
    label: "Menu",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/teacher/assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" /> },
      { href: "/teacher/submissions", label: "Submissions", icon: <Inbox className="h-4 w-4" /> },
      { href: "/teacher/calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
      { href: "/teacher/performance", label: "Performance", icon: <TrendingUp className="h-4 w-4" /> },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    ],
  },
];

const studentNav: NavSection[] = [
  {
    label: "Menu",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/student/assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" /> },
      { href: "/student/submissions", label: "Submissions", icon: <Inbox className="h-4 w-4" /> },
      { href: "/student/grades", label: "Grades", icon: <BarChart3 className="h-4 w-4" /> },
      { href: "/student/calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
      { href: "/student/performance", label: "Performance", icon: <TrendingUp className="h-4 w-4" /> },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    ],
  },
];

function navFor(role: Role | undefined): NavSection[] {
  if (role === "Admin") return adminNav;
  if (role === "Teacher") return teacherNav;
  return studentNav;
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-5 py-4"
    >
      <LogoIcon className="h-9 w-9" />
      <span className="text-base font-bold tracking-tight text-slate-900">
        AssignSmart
      </span>
    </Link>
  );
}

function SidebarContent({
  sections,
  user,
  onNavigate,
}: {
  sections: NavSection[];
  user: ReturnType<typeof getStoredUser>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    setToken(null);
    setStoredUser(null);
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col">
      <Brand onNavigate={onNavigate} />
      <nav className="flex-1 space-y-6 px-3 py-4">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    item.href !== "#" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={item.href === "#" ? (e) => e.preventDefault() : onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      item.href === "#" && "cursor-default opacity-50",
                      active
                        ? "bg-gradient-to-r from-brand-50 to-brand-50/40 text-brand-700 shadow-[inset_0_0_0_1px_rgb(79_70_229/0.12)]"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-500 to-brand-700" />
                    )}
                    <span
                      className={cn(
                        "transition-colors",
                        active
                          ? "text-brand-600"
                          : "text-slate-400 group-hover:text-slate-600",
                      )}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3">
        {user && (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent p-2">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user] = useState<ReturnType<typeof getStoredUser>>(() =>
    getStoredUser(),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sections = navFor(user?.role);

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/80 bg-white/95 backdrop-blur lg:block">
        <SidebarContent sections={sections} user={user} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 animate-slide-up bg-white shadow-[var(--shadow-lifted)]">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              sections={sections}
              user={user}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <div className="sticky top-0 z-20 px-4 py-3 lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
