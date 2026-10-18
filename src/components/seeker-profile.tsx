import Link from "next/link";
import { Mark } from "@/components/mark";
import { Field, Submit, btnGhost, fieldClass } from "@/components/ui";
import { GENDERS, JOB_TYPES, MONTHS, NOTICE_PERIODS, labelOf } from "@/lib/constants";
import { formatAmount, formatExperience, paragraphs } from "@/lib/format";
import {
  formatTenure,
  profileCompleteness,
  sortedEducation,
  sortedEmployment,
  sortedSkills,
  type SeekerProfile,
} from "@/lib/profile";
import {
  addSkillAction,
  deleteEducationAction,
  deleteEmploymentAction,
  removeSkillAction,
  saveEducationAction,
  saveEmploymentAction,
  updateBasicProfileAction,
  updateCareerAction,
  updatePersonalAction,
} from "@/server/profile-actions";

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-3xl border border-line bg-cream p-5">
      <h2 className="text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MonthSelect({ id, name, value }: { id: string; name: string; value?: number | null }) {
  return (
    <select id={id} name={name} defaultValue={value ?? ""} className={fieldClass}>
      <option value="">Month</option>
      {MONTHS.map((month, index) => (
        <option key={month} value={index + 1}>
          {month}
        </option>
      ))}
    </select>
  );
}

function EmploymentForm({
  job,
}: {
  job?: SeekerProfile["employments"][number];
}) {
  const formId = job?.id ?? "new";
  return (
    <form action={saveEmploymentAction} className="mt-4 grid gap-4 sm:grid-cols-2">
      {job ? <input type="hidden" name="id" value={job.id} /> : null}
      <Field label="Job title" htmlFor={`designation-${formId}`}>
        <input id={`designation-${formId}`} name="designation" required defaultValue={job?.designation ?? ""} className={fieldClass} />
      </Field>
      <Field label="Company" htmlFor={`company-${formId}`}>
        <input id={`company-${formId}`} name="company" required defaultValue={job?.company ?? ""} className={fieldClass} />
      </Field>
      <Field label="City" htmlFor={`job-location-${formId}`}>
        <input id={`job-location-${formId}`} name="location" defaultValue={job?.location ?? ""} className={fieldClass} />
      </Field>
      <label className="flex items-end gap-2 pb-2 text-sm">
        <input type="hidden" name="current" value="false" />
        <input type="checkbox" name="current" value="true" defaultChecked={job?.current ?? false} />
        I currently work here
      </label>
      <Field label="Started" htmlFor={`start-month-${formId}`}>
        <div className="grid grid-cols-2 gap-2">
          <MonthSelect id={`start-month-${formId}`} name="startMonth" value={job?.startMonth} />
          <input
            name="startYear"
            inputMode="numeric"
            placeholder="Year"
            aria-label="Start year"
            defaultValue={job?.startYear ?? ""}
            className={fieldClass}
          />
        </div>
      </Field>
      <Field label="Ended" htmlFor={`end-month-${formId}`} hint="Leave this if you still work here.">
        <div className="grid grid-cols-2 gap-2">
          <MonthSelect id={`end-month-${formId}`} name="endMonth" value={job?.endMonth} />
          <input
            name="endYear"
            inputMode="numeric"
            placeholder="Year"
            aria-label="End year"
            defaultValue={job?.endYear ?? ""}
            className={fieldClass}
          />
        </div>
      </Field>
      <div className="sm:col-span-2">
        <Field label="What you did" htmlFor={`job-description-${formId}`}>
          <textarea
            id={`job-description-${formId}`}
            name="description"
            defaultValue={job?.description ?? ""}
            className={`${fieldClass} min-h-24 resize-y`}
          />
        </Field>
      </div>
      <Submit>{job ? "Save job" : "Add job"}</Submit>
    </form>
  );
}

