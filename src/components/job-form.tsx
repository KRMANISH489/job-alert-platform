import { CATEGORIES, EXPERIENCE, JOB_TYPES, WORKPLACES } from "@/lib/constants";
import { Field, Submit, fieldClass } from "@/components/ui";

type JobDefaults = {
  id?: string;
  title?: string;
  location?: string;
  workplace?: string;
  type?: string;
  experience?: string;
  category?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string;
  requirements?: string;
  status?: string;
  hrName?: string;
  hrPhone?: string;
  hrEmail?: string;
};

function Choice({
  id,
  name,
  label,
  value,
  options,
}: {
  id: string;
  name: string;
  label: string;
  value?: string;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <Field label={label} htmlFor={id}>
      <select id={id} name={name} defaultValue={value} required className={fieldClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function JobForm({
  action,
  job,
  submitLabel,
  showStatus = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  job?: JobDefaults;
  submitLabel: string;
  showStatus?: boolean;
}) {
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-cream p-5">
      {job?.id ? <input type="hidden" name="id" value={job.id} /> : null}
      <Field label="Job title" htmlFor="title">
        <input id="title" name="title" required defaultValue={job?.title ?? ""} className={fieldClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location" htmlFor="location" hint="A city, or Remote.">
          <input id="location" name="location" required defaultValue={job?.location ?? ""} className={fieldClass} />
        </Field>
        <Choice id="workplace" name="workplace" label="Workplace" value={job?.workplace ?? "hybrid"} options={WORKPLACES} />
        <Choice id="type" name="type" label="Job type" value={job?.type ?? "full-time"} options={JOB_TYPES} />
        <Choice
          id="experience"
          name="experience"
          label="Experience"
          value={job?.experience ?? "1-3"}
          options={EXPERIENCE}
        />
        <Choice
          id="category"
          name="category"
          label="Category"
          value={job?.category ?? "Engineering"}
          options={CATEGORIES.map((category) => ({ value: category, label: category }))}
        />
        {showStatus ? (
          <Choice
            id="status"
            name="status"
            label="Status"
            value={job?.status ?? "open"}
            options={[
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ]}
          />
        ) : null}
        <Field label="Minimum salary" htmlFor="salaryMin" hint="Annual rupees. 1800000 is ₹18L. Blank is fine.">
          <input
            id="salaryMin"
            name="salaryMin"
            inputMode="numeric"
            defaultValue={job?.salaryMin ?? ""}
            className={fieldClass}
          />
        </Field>
        <Field label="Maximum salary" htmlFor="salaryMax">
          <input
            id="salaryMax"
            name="salaryMax"
            inputMode="numeric"
            defaultValue={job?.salaryMax ?? ""}
            className={fieldClass}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="HR name" htmlFor="hrName" hint="Candidates see this on the job.">
          <input id="hrName" name="hrName" required defaultValue={job?.hrName ?? ""} className={fieldClass} />
        </Field>
        <Field label="HR phone" htmlFor="hrPhone" hint="Shown with a call link.">
          <input id="hrPhone" name="hrPhone" required defaultValue={job?.hrPhone ?? ""} className={fieldClass} />
        </Field>
        <Field label="HR email" htmlFor="hrEmail" hint="Optional.">
          <input id="hrEmail" name="hrEmail" type="email" defaultValue={job?.hrEmail ?? ""} className={fieldClass} />
        </Field>
      </div>
      <Field label="About the role" htmlFor="description">
        <textarea
          id="description"
          name="description"
          required
          defaultValue={job?.description ?? ""}
          className={`${fieldClass} min-h-36 resize-y`}
        />
      </Field>
      <Field label="Requirements" htmlFor="requirements" hint="One requirement per line.">
        <textarea
          id="requirements"
          name="requirements"
          required
          defaultValue={job?.requirements ?? ""}
          className={`${fieldClass} min-h-28 resize-y`}
        />
      </Field>
      <Submit>{submitLabel}</Submit>
    </form>
  );
}
