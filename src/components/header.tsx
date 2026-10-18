import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { homeFor } from "@/lib/auth";
import { logoutAction } from "@/server/actions";
import { Logo } from "@/components/logo";
import { btnPrimary } from "@/components/ui";

function Nav({ session, className }: { session: SessionUser | null; className: string }) {
  const desk =
    session?.role === "employer" ? "Secondary admin" : session?.role === "admin" ? "Main admin" : "My home";

  return (
    <nav className={className}>
      <Link href="/jobs" className="text-sm hover:text-forest">
        Roles
      </Link>
      <Link href="/employers" className="text-sm hover:text-forest">
        For employers
      </Link>
      {session ? (
        <>
          {session.role === "seeker" ? (
            <Link href="/profile" className="text-sm font-medium hover:text-forest">
              Profile
            </Link>
          ) : null}
          <Link href={homeFor(session.role)} className="text-sm font-medium hover:text-forest">
            {desk}
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-muted hover:text-ink">
              Sign out
            </button>
          </form>
        </>
      ) : (
        <>
          <Link href="/login" className="text-sm hover:text-forest">
            Sign in
          </Link>
          <Link href="/signup?role=employer" className={btnPrimary}>
            Post a role
          </Link>
        </>
      )}
    </nav>
  );
}

export function Header({ session }: { session: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="h-1 bg-rise" />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-40 focus:rounded-full focus:bg-cream focus:px-3 focus:py-2">
          Skip to content
        </a>
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="h-14 w-11" />
          <span className="font-serif text-2xl tracking-tight">CareerRise</span>
        </Link>
        <Nav session={session} className="hidden items-center gap-5 md:flex" />
        <details className="relative md:hidden">
          <summary className="cursor-pointer list-none rounded-full border border-line bg-cream px-3 py-1.5 text-sm">
            Menu
          </summary>
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-2xl border border-line bg-cream p-4 shadow-lg">
            <Nav session={session} className="flex flex-col items-start gap-3" />
          </div>
        </details>
      </div>
    </header>
  );
}
