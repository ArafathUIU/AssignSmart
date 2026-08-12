"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { getStoredUser, getToken } from "@/lib/api";
import type { Role } from "@/lib/types";
import AppShell from "./layout/AppShell";

interface AuthSnapshot {
  hasAuth: boolean;
  role: Role | undefined;
}

let snapshotKey = "";
let cachedSnapshot: AuthSnapshot = { hasAuth: false, role: undefined };
const serverSnapshot: AuthSnapshot = { hasAuth: false, role: undefined };

function readSnapshot(): AuthSnapshot {
  const token = getToken();
  const user = getStoredUser();
  if (!token || !user) return { hasAuth: false, role: undefined };
  return { hasAuth: true, role: user.role };
}

function getSnapshot(): AuthSnapshot {
  const next = readSnapshot();
  const key = `${next.hasAuth}|${next.role ?? ""}`;
  if (key !== snapshotKey) {
    snapshotKey = key;
    cachedSnapshot = next;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return serverSnapshot;
}

function subscribe(): () => void {
  return () => {};
}

export default function AuthGuard({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { hasAuth, role } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!hasAuth) {
      router.replace("/login");
    } else if (roles && role != null && !roles.includes(role)) {
      router.replace("/dashboard");
    }
  }, [hasAuth, role, roles, router]);

  const authorized = hasAuth && (!roles || (role != null && roles.includes(role)));

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
