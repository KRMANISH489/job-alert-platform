import type { Metadata } from "next";
import Link from "next/link";
import { Filters } from "@/components/filters";
import { JobRow } from "@/components/job-row";
import { CITIES, readFilters } from "@/lib/constants";
import { listJobs } from "@/lib/queries";

export const metadata: Metadata = { title: "Open roles" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = readFilters(params);
  const jobs = await listJobs(filters);
  const active = Object.values(filters).some(Boolean);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl">Open roles</h1>
        <p className="mt-3 text-lg text-muted">
          {jobs.length} {jobs.length === 1 ? "role" : "roles"}
          {active ? " match this search." : " on the board."}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {CITIES.map((city) => (
          <Link
            key={city}
            href={`/jobs?location=${encodeURIComponent(city)}`}
            className="rounded-full border border-line bg-cream px-3 py-1 text-xs hover:border-forest"
          >
            {city}
          </Link>
        ))}
      </div>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[260px_1fr]">
        <Filters filters={filters} />
        <div className="overflow-hidden rounded-3xl border border-line bg-cream">
          {jobs.length === 0 ? (
            <div className="px-5 py-12">
              <p className="text-lg">No roles match that search.</p>
              <p className="mt-2 text-sm text-muted">Try a city, a skill, or clear the filters.</p>
              <Link href="/jobs" className="mt-4 inline-block text-sm font-medium text-forest">
                Show every open role
              </Link>
            </div>
          ) : (
            jobs.map((job) => <JobRow key={job.id} job={job} />)
          )}
        </div>
      </div>
    </main>
  );
}
