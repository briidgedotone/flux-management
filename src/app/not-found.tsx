import Link from "next/link";

// Global 404 page — generic message, no internal details [R18]

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-[#F5F6F8]">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-6xl font-bold text-blue/20">404</span>
        <h1 className="font-[family-name:var(--font-aptos)] text-xl font-semibold text-text-primary">
          Page not found
        </h1>
        <p className="max-w-md text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue px-5 h-10 text-sm font-medium text-white hover:bg-blue-light transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
