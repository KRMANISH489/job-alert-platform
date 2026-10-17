import type { Metadata } from "next";
import Link from "next/link";
import { btnPrimary } from "@/components/ui";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "For employers" };

const points = [
  {
    title: "Live as soon as you publish",
    body: "A listing needs a title, a location, what the work is, and who it is for. That is enough to go on the board.",
  },
  {
    title: "Applications come with a note",
    body: "People write why they fit. You also see their headline, city, and bio — not an empty file drop.",
  },
  {
    title: "You decide who moves forward",
    body: "Mark an applicant as reviewing, shortlisted, or not moving forward. They see that status on their desk.",
  },
];

export default async function EmployersPage() {
  const session = await getSession();
  const hiring = session?.role === "employer";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-14">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-copper">For employers</p>
      <h1 className="mt-4 max-w-2xl text-5xl leading-[1.05] md:text-6xl">Hire without the noise.</h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        JobAlert is a plain board for real roles. Post one, read the notes, and keep the people you want to talk to.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {hiring ? (
          <Link href="/hire" className={btnPrimary}>
            Go to your hiring desk
          </Link>
        ) : (
          <Link href="/signup?role=employer" className={btnPrimary}>
            Create a hiring account
          </Link>
        )}
        <Link href="/jobs" className="inline-flex items-center text-sm font-medium text-forest">
          See the public board
        </Link>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {points.map((point, index) => (
          <article key={point.title} className="rounded-3xl border border-line bg-cream p-5">
            <p className="font-serif text-2xl text-copper">0{index + 1}</p>
            <h2 className="mt-3 text-2xl">{point.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{point.body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
