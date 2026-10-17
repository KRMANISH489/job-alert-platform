import Link from "next/link";
import {
  CATEGORIES,
  EXPERIENCE,
  JOB_TYPES,
  WORKPLACES,
  type JobFilters,
} from "@/lib/constants";
import { Submit, btnGhost, fieldClass } from "@/components/ui";

function Select({
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
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <select id={id} name={name} defaultValue={value ?? ""} className={fieldClass}>
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Filters({ filters }: { filters: JobFilters }) {
  return (
    <form action="/jobs" className="space-y-4 rounded-2xl border border-line bg-cream p-4">
      <div>
        <label htmlFor="filter-q" className="mb-1.5 block text-sm font-medium">
          Keyword
        </label>
        <input
          id="filter-q"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Role, skill, company"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="filter-location" className="mb-1.5 block text-sm font-medium">
          Location
        </label>
        <input
          id="filter-location"
          name="location"
          defaultValue={filters.location ?? ""}
          placeholder="City or Remote"
          className={fieldClass}
        />
      </div>
      <Select
        id="filter-category"
        name="category"
        label="Category"
        value={filters.category}
        options={CATEGORIES.map((category) => ({ value: category, label: category }))}
      />
      <Select id="filter-type" name="type" label="Job type" value={filters.type} options={JOB_TYPES} />
      <Select
        id="filter-workplace"
        name="workplace"
        label="Workplace"
        value={filters.workplace}
        options={WORKPLACES}
      />
      <Select
        id="filter-experience"
        name="experience"
        label="Experience"
        value={filters.experience}
        options={EXPERIENCE}
      />
      <div className="flex flex-wrap gap-2">
        <Submit>Show roles</Submit>
        <Link href="/jobs" className={btnGhost}>
          Clear
        </Link>
      </div>
    </form>
  );
}