function EducationForm({ item }: { item?: SeekerProfile["educations"][number] }) {
  const formId = item?.id ?? "new";
  return (
    <form action={saveEducationAction} className="mt-4 grid gap-4 sm:grid-cols-2">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="Degree" htmlFor={`degree-${formId}`}>
        <input id={`degree-${formId}`} name="degree" required defaultValue={item?.degree ?? ""} placeholder="B.Des" className={fieldClass} />
      </Field>
      <Field label="Specialisation" htmlFor={`specialization-${formId}`}>
        <input
          id={`specialization-${formId}`}
          name="specialization"
          defaultValue={item?.specialization ?? ""}
          placeholder="Communication Design"
          className={fieldClass}
        />
      </Field>
      <Field label="Institute" htmlFor={`institute-${formId}`}>
        <input id={`institute-${formId}`} name="institute" required defaultValue={item?.institute ?? ""} className={fieldClass} />
      </Field>
      <Field label="Year of completion" htmlFor={`end-year-${formId}`}>
        <input
          id={`end-year-${formId}`}
          name="endYear"
          inputMode="numeric"
          required
          defaultValue={item?.endYear ?? ""}
          className={fieldClass}
        />
      </Field>
      <Field label="Score" htmlFor={`score-${formId}`} hint="Optional. CGPA or percentage.">
        <input id={`score-${formId}`} name="score" defaultValue={item?.score ?? ""} className={fieldClass} />
      </Field>
      <div className="flex items-end">
        <Submit>{item ? "Save education" : "Add education"}</Submit>
      </div>
    </form>
  );
}

