import Link from "next/link";
import { JobTile } from "@/components/job-tile";
import { SeekerHome } from "@/components/seeker-home";
import { btnPrimary } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";
import { getSession } from "@/lib/auth";
import { getBoard } from "@/lib/queries";

export async function generateMetadata() {
  const session = await getSession();
  if (session?.role === "seeker") return { title: { absolute: "My home · CareerRise" } };
  return { title: { absolute: "CareerRise — Work worth showing up for" } };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  if (session?.role === "seeker") {
    const tab = params.tab === "applies" || params.tab === "saved" ? params.tab : "jobs";
    return <SeekerHome tab={tab} />;
  }

  const board = await getBoard();
  const countByCategory = new Map(board.categories.map((row) => [row.category, row.count]));

  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-copper">India and remote</p>
          <h1 className="mt-3 max-w-3xl text-5xl leading-[1.02] md:text-6xl">Find a role. Send the resume they actually read.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Open jobs show the HR number. When you apply, the company keeps your full profile: phone, skills, jobs, and education.
          </p>
          <form action="/jobs" className="mt-8 grid gap-2 rounded-3xl border border-line bg-cream p-2 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label htmlFor="home-q" className="sr-only">
                Role, skill, or company
              </label>
              <input
                id="home-q"
                name="q"
                placeholder="Role, skill, or company"
                className="w-full rounded-2xl bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted"
              />
            </div>
            <div className="sm:border-l sm:border-line">
              <label htmlFor="home-location" className="sr-only">
                City or remote
              </label>
              <input
                id="home-location"
                name="location"
                placeholder="City or Remote"
                className="w-full rounded-2xl bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted"
              />
            </div>
            <button type="submit" className={btnPrimary}>
              Search roles
            </button>
          </form>
          <p className="mt-4 text-sm text-muted">
            {board.openCount} open roles · {board.companyCount} companies
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex gap-2 overflow-x-auto pb-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/jobs?category=${encodeURIComponent(category)}`}
              className="shrink-0 rounded-full border border-line bg-cream px-3 py-1.5 text-sm hover:border-forest"
            >
              {category}
              <span className="ml-2 text-muted">{countByCategory.get(category) ?? 0}</span>
            </Link>
          ))}
        </div>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-3xl">Open roles</h2>
          <Link href="/jobs" className="text-sm font-medium text-forest">
            View all
          </Link>
        </div>
        {board.latest.length === 0 ? (
          <p className="text-muted">Roles will show up here once companies post them.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {board.latest.map((job) => (
              <JobTile key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-14 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-cream p-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">Applicants</p>
          <h2 className="mt-3 text-3xl">Your home shows the jobs that fit.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Sign in and the board becomes your profile, your applications, and roles matched to your skills.
          </p>
          <Link href="/login" className={`${btnPrimary} mt-6`}>
            Open my home
          </Link>
        </div>
        <div className="rounded-3xl bg-rise p-6 text-ink">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink/70">Companies</p>
          <h2 className="mt-3 text-3xl">Post only after the main admin allows it.</h2>
          <p className="mt-3 text-sm leading-6 text-ink/80">
            A secondary admin receives the full resume, including the candidate&apos;s phone number.
          </p>
          <Link href="/employers" className="mt-6 inline-flex rounded-full bg-cream px-4 py-2.5 text-sm font-medium text-forest">
            Hire on CareerRise
          </Link>
        </div>
      </section>
    </main>
  );
}
