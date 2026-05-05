"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { FluxLogo } from "@/components/shared/flux-logo";

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Authentication failed. Please try again.",
  access_denied: "You do not have access to the management portal.",
  account_disabled: "Your account has been deactivated. Contact an administrator.",
  rate_limited: "Too many login attempts. Please wait a moment.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const testLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN;
  const isDev = testLoginEnabled === "true" || process.env.NODE_ENV === "development";

  const handleSSO = () => {
    window.location.href = "/api/auth/login";
  };

  const handleDevLogin = (email?: string) => {
    const url = email
      ? `/api/auth/dev-login?email=${encodeURIComponent(email)}`
      : "/api/auth/dev-login";
    window.location.href = url;
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

          {/* Error message */}
          {error && ERROR_MESSAGES[error] && (
            <div className="mb-6 p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
              {ERROR_MESSAGES[error]}
            </div>
          )}

          {/* SSO Button */}
          <button
            onClick={handleSSO}
            className="w-full h-12 bg-blue hover:bg-blue-light text-white font-medium text-sm rounded-xl btn-premium shadow-level-1 flex items-center justify-center gap-2 transition-colors duration-150"
          >
            Sign in with Microsoft SSO
            <ArrowRightIcon size={16} weight="light" />
          </button>

          <p className="text-xs text-text-muted text-center mt-6">
            Access restricted to Flux Technologies team members.
          </p>

          {/* Dev login bypass — development only */}
          {isDev && (
            <div className="mt-8 pt-6 border-t border-ice">
              <p className="text-xs text-text-muted mb-3 font-medium uppercase tracking-wider">Dev Login (local only)</p>
              <div className="space-y-2">
                <button
                  onClick={() => handleDevLogin()}
                  className="w-full h-10 bg-navy/10 hover:bg-navy/20 text-navy text-sm rounded-xl transition-colors"
                >
                  Brandon Devier (Co-CEO)
                </button>
                <button
                  onClick={() => handleDevLogin("zack@fluxtech.com")}
                  className="w-full h-10 bg-navy/10 hover:bg-navy/20 text-navy text-sm rounded-xl transition-colors"
                >
                  Zack Devier (Co-CEO)
                </button>
                <button
                  onClick={() => handleDevLogin("cameron@fluxtech.com")}
                  className="w-full h-10 bg-navy/10 hover:bg-navy/20 text-navy text-sm rounded-xl transition-colors"
                >
                  Cameron (Employee)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
