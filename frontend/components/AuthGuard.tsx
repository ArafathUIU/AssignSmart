"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getStoredUser, getToken } from "@/lib/api";
import type { Role } from "@/lib/types";
import AppShell from "./layout/AppShell";

interface AuthSnapshot {
  hasAuth: boolean;
  role: Role | undefined;
}

const serverSnapshot: AuthSnapshot = { hasAuth: false, role: undefined };

function readSnapshot(): AuthSnapshot {
  const token = getToken();
  const user = getStoredUser();
  if (!token || !user) return { hasAuth: false, role: undefined };
  return { hasAuth: true, role: user.role };
}

function subscribe(callback: () => void): () => void {
  const handle = () => callback();
  window.addEventListener("storage", handle);
  window.addEventListener("auth-changed", handle as EventListener);
  return () => {
    window.removeEventListener("storage", handle);
    window.removeEventListener("auth-changed", handle as EventListener);
  };
}

function getSnapshot(): AuthSnapshot {
  return readSnapshot();
}

function getServerSnapshot(): AuthSnapshot {
  return serverSnapshot;
}

export default function AuthGuard({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const { hasAuth, role } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!hasAuth) {
      router.replace("/login");
    } else if (roles && role != null && !roles.includes(role)) {
      router.replace("/dashboard");
    }
  }, [mounted, hasAuth, role, roles, router]);

  const authorized = mounted && hasAuth && (!roles || (role != null && roles.includes(role)));

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Loading...
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
