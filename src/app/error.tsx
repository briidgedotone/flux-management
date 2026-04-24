"use client";

// Global error boundary — generic message, no internal details [R18]

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-[#F5F6F8]">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-6xl font-bold text-danger/20">!</span>
        <h1 className="font-[family-name:var(--font-aptos)] text-xl font-semibold text-text-primary">
          Something went wrong
        </h1>
        <p className="max-w-md text-sm text-text-secondary">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={reset}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue px-5 h-10 text-sm font-medium text-white hover:bg-blue-light transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
