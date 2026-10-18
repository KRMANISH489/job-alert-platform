import { api, ApiError } from "@/lib/api";
import type { JobFilters } from "@/lib/constants";
import type { SeekerProfile } from "@/lib/profile";

export type CompanyCard = {
  id: string;
  name: string;
  slug: string;
  website: string;
  about: string;
  location: string;
  size: string;
  hrName: string;
  hrPhone: string;
  hrEmail: string;
  approved: boolean;
  createdAt: Date;
};

export type JobCard = {
  id: string;
  slug: string;
  title: string;
  companyId: string;
  company: CompanyCard;
  location: string;
  workplace: string;
  type: string;
  experience: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  category: string;
  description: string;
  requirements: string;
  status: string;
  featured: boolean;
  hrName: string;
  hrPhone: string;
  hrEmail: string;
  createdAt: Date;
  _count?: { applications: number };
};

export type ApplicationCard = {
  id: string;
  note: string;
  status: string;
  createdAt: Date;
  job: JobCard;
};

export type SavedCard = {
  jobId: string;
  createdAt: Date;
  job: JobCard;
};

export type AlertCard = {
  id: string;
  keyword: string;
  location: string;
  category: string;
  createdAt: Date;
  jobs: JobCard[];
};

function queryString(filters: JobFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

export async function listJobs(filters: JobFilters) {
  return api<JobCard[]>(`/jobs${queryString(filters)}`);
}

export async function getOpenJob(slug: string) {
  try {
    return await api<JobCard>(`/jobs/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getJobContext(slug: string) {
  return api<{
    application: { id: string; status: string; createdAt: Date; note: string } | null;
    saved: boolean;
    profile: SeekerProfile;
  }>(`/jobs/${slug}/context`, { auth: true });
}

export async function getCompanyPage(slug: string) {
  try {
    return await api<{ company: CompanyCard; jobs: JobCard[] }>(`/companies/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getBoard() {
  return api<{
    openCount: number;
    companyCount: number;
    latest: JobCard[];
    categories: { category: string; count: number }[];
  }>("/board");
}

export async function getSeekerHome() {
  return api<{
    profile: SeekerProfile;
    applications: ApplicationCard[];
    saved: SavedCard[];
    recommended: JobCard[];
  }>("/me/home", { auth: true });
}

export async function getDesk() {
  return api<{
    profile: SeekerProfile;
    applications: ApplicationCard[];
    saved: SavedCard[];
    recommended: JobCard[];
    alerts: AlertCard[];
  }>("/me/desk", { auth: true });
}

export async function getProfile() {
  return api<SeekerProfile>("/me/profile", { auth: true });
}

export async function getHireHome() {
  return api<{ company: CompanyCard; jobs: JobCard[] }>("/hire", { auth: true });
}

export type EmployerJob = JobCard & {
  applications: {
    id: string;
    note: string;
    resumeJson: string;
    status: string;
    createdAt: Date;
    user: SeekerProfile;
  }[];
};

export async function getEmployerJob(id: string) {
  try {
    return await api<EmployerJob>(`/hire/jobs/${id}`, { auth: true });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getAdminBoard() {
  return api<{
    openRoles: number;
    seekers: number;
    applications: number;
    jobs: JobCard[];
    companies: (CompanyCard & { users: { name: string; email: string }[]; _count: { jobs: number } })[];
  }>("/admin/board", { auth: true });
}
