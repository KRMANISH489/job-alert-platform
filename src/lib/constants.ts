export const CATEGORIES = [
  "Engineering",
  "Design",
  "Product",
  "Data",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
] as const;

export const JOB_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
] as const;

export const WORKPLACES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
] as const;

export const EXPERIENCE = [
  { value: "fresher", label: "Fresher" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-6", label: "3–6 years" },
  { value: "6+", label: "6+ years" },
] as const;

export const APPLICATION_STATUSES = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Not moving forward" },
] as const;

export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"] as const;

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const NOTICE_PERIODS = [
  "Immediate",
  "15 days",
  "30 days",
  "45 days",
  "60 days",
  "90 days",
  "More than 90 days",
] as const;

export const GENDERS = ["Female", "Male", "Other", "Prefer not to say"] as const;

export const CITIES = ["Bengaluru", "Mumbai", "Pune", "Delhi", "Hyderabad", "Ahmedabad", "Remote"] as const;

export type JobFilters = {
  q?: string;
  location?: string;
  category?: string;
  type?: string;
  workplace?: string;
  experience?: string;
};

export function labelOf(list: readonly { value: string; label: string }[], value: string) {
  return list.find((item) => item.value === value)?.label ?? value;
}

export function statusLabel(status: string) {
  return APPLICATION_STATUSES.find((item) => item.value === status)?.label ?? status;
}

function oneOf(list: readonly { value: string }[], value?: string) {
  return value && list.some((item) => item.value === value) ? value : undefined;
}

export function normalizeFilters(input: JobFilters): JobFilters {
  return {
    q: input.q?.slice(0, 80),
    location: input.location?.slice(0, 80),
    category: CATEGORIES.some((item) => item === input.category) ? input.category : undefined,
    type: oneOf(JOB_TYPES, input.type),
    workplace: oneOf(WORKPLACES, input.workplace),
    experience: oneOf(EXPERIENCE, input.experience),
  };
}

export function readFilters(params: Record<string, string | string[] | undefined>): JobFilters {
  const read = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };

  return normalizeFilters({
    q: read("q"),
    location: read("location"),
    category: read("category"),
    type: read("type"),
    workplace: read("workplace"),
    experience: read("experience"),
  });
}
