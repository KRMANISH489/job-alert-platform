import Link from "next/link";
import { JobTile } from "@/components/job-tile";
import { Mark } from "@/components/mark";
import { btnPrimary } from "@/components/ui";
import { statusLabel } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { profileCompleteness } from "@/lib/profile";
import { getSeekerHome, type ApplicationCard, type JobCard, type SavedCard } from "@/lib/queries";

export async function SeekerHome({ tab }: { tab: "jobs" | "applies" | "saved" }) {
  const home = await getSeekerHome();
  const profile = home.profile;
  const applications: ApplicationCard[] = home.applications;
  const saved: SavedCard[] = home.saved;
  const recommended: JobCard[] = home.recommended;

  const { percent, missing } = profileCompleteness(profile);
  const openSaved = saved.filter((item) => item.job.status === "open");
  const tabs = [
    { id: "jobs" as const, label: `For you (${recommended.length})` },
    { id: "applies" as const, label: `Applies (${applications.length})` },
    { id: "saved" as const, label: `Saved (${openSaved.length})` },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">My home</p>
      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-line bg-cream p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Mark name={profile.name} size="lg" />
              <span className="absolute -bottom-1 -right-2 rounded-full bg-rise px-1.5 py-0.5 text-[10px] font-medium text-ink">
                {percent}%
              </span>
            </div>
            <div>
              <h1 className="text-2xl leading-tight">{profile.name}</h1>
              <p className="text-sm text-muted">Profile {percent}% complete</p>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-deep">
            <div className="h-full rounded-full bg-rise" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-4 font-medium">{profile.headline || "Add your current role"}</p>
          <p className="text-sm text-muted">
            {profile.currentCompany || "Add your company"}
            {profile.location ? ` · ${profile.location}` : ""}
          </p>
          {profile.resumeHeadline ? <p className="mt-3 text-sm leading-6">{profile.resumeHeadline}</p> : null}
          <Link href="/profile" className={`${btnPrimary} mt-5 w-full`}>
            View profile
          </Link>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">Applies</dt>
              <dd className="mt-1 text-xl font-medium">{applications.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">Skills</dt>
              <dd className="mt-1 text-xl font-medium">{profile.skills.length}</dd>
            </div>
          </dl>
          {missing[0] ? (
            <p className="mt-4 text-sm text-muted">
              Next: add your {missing[0]}. Companies see this on the resume you send.
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted">Your full resume goes to the company when you apply.</p>
          )}
          <Link href="/account" className="mt-3 inline-block text-sm font-medium text-forest">
            Alerts and saved roles
          </Link>
        </aside>

        <section>
          <div className="flex gap-2 overflow-x-auto border-b border-line">
            {tabs.map((item) => (
              <Link
                key={item.id}
                href={item.id === "jobs" ? "/" : `/?tab=${item.id}`}
                className={
                  tab === item.id
                    ? "shrink-0 border-b-2 border-forest px-3 py-2 text-sm font-medium"
                    : "shrink-0 px-3 py-2 text-sm text-muted hover:text-ink"
                }
              >
                {item.label}
              </Link>
            ))}
          </div>

          {tab === "jobs" ? (
            <div className="mt-5">
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="text-3xl">Recommended jobs</h2>
                <Link href="/jobs" className="text-sm font-medium text-forest">
                  View all
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {recommended.map((job) => (
                  <JobTile key={job.id} job={job} />
                ))}
              </div>
            </div>
          ) : null}

          {tab === "applies" ? (
            <div className="mt-5">
              <h2 className="text-3xl">Your applications</h2>
              {applications.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  You have not applied yet. Open a recommended role and send your resume.
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
            </div>
          ) : null}

          {tab === "saved" ? (
            <div className="mt-5">
              <h2 className="text-3xl">Saved roles</h2>
              {openSaved.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Save a role from its page. It stays here.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {openSaved.map((item) => (
                    <JobTile key={item.jobId} job={item.job} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
