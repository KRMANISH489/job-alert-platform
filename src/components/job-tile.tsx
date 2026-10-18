import Link from "next/link";
import { Mark } from "@/components/mark";
import { WORKPLACES, labelOf } from "@/lib/constants";
import { formatSalary, timeAgo } from "@/lib/format";
import type { JobCard } from "@/lib/queries";

export function JobTile({ job }: { job: JobCard }) {
  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="flex h-full flex-col rounded-3xl border border-line bg-cream p-4 transition hover:border-forest"
    >
      <span className="flex items-start justify-between gap-3">
        <Mark name={job.company.name} />
        <span className="text-xs text-muted">{timeAgo(job.createdAt)}</span>
      </span>
      <span className="mt-4 font-medium leading-snug">{job.title}</span>
      <span className="mt-1 text-sm text-muted">{job.company.name}</span>
      <span className="mt-3 text-sm">
        {job.location} · {labelOf(WORKPLACES, job.workplace)}
      </span>
      <span className="mt-1 text-sm font-medium">{formatSalary(job.salaryMin, job.salaryMax)}</span>
      {job.hrPhone ? <span className="mt-3 text-xs font-medium text-forest">HR {job.hrPhone}</span> : null}
    </Link>
  );
}
