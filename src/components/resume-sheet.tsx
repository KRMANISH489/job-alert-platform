import { JOB_TYPES, labelOf } from "@/lib/constants";
import { formatAmount, formatExperience } from "@/lib/format";
import { formatTenure } from "@/lib/profile";
import { telHref, type ResumeSnapshot } from "@/lib/resume";

function Fact({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

export function ResumeSheet({ resume }: { resume: ResumeSnapshot }) {
  const title = resume.resumeHeadline || resume.headline;
  const phoneLink = telHref(resume.phone);
  const pay = [
    resume.currentCtc != null ? `Current ${formatAmount(resume.currentCtc)}` : "",
    resume.expectedCtc != null ? `Expected ${formatAmount(resume.expectedCtc)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="mt-4 space-y-5 border-t border-line pt-4">
      <header>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Resume received</p>
        <h3 className="mt-1 text-2xl">{resume.name}</h3>
        {title ? <p className="text-sm">{title}</p> : null}
        <p className="mt-1 text-sm text-muted">
          {[resume.location, formatExperience(resume.experienceYears), resume.currentCompany].filter(Boolean).join(" · ")}
        </p>
      </header>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Phone</dt>
          <dd className="mt-1 text-sm font-medium">
            {phoneLink ? (
              <a href={phoneLink} className="text-forest">
                {resume.phone}
              </a>
            ) : (
              resume.phone || "Not shared"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Email</dt>
          <dd className="mt-1 text-sm">
            {resume.email ? (
              <a href={`mailto:${resume.email}`} className="text-forest">
                {resume.email}
              </a>
            ) : (
              "Not shared"
            )}
          </dd>
        </div>
        <Fact label="Notice period" value={resume.noticePeriod} />
        <Fact label="Salary" value={pay} />
        <Fact label="Open to" value={resume.preferredLocations} />
        <Fact label="Preferred type" value={resume.preferredType ? labelOf(JOB_TYPES, resume.preferredType) : ""} />
        <Fact label="Industry" value={resume.industry} />
        <Fact label="Department" value={resume.department} />
        <Fact label="Languages" value={resume.languages} />
        <Fact label="Date of birth" value={resume.dateOfBirth} />
        <Fact label="Gender" value={resume.gender} />
      </dl>

      {resume.bio ? (
        <section>
          <h4 className="text-xs uppercase tracking-[0.14em] text-muted">Summary</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{resume.bio}</p>
        </section>
      ) : null}

      {resume.skills.length > 0 ? (
        <section>
          <h4 className="text-xs uppercase tracking-[0.14em] text-muted">Skills</h4>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {resume.skills.map((skill) => (
              <li key={skill} className="rounded-full border border-line px-2 py-0.5 text-xs">
                {skill}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {resume.employments.length > 0 ? (
        <section>
          <h4 className="text-xs uppercase tracking-[0.14em] text-muted">Employment</h4>
          <ul className="mt-2 space-y-3">
            {resume.employments.map((job) => (
              <li key={`${job.company}-${job.designation}-${job.startYear}`}>
                <p className="text-sm font-medium">
                  {job.designation}
                  <span className="font-normal text-muted">{` · ${job.company}`}</span>
                </p>
                <p className="text-xs text-muted">
                  {formatTenure(job)}
                  {job.location ? ` · ${job.location}` : ""}
                </p>
                {job.description ? <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{job.description}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {resume.educations.length > 0 ? (
        <section>
          <h4 className="text-xs uppercase tracking-[0.14em] text-muted">Education</h4>
          <ul className="mt-2 space-y-2 text-sm">
            {resume.educations.map((study) => (
              <li key={`${study.institute}-${study.degree}-${study.endYear}`}>
                <span className="font-medium">{study.degree}</span>
                {study.specialization ? `, ${study.specialization}` : ""} · {study.institute} · {study.endYear}
                {study.score ? ` · ${study.score}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
