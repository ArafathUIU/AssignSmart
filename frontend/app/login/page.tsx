"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ClipboardList,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api, setStoredUser, setToken } from "@/lib/api";
import type { LoginResponse } from "@/lib/types";
import { LogoIcon, LogoWordmark } from "@/components/ui/Logo";

const demoAccounts = [
  { role: "Admin", email: "admin@assignsmart.com", password: "Admin@123" },
  { role: "Teacher", email: "teacher@assignsmart.com", password: "Teacher@123" },
  { role: "Student", email: "student@assignsmart.com", password: "Student@123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await api.post<LoginResponse>("/api/auth/login", {
        email,
        password,
      });
      setToken(result.token);
      setStoredUser(result.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(account: (typeof demoAccounts)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Dynamic gradient background */}
      <div
        className="absolute inset-0 animate-[bg-shift_16s_ease_infinite]"
        style={{
          background:
            "linear-gradient(135deg, #F8F9FA 0%, #E8F8F9 25%, #F0F4F8 50%, #FDF6EE 75%, #F8F9FA 100%)",
          backgroundSize: "300% 300%",
        }}
      />

      {/* Floating orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[400px] w-[400px] animate-[float_10s_ease-in-out_infinite] rounded-full bg-[#00A8B5]/15 blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 h-[350px] w-[350px] animate-[float_12s_ease-in-out_infinite_3s] rounded-full bg-[#FF8C00]/12 blur-[90px]" />
      </div>

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(148 163 184) 0.5px, transparent 0.5px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Single split card */}
      <div className="relative w-full max-w-4xl animate-scale-in overflow-hidden rounded-[28px] border border-white/60 bg-white/50 shadow-[0_0_0_0.5px_rgb(255_255_255/0.5),0_4px_16px_rgb(0_0_0/0.04),0_16px_48px_rgb(0_0_0/0.08)] backdrop-blur-2xl md:grid md:grid-cols-[1fr_1.1fr]">
        {/* Inner highlight */}
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/30 via-transparent to-transparent" />

        {/* --- LEFT PANEL: Branding --- */}
        <div
          className="relative hidden flex-col gap-10 overflow-hidden p-8 text-white md:flex md:p-10"
          style={{ background: "linear-gradient(135deg, #0F2537 0%, #15324A 50%, #0F2537 100%)" }}
        >
          {/* Decorative glow */}
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#00A8B5]/15 blur-[60px]" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[#FF8C00]/10 blur-[50px]" />

          {/* Subtle pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative">
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
              <LogoIcon className="h-12 w-12" />
              <LogoWordmark light />
            </div>

            {/* Headline */}
            <h2 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
              Smart assignment
              <br />
              management made simple
            </h2>
            <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-white/55">
              One platform for teachers to create and grade assignments, and
              students to submit and track results.
            </p>
          </div>

          {/* Feature list */}
          <div className="relative space-y-4">
            {[
              {
                icon: (
                  <ClipboardList className="h-[18px] w-[18px]" />
                ),
                text: "Create, publish and grade assignments with ease",
              },
              {
                icon: <Users className="h-[18px] w-[18px]" />,
                text: "Role-based access for admins, teachers and students",
              },
              {
                icon: (
                  <ShieldCheck className="h-[18px] w-[18px]" />
                ),
                text: "Secure authentication and data isolation by role",
              },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-start gap-3 text-[13px] leading-relaxed text-white/55"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#00A8B5]">
                  {item.icon}
                </span>
                <span className="pt-0.5">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- RIGHT PANEL: Login form --- */}
        <div className="relative p-8 md:p-10">
          {/* Mobile branding (hidden on desktop) */}
          <div className="mb-8 md:hidden">
            <div className="flex items-center gap-3">
              <LogoIcon className="h-10 w-10" />
              <LogoWordmark />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2537" }}>
            Welcome back
          </h1>
          <p className="mt-1.5 text-[14px] text-slate-500">
            Sign in to continue to your workspace
          </p>

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 5v3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="11" r="0.75" fill="currentColor" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-semibold" style={{ color: "#0F2537" }}
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="h-[48px] w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-[14px] text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.03)] outline-none ring-[#00A8B5]/15 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-[#00A8B5] focus:ring-[3px]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[13px] font-semibold" style={{ color: "#0F2537" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-[48px] w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-[14px] text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.03)] outline-none ring-brand-500/15 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-brand-400 focus:ring-[3px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex h-[48px] w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white shadow-[0_2px_4px_rgb(0_0_0/0.06),0_4px_12px_rgb(0_0_0/0.04),inset_0_1px_0_rgb(255_255_255/0.08)] outline-none ring-[#00A8B5]/20 transition-all duration-200 hover:shadow-[0_4px_8px_rgb(0_0_0/0.1),0_8px_20px_rgb(0_0_0/0.08)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(to bottom, #0F2537, #15324A)" }}
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="28"
                      strokeDashoffset="8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Demo access */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                quick demo access
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="space-y-1.5">
              {demoAccounts.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="group flex w-full items-center rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[12px] font-bold text-slate-600 group-hover:bg-brand-100 group-hover:text-brand-700">
                      {account.role[0]}
                    </span>
                    <span className="ml-3 flex-1">
                      <span className="text-[13px] font-semibold" style={{ color: "#0F2537" }}>
                        {account.role}
                      </span>
                      <span className="ml-1.5 text-[12px] text-slate-400">
                        demo
                      </span>
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-[#00A8B5]">
                      Autofill
                    </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bg-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>
    </main>
  );
}
