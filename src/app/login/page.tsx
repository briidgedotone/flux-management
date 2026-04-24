"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { FluxLogo } from "@/components/shared/flux-logo";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  const handleSSO = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Brand Panel (55%) */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-navy via-navy to-navy-95 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <FluxLogo size={40} className="text-white" />
            <div>
              <span className="font-[family-name:var(--font-aptos)] font-bold text-xl tracking-[0.18em] text-white block">
                FLUX
              </span>
              <span className="text-[10px] tracking-[0.2em] text-text-on-dark-muted">
                TECHNOLOGIES
              </span>
            </div>
          </div>
          <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[44px] leading-[52px] tracking-[-0.03em] text-white mb-4">
            Management<br />Command Center
          </h1>
          <p className="text-lg text-text-on-dark-muted max-w-md">
            Oversee clients, teams, tickets, and projects from a single dashboard.
          </p>
        </div>
        <p className="text-sm text-text-on-dark-muted">
          &copy; {new Date().getFullYear()} Flux Technologies. All rights reserved.
        </p>
      </div>

      {/* Right: Login Form (45%) */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F5F6F8]">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <FluxLogo size={32} className="text-navy" />
            <span className="font-[family-name:var(--font-aptos)] font-bold text-lg tracking-[0.15em] text-navy">FLUX</span>
          </div>

          <h2 className="font-[family-name:var(--font-aptos)] font-bold text-[32px] tracking-[-0.02em] text-text-primary mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-text-secondary mb-8">
            Sign in to your management portal
          </p>

          {/* SSO Button */}
          <button
            onClick={handleSSO}
            className="w-full h-12 bg-blue hover:bg-blue-light text-white font-medium text-sm rounded-xl btn-premium shadow-level-1 flex items-center justify-center gap-2 transition-colors duration-150 mb-6"
          >
            Sign in with Microsoft SSO
            <ArrowRightIcon size={16} weight="light" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-ice" />
            <span className="text-xs text-text-muted">or continue with email</span>
            <div className="flex-1 border-t border-ice" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@company.com"
                className="w-full h-12 bg-white border border-ice/60 rounded-xl shadow-level-1 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue focus:ring-2 focus:ring-blue-10 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 bg-white border border-ice/60 rounded-xl shadow-level-1 px-3 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:border-blue focus:ring-2 focus:ring-blue-10 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeSlashIcon size={18} weight="light" /> : <EyeIcon size={18} weight="light" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-ice text-blue focus:ring-blue" />
                <span className="text-xs text-text-secondary">Remember me</span>
              </label>
              <button type="button" className="text-xs text-blue hover:underline">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-navy hover:bg-navy-80 text-white font-medium text-sm rounded-xl shadow-level-1 transition-colors duration-150"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
