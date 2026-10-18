import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobRow } from "@/components/job-row";
import { Mark } from "@/components/mark";
import { getCompanyPage } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCompanyPage(slug);
  if (!page) return { title: "Company not found" };
  return { title: page.company.name, description: page.company.about || `Open roles at ${page.company.name}` };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCompanyPage(slug);
  if (!page) notFound();
  const { company, jobs } = page;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-start gap-4">
        <Mark name={company.name} size="lg" />
        <div>
          <h1 className="text-4xl md:text-5xl">{company.name}</h1>
          <p className="mt-2 text-muted">
            {[company.location, company.size].filter(Boolean).join(" · ") || "Hiring on CareerRise"}
          </p>
        </div>
      </div>
      {company.about ? <p className="mt-6 max-w-2xl text-[15px] leading-7">{company.about}</p> : null}
      {company.website ? (
        <a href={company.website} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-forest">
          {company.website.replace(/^https?:\/\//, "")}
        </a>
      ) : null}
      <h2 className="mt-10 text-3xl">Open roles</h2>
      <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-cream">
        {jobs.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted">No open roles right now.</p>
        ) : (
          jobs.map((job) => <JobRow key={job.id} job={job} />)
        )}
      </div>
      <Link href="/jobs" className="mt-4 inline-block text-sm text-muted hover:text-ink">
        Back to all roles
      </Link>
    </main>
  );
}
