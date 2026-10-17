import { sortedEducation, sortedEmployment, sortedSkills, type SeekerProfile } from "@/lib/profile";

export type ResumeEmployment = {
  designation: string;
  company: string;
  location: string;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  current: boolean;
  description: string;
};

export type ResumeEducation = {
  degree: string;
  specialization: string;
  institute: string;
  endYear: number;
  score: string;
};

export type ResumeSnapshot = {
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
  skills: string[];
  employments: ResumeEmployment[];
  educations: ResumeEducation[];
};

export function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function hasCallablePhone(phone: string) {
  return phoneDigits(phone).length >= 10;
}

export function telHref(phone: string) {
  const compact = phone.replace(/[^\d+]/g, "");
  return compact ? `tel:${compact}` : "";
}

export function buildResume(profile: SeekerProfile): ResumeSnapshot {
  return {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    headline: profile.headline,
    resumeHeadline: profile.resumeHeadline,
    location: profile.location,
    bio: profile.bio,
    experienceYears: profile.experienceYears,
    currentCompany: profile.currentCompany,
    currentCtc: profile.currentCtc,
    expectedCtc: profile.expectedCtc,
    noticePeriod: profile.noticePeriod,
    preferredLocations: profile.preferredLocations,
    preferredType: profile.preferredType,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    languages: profile.languages,
    industry: profile.industry,
    department: profile.department,
    skills: sortedSkills(profile).map((skill) => skill.name),
    employments: sortedEmployment(profile).map((job) => ({
      designation: job.designation,
      company: job.company,
      location: job.location,
      startMonth: job.startMonth,
      startYear: job.startYear,
      endMonth: job.endMonth,
      endYear: job.endYear,
      current: job.current,
      description: job.description,
    })),
    educations: sortedEducation(profile).map((study) => ({
      degree: study.degree,
      specialization: study.specialization,
      institute: study.institute,
      endYear: study.endYear,
      score: study.score,
    })),
  };
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asYear(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function parseResume(raw: string): ResumeSnapshot | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (typeof record.name !== "string") return null;

  const employments = Array.isArray(record.employments)
    ? record.employments.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const job = item as Record<string, unknown>;
        if (typeof job.designation !== "string" || typeof job.company !== "string") return [];
        return [
          {
            designation: job.designation,
            company: job.company,
            location: asText(job.location),
            startMonth: asYear(job.startMonth),
            startYear: asYear(job.startYear),
            endMonth: typeof job.endMonth === "number" ? job.endMonth : null,
            endYear: typeof job.endYear === "number" ? job.endYear : null,
            current: job.current === true,
            description: asText(job.description),
          },
        ];
      })
    : [];

  const educations = Array.isArray(record.educations)
    ? record.educations.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const study = item as Record<string, unknown>;
        if (typeof study.degree !== "string" || typeof study.institute !== "string") return [];
        return [
          {
            degree: study.degree,
            specialization: asText(study.specialization),
            institute: study.institute,
            endYear: asYear(study.endYear),
            score: asText(study.score),
          },
        ];
      })
    : [];

  return {
    name: record.name,
    email: asText(record.email),
    phone: asText(record.phone),
    headline: asText(record.headline),
    resumeHeadline: asText(record.resumeHeadline),
    location: asText(record.location),
    bio: asText(record.bio),
    experienceYears: typeof record.experienceYears === "number" ? record.experienceYears : null,
    currentCompany: asText(record.currentCompany),
    currentCtc: typeof record.currentCtc === "number" ? record.currentCtc : null,
    expectedCtc: typeof record.expectedCtc === "number" ? record.expectedCtc : null,
    noticePeriod: asText(record.noticePeriod),
    preferredLocations: asText(record.preferredLocations),
    preferredType: asText(record.preferredType),
    dateOfBirth: asText(record.dateOfBirth),
    gender: asText(record.gender),
    languages: asText(record.languages),
    industry: asText(record.industry),
    department: asText(record.department),
    skills: Array.isArray(record.skills) ? record.skills.filter((skill): skill is string => typeof skill === "string") : [],
    employments,
    educations,
  };
}
