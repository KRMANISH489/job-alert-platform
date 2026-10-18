import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>CareerRise · roles, applications, and alerts in one place.</p>
        <div className="flex gap-4">
          <Link href="/jobs" className="hover:text-ink">
            Roles
          </Link>
          <Link href="/employers" className="hover:text-ink">
            Employers
          </Link>
          <Link href="/login" className="hover:text-ink">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
