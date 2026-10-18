import { MONTHS } from "@/lib/constants";

export type SeekerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  headline: string;
  resumeHeadline: string;
  location: string;
  bio: string;
  experienceYears: number | null;
  currentCompany: string;
  currentCtc: number | null;
  expectedCtc: number | null;
  noticePeriod: string;
  preferredLocations: string;
  preferredType: string;
  dateOfBirth: string;
  gender: string;
  languages: string;
  industry: string;
  department: string;
  skills: { id: string; name: string }[];
  employments: {
    id: string;
    designation: string;
    company: string;
    location: string;
    startMonth: number;
    startYear: number;
    endMonth: number | null;
    endYear: number | null;
    current: boolean;
    description: string;
  }[];
  educations: {
    id: string;
    degree: string;
    specialization: string;
    institute: string;
    endYear: number;
    score: string;
  }[];
};

export function profileCompleteness(profile: SeekerProfile) {
  const checks = [
    { label: "phone number", done: profile.phone.trim().length > 0 },
    { label: "current city", done: profile.location.trim().length > 0 },
    { label: "current role", done: profile.headline.trim().length > 0 },
    { label: "resume headline", done: profile.resumeHeadline.trim().length > 0 },
    { label: "profile summary", done: profile.bio.trim().length >= 40 },
    { label: "total experience", done: profile.experienceYears != null },
    { label: "current company", done: profile.currentCompany.trim().length > 0 },
    { label: "key skills", done: profile.skills.length > 0 },
    { label: "employment", done: profile.employments.length > 0 },
    { label: "education", done: profile.educations.length > 0 },
    { label: "notice period", done: profile.noticePeriod.trim().length > 0 },
    { label: "expected salary", done: profile.expectedCtc != null },
    { label: "preferred locations", done: profile.preferredLocations.trim().length > 0 },
    { label: "languages", done: profile.languages.trim().length > 0 },
  ];
  const done = checks.filter((item) => item.done).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((item) => !item.done).map((item) => item.label),
  };
}

export function sortedSkills(profile: SeekerProfile) {
  return [...profile.skills].sort((a, b) => a.name.localeCompare(b.name));
}

export function sortedEmployment(profile: SeekerProfile) {
  return [...profile.employments].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    if (a.startYear !== b.startYear) return b.startYear - a.startYear;
    return b.startMonth - a.startMonth;
  });
}

export function sortedEducation(profile: SeekerProfile) {
  return [...profile.educations].sort((a, b) => b.endYear - a.endYear);
}

export function formatTenure(job: {
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  current: boolean;
}) {
  const start = `${MONTHS[job.startMonth - 1] ?? "—"} ${job.startYear}`;
  if (job.current) return `${start} – Present`;
  if (job.endMonth && job.endYear) return `${start} – ${MONTHS[job.endMonth - 1] ?? "—"} ${job.endYear}`;
  return start;
}
