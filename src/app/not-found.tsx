import Link from "next/link";
import { btnPrimary } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-20">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">404</p>
      <h1 className="mt-3 text-4xl">That page isn&apos;t on the board.</h1>
      <p className="mt-3 text-muted">The role may have closed, or the link is out of date.</p>
      <Link href="/jobs" className={`${btnPrimary} mt-6`}>
        Browse open roles
      </Link>
    </main>
  );
}
