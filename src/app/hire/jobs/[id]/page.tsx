import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Flash } from "@/components/flash";
import { JobForm } from "@/components/job-form";
import { Submit, fieldClass } from "@/components/ui";
import { ResumeSheet } from "@/components/resume-sheet";
import { APPLICATION_STATUSES, statusLabel } from "@/lib/constants";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { seekerProfileSelect } from "@/lib/profile";
import { buildResume, parseResume } from "@/lib/resume";
import { setApplicationStatusAction, updateJobAction } from "@/server/actions";

export const metadata: Metadata = { title: "Applicants" };

export default async function EmployerJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/login?next=/hire/jobs/${id}`);
  if (session.role !== "employer" || !session.companyId) redirect("/employers");

  const job = await prisma.job.findFirst({
    where: { id, companyId: session.companyId },
    include: {
      applications: {
        include: {
          user: { select: seekerProfileSelect },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <p className="text-sm text-muted">
        <Link href="/hire" className="hover:text-ink">
          Hiring
        </Link>
        <span> / {job.title}</span>
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl">{job.title}</h1>
        {job.status === "open" ? (
          <Link href={`/jobs/${job.slug}`} className="text-sm font-medium text-forest">
            View public page
          </Link>
        ) : (
          <p className="text-sm text-muted">Closed — hidden from the public board.</p>
        )}
      </div>
      <div className="mt-6">
        <Flash searchParams={query} />
      </div>

      <section className="mt-2">
        <h2 className="text-3xl">Applicants</h2>
        {job.applications.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No applications yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {job.applications.map((application) => {
              const resume = parseResume(application.resumeJson) ?? buildResume(application.user);
              return (
              <li key={application.id} className="rounded-3xl border border-line bg-cream p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-medium">{resume.name}</p>
                    <p className="text-sm text-muted">Applied {timeAgo(application.createdAt).toLowerCase()}</p>
                  </div>
                  <p className="text-sm">{statusLabel(application.status)}</p>
                </div>
                <ResumeSheet resume={resume} />
                <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">Note with the resume</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{application.note}</p>
                <form action={setApplicationStatusAction} className="mt-4 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="applicationId" value={application.id} />
                  <label htmlFor={`status-${application.id}`} className="sr-only">
                    Status for {application.user.name}
                  </label>
                  <select
                    id={`status-${application.id}`}
                    name="status"
                    defaultValue={application.status}
                    className={`${fieldClass} w-auto`}
                  >
                    {APPLICATION_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <Submit variant="ghost">Update status</Submit>
                </form>
              </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-3xl">Edit listing</h2>
        <JobForm action={updateJobAction} job={job} submitLabel="Save changes" showStatus />
      </section>
    </main>
  );
}

