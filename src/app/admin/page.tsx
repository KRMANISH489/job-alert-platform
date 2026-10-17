import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash } from "@/components/flash";
import { getSession, homeFor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setJobFlagsAction } from "@/server/actions";

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
  const [jobs, openRoles, seekers, applications] = await Promise.all([
    prisma.job.findMany({
      include: { company: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.count({ where: { status: "open" } }),
    prisma.user.count({ where: { role: "seeker" } }),
    prisma.application.count(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-4xl md:text-5xl">Board admin</h1>
      <p className="mt-3 text-muted">
        {openRoles} open roles · {seekers} job seekers · {applications} applications
      </p>
      <div className="mt-6">
        <Flash searchParams={params} />
      </div>
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
                <td className="px-4 py-3">{job._count.applications}</td>
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
