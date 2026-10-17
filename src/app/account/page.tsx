import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/flash";
import { JobRow } from "@/components/job-row";
import { ProfileStrength } from "@/components/seeker-profile";
import { Field, Submit, fieldClass } from "@/components/ui";
import { CATEGORIES, statusLabel } from "@/lib/constants";
import { getSession, homeFor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { seekerProfileSelect } from "@/lib/profile";
import { jobsForAlert } from "@/lib/queries";
import { createAlertAction, deleteAlertAction, unsaveJobAction } from "@/server/actions";

export const metadata: Metadata = { title: "Your desk" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  if (session.role !== "seeker") redirect(homeFor(session.role));

  const params = await searchParams;
  const [profile, applications, saved, alerts] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.id },
      select: seekerProfileSelect,
    }),
    prisma.application.findMany({
      where: { userId: session.id },
      include: { job: { include: { company: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedJob.findMany({
      where: { userId: session.id },
      include: { job: { include: { company: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobAlert.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const matches = await Promise.all(alerts.map((alert) => jobsForAlert(alert)));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-4xl md:text-5xl">Your desk</h1>
      <p className="mt-3 text-muted">Signed in as {profile.email}</p>
      <div className="mt-6">
        <Flash searchParams={params} />
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ProfileStrength profile={profile} />

        <div className="space-y-10">
          <section>
            <h2 className="text-3xl">Alerts</h2>
            <p className="mt-2 text-sm text-muted">We match these against roles that are open right now.</p>
            <form action={createAlertAction} className="mt-4 grid gap-3 rounded-3xl border border-line bg-cream p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
              <Field label="Keyword" htmlFor="keyword">
                <input id="keyword" name="keyword" required placeholder="Design" className={fieldClass} />
              </Field>
              <Field label="City" htmlFor="alert-location">
                <input id="alert-location" name="location" placeholder="Pune" className={fieldClass} />
              </Field>
              <Field label="Category" htmlFor="alert-category">
                <select id="alert-category" name="category" defaultValue="" className={fieldClass}>
                  <option value="">Any</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
              <Submit>Save alert</Submit>
            </form>
            <div className="mt-4 space-y-4">
              {alerts.length === 0 ? <p className="text-sm text-muted">No alerts yet.</p> : null}
              {alerts.map((alert, index) => (
                <article key={alert.id} className="rounded-3xl border border-line bg-cream p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">
                      {alert.keyword}
                      {alert.location ? ` · ${alert.location}` : ""}
                      {alert.category ? ` · ${alert.category}` : ""}
                    </p>
                    <form action={deleteAlertAction}>
                      <input type="hidden" name="id" value={alert.id} />
                      <button type="submit" className="text-sm text-muted hover:text-ink">
                        Remove
                      </button>
                    </form>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-line">
                    {matches[index]?.length ? (
                      matches[index].map((job) => <JobRow key={job.id} job={job} />)
                    ) : (
                      <p className="px-4 py-4 text-sm text-muted">Nothing open matches this yet.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl">Applications</h2>
            {applications.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                You haven&apos;t applied yet.{" "}
                <Link href="/jobs" className="font-medium text-forest">
                  Browse roles
                </Link>
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-cream">
                {applications.map((application) => (
                  <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                    <div>
                      <Link href={`/jobs/${application.job.slug}`} className="font-medium hover:text-forest">
                        {application.job.title}
                      </Link>
                      <p className="text-sm text-muted">
                        {application.job.company.name} · {timeAgo(application.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-paper-deep px-2.5 py-1 text-xs font-medium">
                      {statusLabel(application.status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-3xl">Saved</h2>
            {saved.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Saved roles stay here.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {saved.map((item) => (
                  <li key={item.jobId} className="overflow-hidden rounded-3xl border border-line bg-cream">
                    {item.job.status === "open" ? (
                      <JobRow job={item.job} />
                    ) : (
                      <p className="px-4 py-4 text-sm">
                        {item.job.title} at {item.job.company.name} is no longer open.
                      </p>
                    )}
                    <form action={unsaveJobAction} className="border-t border-line px-4 py-2">
                      <input type="hidden" name="slug" value={item.job.slug} />
                      <input type="hidden" name="returnTo" value="/account" />
                      <button type="submit" className="text-sm text-muted hover:text-ink">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
