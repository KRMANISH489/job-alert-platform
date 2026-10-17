import Link from "next/link";
import { JobRow } from "@/components/job-row";
import { btnPrimary } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";
import { formatSalary } from "@/lib/format";
import { prisma } from "@/lib/db";
import { jobCardInclude } from "@/lib/queries";

export const metadata = {
  title: { absolute: "JobAlert — Work worth showing up for" },
};

export default async function HomePage() {
  const [openCount, companyCount, cityRows, featured, latest, categoryCounts] = await Promise.all([
    prisma.job.count({ where: { status: "open" } }),
    prisma.company.count(),
    prisma.job.findMany({
      where: { status: "open" },
      select: { location: true },
      distinct: ["location"],
    }),
    prisma.job.findMany({
      where: { status: "open", featured: true },
      include: jobCardInclude,
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.job.findMany({
      where: { status: "open" },
      include: jobCardInclude,
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.job.groupBy({
      by: ["category"],
      where: { status: "open" },
      _count: { _all: true },
    }),
  ]);

  const countByCategory = new Map(categoryCounts.map((row) => [row.category, row._count._all]));

  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.15fr_0.85fr] md:py-20">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-copper">India and remote</p>
            <h1 className="mt-4 max-w-xl text-5xl leading-[1.05] md:text-6xl">Work worth showing up for.</h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              Search open roles, apply with a short note, and keep an alert for the kind of work you actually want.
            </p>
            <form action="/jobs" className="mt-8 grid gap-2 rounded-2xl border border-line bg-cream p-2 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label htmlFor="home-q" className="sr-only">
                  Role, skill, or company
                </label>
                <input
                  id="home-q"
                  name="q"
                  placeholder="Role, skill, or company"
                  className="w-full rounded-xl px-3 py-3 text-sm outline-none placeholder:text-muted"
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
                  className="w-full rounded-xl px-3 py-3 text-sm outline-none placeholder:text-muted"
                />
              </div>
              <button type="submit" className={btnPrimary}>
                Search roles
              </button>
            </form>
            <p className="mt-4 text-sm text-muted">
              {openCount} open roles · {companyCount} companies · {cityRows.length} locations
            </p>
          </div>
          <aside className="rounded-3xl border border-line bg-cream p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Featured</p>
            <ul className="mt-4 divide-y divide-line">
              {featured.length === 0 ? (
                <li className="text-sm text-muted">Featured roles will show up here.</li>
              ) : (
                featured.map((job) => (
                  <li key={job.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/jobs/${job.slug}`} className="block hover:text-forest">
                      <span className="block text-xs text-muted">{job.company.name}</span>
                      <span className="mt-0.5 block font-medium">{job.title}</span>
                      <span className="mt-1 block text-sm text-muted">
                        {job.location} · {formatSalary(job.salaryMin, job.salaryMax)}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
            <Link href="/jobs" className="mt-4 inline-block text-sm font-medium text-forest">
              Browse the full board
            </Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
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
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-4">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-3xl">Fresh roles</h2>
          <Link href="/jobs" className="text-sm font-medium text-forest">
            See all
          </Link>
        </div>
        <div className="overflow-hidden rounded-3xl border border-line bg-cream">
          {latest.length === 0 ? (
            <p className="px-4 py-10 text-muted">Roles will show up here once companies post them.</p>
          ) : (
            latest.map((job) => <JobRow key={job.id} job={job} />)
          )}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-12 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-cream p-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">Looking</p>
          <h2 className="mt-3 text-3xl">A desk for your search.</h2>
          <ol className="mt-5 space-y-3 text-sm">
            <li>1. Make a profile with a headline and a short bio.</li>
            <li>2. Apply with a note the hiring team will actually read.</li>
            <li>3. Save an alert. Matching open roles stay on your desk.</li>
          </ol>
          <Link href="/signup" className={`${btnPrimary} mt-6`}>
            Create a free account
          </Link>
        </div>
        <div className="rounded-3xl bg-forest p-6 text-cream">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#d7c4ae]">Hiring</p>
          <h2 className="mt-3 text-3xl text-cream">Put a role in front of people who are looking.</h2>
          <p className="mt-4 max-w-md text-sm text-[#efe6da]">
            Post in a few minutes. Applications arrive with a note and a profile, and you decide who moves forward.
          </p>
          <Link href="/employers" className="mt-6 inline-flex rounded-full bg-cream px-4 py-2.5 text-sm font-medium text-forest">
            Hire on JobAlert
          </Link>
        </div>
      </section>
    </main>
  );
}
