import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flash } from "@/components/flash";
import { JobForm } from "@/components/job-form";
import { getSession } from "@/lib/auth";
import { getHireHome } from "@/lib/queries";
import { createJobAction } from "@/server/actions";

export const metadata: Metadata = { title: "Post a role" };

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/hire/new");
  if (session.role !== "employer" || !session.companyId) redirect("/employers");
  const [params, hire] = await Promise.all([searchParams, getHireHome()]);
  const company = hire.company;
  if (!company.approved) {
    redirect("/hire?error=" + encodeURIComponent("The main admin has not given this company access to post jobs."));
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-4xl md:text-5xl">Post a role</h1>
      <p className="mt-3 text-muted">It goes live on the board as soon as you publish it.</p>
      <div className="mt-6">
        <Flash searchParams={params} />
      </div>
      <JobForm
        action={createJobAction}
        submitLabel="Publish role"
        job={{ hrName: company.hrName, hrPhone: company.hrPhone, hrEmail: company.hrEmail }}
      />
    </main>
  );
}
