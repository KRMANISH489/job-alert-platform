import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/flash";
import { getSession, homeFor } from "@/lib/auth";
import { getAdminBoard } from "@/lib/queries";
import { setCompanyAccessAction, setJobFlagsAction } from "@/server/actions";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "admin") redirect(homeFor(session.role));

  const params = await searchParams;
  const { jobs, companies, openRoles, seekers, applications } = await getAdminBoard();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">Main admin</p>
      <h1 className="mt-2 text-4xl md:text-5xl">Board control</h1>
      <p className="mt-3 text-muted">
        {openRoles} open roles · {seekers} applicants · {applications} applications. Companies post only after you allow it.
      </p>
      <div className="mt-6">
        <Flash searchParams={params} />
      </div>

      <section className="mt-4">
        <h2 className="text-3xl">Company access</h2>
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-cream">
          {companies.map((company) => (
            <li key={company.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <p className="font-medium">{company.name}</p>
                <p className="text-sm text-muted">
                  {company.users.length > 0
                    ? company.users.map((user) => `${user.name} · ${user.email}`).join(", ")
                    : "No secondary admin yet"}
                  {` · ${company._count.jobs} ${company._count.jobs === 1 ? "job" : "jobs"}`}
                </p>
              </div>
              <form action={setCompanyAccessAction} className="flex items-center gap-3">
                <input type="hidden" name="id" value={company.id} />
                <input type="hidden" name="approved" value={company.approved ? "false" : "true"} />
                <span className="text-sm">{company.approved ? "Can post" : "Waiting"}</span>
                <button type="submit" className="rounded-full border border-line px-3 py-1 text-sm hover:bg-paper">
                  {company.approved ? "Remove access" : "Give access"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="mt-10 text-3xl">Listings</h2>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-cream">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Applicants</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  {job.status === "open" ? (
                    <Link href={`/jobs/${job.slug}`} className="font-medium hover:text-forest">
                      {job.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{job.title}</span>
                  )}
                </td>
                <td className="px-4 py-3">{job.company.name}</td>
                <td className="px-4 py-3">{job._count?.applications ?? 0}</td>
                <td className="px-4 py-3">
                  {job.status === "open" ? "Open" : "Closed"}
                  {job.featured ? " · Featured" : ""}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <form action={setJobFlagsAction}>
                      <input type="hidden" name="id" value={job.id} />
                      <input type="hidden" name="featured" value={job.featured ? "false" : "true"} />
                      <button type="submit" className="rounded-full border border-line px-3 py-1 hover:bg-paper">
                        {job.featured ? "Unfeature" : "Feature"}
                      </button>
                    </form>
                    <form action={setJobFlagsAction}>
                      <input type="hidden" name="id" value={job.id} />
                      <input type="hidden" name="status" value={job.status === "open" ? "closed" : "open"} />
                      <button type="submit" className="rounded-full border border-line px-3 py-1 hover:bg-paper">
                        {job.status === "open" ? "Close" : "Reopen"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
