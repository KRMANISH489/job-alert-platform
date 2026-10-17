import Link from "next/link";
import { EXPERIENCE, JOB_TYPES, WORKPLACES, labelOf } from "@/lib/constants";
import { formatSalary, timeAgo } from "@/lib/format";
import type { JobCard } from "@/lib/queries";
import { Mark } from "@/components/mark";

export function JobRow({ job }: { job: JobCard }) {
  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="grid gap-3 border-b border-line px-4 py-4 transition hover:bg-cream sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5"
    >
      <Mark name={job.company.name} />
      <span>
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{job.title}</span>
          {job.featured ? (
            <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-copper">
              Featured
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-sm text-muted">
          {job.company.name} · {job.location} · {labelOf(WORKPLACES, job.workplace)}
        </span>
        {job.hrPhone ? (
          <span className="mt-1 block text-sm text-forest">
            HR {job.hrName ? `${job.hrName} · ` : ""}
            {job.hrPhone}
          </span>
        ) : null}
        <span className="mt-2 flex flex-wrap gap-1.5 text-xs text-ink">
          {[labelOf(JOB_TYPES, job.type), labelOf(EXPERIENCE, job.experience), job.category].map((item) => (
            <span key={item} className="rounded-full border border-line bg-paper px-2 py-0.5">
              {item}
            </span>
          ))}
        </span>
      </span>
      <span className="text-sm sm:text-right">
        <span className="block font-medium">{formatSalary(job.salaryMin, job.salaryMax)}</span>
        <span className="mt-1 block text-muted">{timeAgo(job.createdAt)}</span>
      </span>
    </Link>
  );
}