export function SeekerProfileView({ profile, editable }: { profile: SeekerProfile; editable: boolean }) {
  const { percent, missing } = profileCompleteness(profile);
  const skills = sortedSkills(profile);
  const jobs = sortedEmployment(profile);
  const studies = sortedEducation(profile);
  const facts = [
    profile.location,
    formatExperience(profile.experienceYears),
    profile.currentCtc != null ? `${formatAmount(profile.currentCtc)} current` : "",
    profile.noticePeriod ? `${profile.noticePeriod} notice` : "",
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-line bg-cream p-5">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
          <div className="flex items-start gap-4">
            <Mark name={profile.name} size="lg" />
            <div>
              <h1 className="text-4xl leading-tight">{profile.name}</h1>
              <p className="mt-1 text-muted">
                {profile.headline || "Add your current role"}
                {profile.currentCompany ? ` at ${profile.currentCompany}` : ""}
              </p>
              {facts.length > 0 ? <p className="mt-2 text-sm">{facts.join(" · ")}</p> : null}
              <p className="mt-2 text-sm text-muted">
                {profile.email}
                {profile.phone ? ` · ${profile.phone}` : ""}
              </p>
              {profile.resumeHeadline ? <p className="mt-3 max-w-xl text-sm leading-6">{profile.resumeHeadline}</p> : null}
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between text-sm">
              <span>Profile strength</span>
              <span className="font-medium">{percent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-deep">
              <div className="h-full rounded-full bg-rise" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              {missing.length === 0
                ? "Recruiters can see a complete profile."
                : `Still open: ${missing.slice(0, 3).join(", ")}.`}
            </p>
          </div>
        </div>
        {editable ? (
          <details className="mt-5 border-t border-line pt-4">
            <summary className="cursor-pointer text-sm font-medium text-forest">Edit basic details</summary>
            <form action={updateBasicProfileAction} className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name">
                <input id="name" name="name" required defaultValue={profile.name} className={fieldClass} />
              </Field>
              <Field label="Current role" htmlFor="headline" hint="Your designation, not a sentence.">
                <input id="headline" name="headline" defaultValue={profile.headline} placeholder="Product Designer" className={fieldClass} />
              </Field>
              <Field label="Current company" htmlFor="currentCompany">
                <input id="currentCompany" name="currentCompany" defaultValue={profile.currentCompany} className={fieldClass} />
              </Field>
              <Field label="Current city" htmlFor="location">
                <input id="location" name="location" defaultValue={profile.location} className={fieldClass} />
              </Field>
              <Field label="Phone" htmlFor="phone">
                <input id="phone" name="phone" defaultValue={profile.phone} className={fieldClass} />
              </Field>
              <Field label="Total experience" htmlFor="experienceYears" hint="Whole years. 0 means fresher.">
                <input
                  id="experienceYears"
                  name="experienceYears"
                  inputMode="numeric"
                  defaultValue={profile.experienceYears ?? ""}
                  className={fieldClass}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Resume headline" htmlFor="resumeHeadline" hint="One line a recruiter reads first.">
                  <input
                    id="resumeHeadline"
                    name="resumeHeadline"
                    defaultValue={profile.resumeHeadline}
                    className={fieldClass}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Profile summary" htmlFor="bio">
                  <textarea id="bio" name="bio" defaultValue={profile.bio} className={`${fieldClass} min-h-32 resize-y`} />
                </Field>
              </div>
              <Submit>Save basic details</Submit>
            </form>
          </details>
        ) : null}
      </section>

      <Section title="Profile summary" id="summary">
        {profile.bio ? (
          <div className="space-y-3 text-sm leading-6">
            {paragraphs(profile.bio).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">A short summary of the work you want to be hired for.</p>
        )}
      </Section>

      <Section title="Key skills" id="skills">
        {skills.length === 0 ? <p className="text-sm text-muted">Add the skills you want recruiters to search for.</p> : null}
        <ul className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-sm">
              {skill.name}
              {editable ? (
                <form action={removeSkillAction}>
                  <input type="hidden" name="id" value={skill.id} />
                  <button type="submit" aria-label={`Remove ${skill.name}`} className="text-muted hover:text-ink">
                    ×
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
        {editable ? (
          <form action={addSkillAction} className="mt-4 flex flex-wrap items-end gap-2">
            <Field label="Add a skill" htmlFor="skill-name">
              <input id="skill-name" name="name" placeholder="Figma" className={`${fieldClass} w-56`} />
            </Field>
            <Submit variant="ghost">Add</Submit>
          </form>
        ) : null}
      </Section>

      <Section title="Employment" id="employment">
        {jobs.length === 0 ? <p className="text-sm text-muted">Start with your current or most recent job.</p> : null}
        <div className="divide-y divide-line">
          {jobs.map((job) => (
            <article key={job.id} className="py-4 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{job.designation}</p>
                  <p className="text-sm">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ""}
                  </p>
                  <p className="text-sm text-muted">{formatTenure(job)}</p>
                </div>
                {job.current ? (
                  <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-copper">
                    Current
                  </span>
                ) : null}
              </div>
              {job.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{job.description}</p> : null}
              {editable ? (
                <div className="mt-3 flex flex-wrap items-start gap-4">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium text-forest">Edit</summary>
                    <EmploymentForm job={job} />
                  </details>
                  <form action={deleteEmploymentAction}>
                    <input type="hidden" name="id" value={job.id} />
                    <button type="submit" className="text-sm text-muted hover:text-ink">
                      Remove
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          ))}
        </div>
        {editable ? (
          <details className="mt-2 border-t border-line pt-3">
            <summary className="cursor-pointer text-sm font-medium text-forest">Add employment</summary>
            <EmploymentForm />
          </details>
        ) : null}
      </Section>

      <Section title="Education" id="education">
        {studies.length === 0 ? <p className="text-sm text-muted">Add your highest qualification.</p> : null}
        <div className="divide-y divide-line">
          {studies.map((item) => (
            <article key={item.id} className="py-4 first:pt-0">
              <p className="font-medium">
                {item.degree}
                {item.specialization ? ` · ${item.specialization}` : ""}
              </p>
              <p className="text-sm">{item.institute}</p>
              <p className="text-sm text-muted">
                {item.endYear}
                {item.score ? ` · ${item.score}` : ""}
              </p>
              {editable ? (
                <div className="mt-3 flex flex-wrap items-start gap-4">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium text-forest">Edit</summary>
                    <EducationForm item={item} />
                  </details>
                  <form action={deleteEducationAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="text-sm text-muted hover:text-ink">
                      Remove
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          ))}
        </div>
        {editable ? (
          <details className="mt-2 border-t border-line pt-3">
            <summary className="cursor-pointer text-sm font-medium text-forest">Add education</summary>
            <EducationForm />
          </details>
        ) : null}
      </Section>

      <Section title="Career profile" id="career">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact label="Current salary" value={profile.currentCtc != null ? `${formatAmount(profile.currentCtc)} a year` : ""} />
          <Fact label="Expected salary" value={profile.expectedCtc != null ? `${formatAmount(profile.expectedCtc)} a year` : ""} />
          <Fact label="Notice period" value={profile.noticePeriod} />
          <Fact label="Preferred locations" value={profile.preferredLocations} />
          <Fact label="Job type" value={profile.preferredType ? labelOf(JOB_TYPES, profile.preferredType) : ""} />
          <Fact label="Industry" value={profile.industry} />
          <Fact label="Department" value={profile.department} />
        </dl>
        {editable ? (
          <details className="mt-4 border-t border-line pt-4">
            <summary className="cursor-pointer text-sm font-medium text-forest">Edit career profile</summary>
            <form action={updateCareerAction} className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Current salary" htmlFor="currentCtc" hint="Annual rupees. 1600000 is ₹16L.">
                <input id="currentCtc" name="currentCtc" inputMode="numeric" defaultValue={profile.currentCtc ?? ""} className={fieldClass} />
              </Field>
              <Field label="Expected salary" htmlFor="expectedCtc">
                <input id="expectedCtc" name="expectedCtc" inputMode="numeric" defaultValue={profile.expectedCtc ?? ""} className={fieldClass} />
              </Field>
              <Field label="Notice period" htmlFor="noticePeriod">
                <select id="noticePeriod" name="noticePeriod" defaultValue={profile.noticePeriod} className={fieldClass}>
                  <option value="">Not set</option>
                  {NOTICE_PERIODS.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Job type you want" htmlFor="preferredType">
                <select id="preferredType" name="preferredType" defaultValue={profile.preferredType} className={fieldClass}>
                  <option value="">Not set</option>
                  {JOB_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Preferred locations" htmlFor="preferredLocations" hint="Separate cities with commas.">
                <input
                  id="preferredLocations"
                  name="preferredLocations"
                  defaultValue={profile.preferredLocations}
                  placeholder="Pune, Bengaluru, Remote"
                  className={fieldClass}
                />
              </Field>
              <Field label="Industry" htmlFor="industry">
                <input id="industry" name="industry" list="industries" defaultValue={profile.industry} className={fieldClass} />
                <datalist id="industries">
                  {["IT Services", "Product", "Internet", "Finance", "Healthcare", "Education", "Manufacturing", "Retail", "Logistics"].map(
                    (industry) => (
                      <option key={industry} value={industry} />
                    ),
                  )}
                </datalist>
              </Field>
              <Field label="Department" htmlFor="department">
                <input id="department" name="department" defaultValue={profile.department} placeholder="Design" className={fieldClass} />
              </Field>
              <div className="flex items-end">
                <Submit>Save career profile</Submit>
              </div>
            </form>
          </details>
        ) : null}
      </Section>

      <Section title="Personal details" id="personal">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact label="Date of birth" value={profile.dateOfBirth} />
          <Fact label="Gender" value={profile.gender} />
          <Fact label="Languages" value={profile.languages} />
        </dl>
        {editable ? (
          <details className="mt-4 border-t border-line pt-4">
            <summary className="cursor-pointer text-sm font-medium text-forest">Edit personal details</summary>
            <form action={updatePersonalAction} className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Date of birth" htmlFor="dateOfBirth">
                <input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={profile.dateOfBirth} className={fieldClass} />
              </Field>
              <Field label="Gender" htmlFor="gender">
                <select id="gender" name="gender" defaultValue={profile.gender} className={fieldClass}>
                  <option value="">Not set</option>
                  {GENDERS.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Languages" htmlFor="languages">
                  <input
                    id="languages"
                    name="languages"
                    defaultValue={profile.languages}
                    placeholder="English, Hindi"
                    className={fieldClass}
                  />
                </Field>
              </div>
              <Submit>Save personal details</Submit>
            </form>
          </details>
        ) : null}
      </Section>

      {editable ? (
        <p className="text-sm text-muted">
          Applications and alerts stay on your <Link href="/account" className="font-medium text-forest">desk</Link>.
        </p>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm">{value || "Not added"}</dd>
    </div>
  );
}

export function ProfileStrength({ profile }: { profile: SeekerProfile }) {
  const { percent } = profileCompleteness(profile);
  return (
    <aside className="rounded-3xl border border-line bg-cream p-5">
      <div className="flex items-center gap-3">
        <Mark name={profile.name} />
        <div>
          <p className="font-medium">{profile.name}</p>
          <p className="text-sm text-muted">{profile.headline || "Add your current role"}</p>
        </div>
      </div>
      <p className="mt-4 text-sm">{percent}% profile complete</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-deep">
        <div className="h-full rounded-full bg-rise" style={{ width: `${percent}%` }} />
      </div>
      <Link href="/profile" className={`${btnGhost} mt-4 w-full`}>
        Open profile
      </Link>
    </aside>
  );
}
