import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/flash";
import { Mark } from "@/components/mark";
import { Submit, btnGhost, fieldClass } from "@/components/ui";
import { EXPERIENCE, JOB_TYPES, WORKPLACES, labelOf, statusLabel } from "@/lib/constants";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatSalary, lines, paragraphs, timeAgo } from "@/lib/format";
import { seekerProfileSelect } from "@/lib/profile";
import { getOpenJob } from "@/lib/queries";
import { hasCallablePhone, telHref } from "@/lib/resume";
import { applyAction, saveJobAction, unsaveJobAction } from "@/server/actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getOpenJob(slug);
  if (!job) return { title: "Role not found" };
  return {
    title: `${job.title} at ${job.company.name}`,
    description: job.description.slice(0, 160),
  };
}

export default async function JobPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const [job, session] = await Promise.all([getOpenJob(slug), getSession()]);
  if (!job) notFound();

  const seekerId = session?.role === "seeker" ? session.id : null;
  const [application, saved, profile] = await Promise.all([
    seekerId
      ? prisma.application.findUnique({
          where: { jobId_userId: { jobId: job.id, userId: seekerId } },
        })
      : null,
    seekerId
      ? prisma.savedJob.findUnique({
          where: { userId_jobId: { userId: seekerId, jobId: job.id } },
        })
      : null,
    seekerId
      ? prisma.user.findUnique({
          where: { id: seekerId },
          select: seekerProfileSelect,
        })
      : null,
  ]);
  const hrPhoneLink = telHref(job.hrPhone);

  const facts = [
    ["Location", `${job.location} · ${labelOf(WORKPLACES, job.workplace)}`],
    ["Type", labelOf(JOB_TYPES, job.type)],
    ["Experience", labelOf(EXPERIENCE, job.experience)],
    ["Category", job.category],
    ["Pay", formatSalary(job.salaryMin, job.salaryMax)],
    ["Posted", timeAgo(job.createdAt)],
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <p className="text-sm text-muted">
        <Link href="/jobs" className="hover:text-ink">
          Roles
        </Link>
        <span> / {job.category}</span>
      </p>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article>
          <div className="flex items-start gap-4">
            <Mark name={job.company.name} size="lg" />
            <div>
              <h1 className="text-4xl leading-tight md:text-5xl">{job.title}</h1>
              <p className="mt-2 text-muted">
                <Link href={`/companies/${job.company.slug}`} className="font-medium text-ink hover:text-forest">
                  {job.company.name}
                </Link>
                {job.company.location ? ` · ${job.company.location}` : ""}
              </p>
              {job.hrPhone ? (
                <p className="mt-2 text-sm">
                  HR {job.hrName ? `${job.hrName} · ` : ""}
                  {hrPhoneLink ? (
                    <a href={hrPhoneLink} className="font-medium text-forest">
                      {job.hrPhone}
                    </a>
                  ) : (
                    job.hrPhone
                  )}
                </p>
              ) : null}
            </div>
          </div>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-cream px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
                <dd className="mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 space-y-4 text-[15px] leading-7">
            {paragraphs(job.description).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <h2 className="mt-10 text-2xl">What you&apos;ll need</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {lines(job.requirements).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Flash searchParams={query} />
          {job.hrPhone || job.hrName ? (
            <div className="rounded-3xl border border-line bg-cream p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">HR contact</p>
              <h2 className="mt-1 text-2xl">{job.hrName || "Recruiter"}</h2>
              <p className="text-sm text-muted">{job.company.name}</p>
              {hrPhoneLink ? (
                <a href={hrPhoneLink} className="mt-3 block text-lg font-medium text-forest">
                  {job.hrPhone}
                </a>
              ) : null}
              {job.hrEmail ? (
                <a href={`mailto:${job.hrEmail}`} className="mt-1 block text-sm text-forest">
                  {job.hrEmail}
                </a>
              ) : null}
            </div>
          ) : null}
          <div className="rounded-3xl border border-line bg-cream p-5">
            <h2 className="text-2xl">Apply</h2>
            {!session ? (
              <>
                <p className="mt-2 text-sm text-muted">Sign in to send a note with your profile.</p>
                <Link href={`/login?next=/jobs/${job.slug}`} className={`${btnGhost} mt-4 w-full`}>
                  Sign in to apply
                </Link>
              </>
            ) : session.role !== "seeker" ? (
              <p className="mt-2 text-sm text-muted">
                {session.companyId === job.companyId
                  ? "This is your listing."
                  : "Applications are sent from job seeker accounts."}
              </p>
            ) : application ? (
              <p className="mt-3 text-sm">
                You applied {timeAgo(application.createdAt).toLowerCase()}. Status:{" "}
                <span className="font-medium">{statusLabel(application.status)}</span>
              </p>
            ) : profile && hasCallablePhone(profile.phone) ? (
              <form action={applyAction} className="mt-3 space-y-3">
                <input type="hidden" name="slug" value={job.slug} />
                <label htmlFor="note" className="block text-sm font-medium">
                  Note to the team
                </label>
                <textarea
                  id="note"
                  name="note"
                  required
                  minLength={20}
                  placeholder="Two or three lines on why this role fits. A portfolio or profile link helps."
                  className={`${fieldClass} min-h-32 resize-y`}
                />
                <p className="text-xs leading-5 text-muted">
                  The company keeps a full copy of your resume: {profile.phone}, {profile.email},{" "}
                  {profile.skills.length} {profile.skills.length === 1 ? "skill" : "skills"},{" "}
                  {profile.employments.length} {profile.employments.length === 1 ? "job" : "jobs"}, and{" "}
                  {profile.educations.length} {profile.educations.length === 1 ? "qualification" : "qualifications"}.{" "}
                  <Link href="/profile" className="font-medium text-forest">
                    Update profile
                  </Link>
                </p>
                <Submit>Send resume</Submit>
              </form>
            ) : (
              <>
                <p className="mt-3 text-sm text-muted">
                  Add your phone number on your profile. It goes to the company with the rest of your resume.
                </p>
                <Link href="/profile" className={`${btnGhost} mt-4 w-full`}>
                  Add phone number
                </Link>
              </>
            )}
            {session?.companyId === job.companyId ? (
              <Link href={`/hire/jobs/${job.id}`} className={`${btnGhost} mt-3 w-full`}>
                View applicants
              </Link>
            ) : null}
            <div className="mt-4 border-t border-line pt-4">
              {!session ? (
                <Link href={`/login?next=/jobs/${job.slug}`} className="text-sm text-muted hover:text-ink">
                  Save this role
                </Link>
              ) : session.role === "seeker" && saved ? (
                <form action={unsaveJobAction}>
                  <input type="hidden" name="slug" value={job.slug} />
                  <button type="submit" className="text-sm font-medium text-forest">
                    Saved · remove
                  </button>
                </form>
              ) : session.role === "seeker" ? (
                <form action={saveJobAction}>
                  <input type="hidden" name="slug" value={job.slug} />
                  <button type="submit" className="text-sm text-muted hover:text-ink">
                    Save this role
                  </button>
                </form>
              ) : null}
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-cream p-5">
            <h2 className="text-2xl">{job.company.name}</h2>
            {job.company.about ? <p className="mt-2 text-sm leading-6 text-muted">{job.company.about}</p> : null}
            <Link href={`/companies/${job.company.slug}`} className="mt-3 inline-block text-sm font-medium text-forest">
              More about the company
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
