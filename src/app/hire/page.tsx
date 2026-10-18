import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/flash";
import { Field, Submit, btnPrimary, fieldClass } from "@/components/ui";
import { COMPANY_SIZES } from "@/lib/constants";
import { getSession } from "@/lib/auth";
import { formatSalary, timeAgo } from "@/lib/format";
import { getHireHome } from "@/lib/queries";
import { updateCompanyAction } from "@/server/actions";

export const metadata: Metadata = { title: "Hiring" };

export default async function HirePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/hire");
  if (session.role !== "employer" || !session.companyId) redirect("/employers");

  const params = await searchParams;
  const { company, jobs } = await getHireHome();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">Secondary admin</p>
          <h1 className="mt-2 text-4xl md:text-5xl">{company.name}</h1>
          <p className="mt-3 text-muted">
            {company.approved
              ? "The main admin has allowed this company to post jobs. Review the resumes people send."
              : "Waiting for the main admin. Job posts stay locked until that access is given."}
          </p>
        </div>
        {company.approved ? (
          <Link href="/hire/new" className={btnPrimary}>
            Post a role
          </Link>
        ) : null}
      </div>
      <div className="mt-6">
        <Flash searchParams={params} />
      </div>

      <details open={!company.about} className="mt-2 rounded-3xl border border-line bg-cream p-5">
        <summary className="cursor-pointer text-lg">Company profile</summary>
        <form action={updateCompanyAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Company name" htmlFor="company-name">
            <input id="company-name" name="name" required defaultValue={company.name} className={fieldClass} />
          </Field>
          <Field label="Website" htmlFor="website">
            <input id="website" name="website" defaultValue={company.website} placeholder="https://" className={fieldClass} />
          </Field>
          <Field label="Location" htmlFor="company-location">
            <input id="company-location" name="location" defaultValue={company.location} className={fieldClass} />
          </Field>
          <Field label="Team size" htmlFor="size">
            <select id="size" name="size" defaultValue={company.size} className={fieldClass}>
              <option value="">Not listed</option>
              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="About" htmlFor="about">
              <textarea id="about" name="about" defaultValue={company.about} className={`${fieldClass} min-h-28 resize-y`} />
            </Field>
          </div>
          <Field label="HR name" htmlFor="hrName" hint="Copied onto new jobs. Candidates can call this person.">
            <input id="hrName" name="hrName" required defaultValue={company.hrName} className={fieldClass} />
          </Field>
          <Field label="HR phone" htmlFor="hrPhone">
            <input id="hrPhone" name="hrPhone" required defaultValue={company.hrPhone} className={fieldClass} />
          </Field>
          <Field label="HR email" htmlFor="hrEmail" hint="Optional.">
            <input id="hrEmail" name="hrEmail" type="email" defaultValue={company.hrEmail} className={fieldClass} />
          </Field>
          <Submit variant="ghost">Save company</Submit>
        </form>
      </details>

      <section className="mt-8">
        <h2 className="text-3xl">Your roles</h2>
        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing posted yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-cream">
            {jobs.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div>
                  <Link href={`/hire/jobs/${job.id}`} className="font-medium hover:text-forest">
                    {job.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {job.location} · {formatSalary(job.salaryMin, job.salaryMax)} · {timeAgo(job.createdAt)}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">
                    {job._count?.applications ?? 0} {(job._count?.applications ?? 0) === 1 ? "applicant" : "applicants"}
                  </p>
                  <p className="text-muted">{job.status === "open" ? "Open" : "Closed"}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
