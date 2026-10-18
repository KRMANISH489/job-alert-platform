"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { GENDERS, JOB_TYPES, NOTICE_PERIODS } from "@/lib/constants";
import { getSession } from "@/lib/auth";

function redirectWith(path: string, extra: Record<string, string>): never {
  const url = new URL(path, "http://localhost");
  for (const [key, value] of Object.entries(extra)) {
    if (value) url.searchParams.set(key, value);
  }
  redirect(`${url.pathname}${url.search}`);
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireSeeker() {
  const session = await getSession();
  if (!session || session.role !== "seeker") redirect("/login?next=/profile");
  return session;
}

function refreshProfile() {
  revalidatePath("/profile");
  revalidatePath("/account");
  revalidatePath("/hire", "layout");
}

function parseMoney(raw: string) {
  if (!raw) return { ok: true as const, value: null };
  if (!/^\d+$/.test(raw)) return { ok: false as const };
  const value = Number(raw);
  if (value > 100_000_000) return { ok: false as const };
  return { ok: true as const, value };
}

function parseYears(raw: string) {
  if (!raw) return { ok: true as const, value: null };
  if (!/^\d+$/.test(raw)) return { ok: false as const };
  const value = Number(raw);
  if (value > 50) return { ok: false as const };
  return { ok: true as const, value };
}

function parseMonth(raw: string) {
  const month = Number(raw);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return month;
}

function parseYear(raw: string, allowEmpty: boolean) {
  if (!raw) return allowEmpty ? null : undefined;
  if (!/^\d{4}$/.test(raw)) return undefined;
  const year = Number(raw);
  const max = new Date().getFullYear() + 1;
  if (year < 1970 || year > max) return undefined;
  return year;
}

export async function updateBasicProfileAction(formData: FormData) {
  const session = await requireSeeker();
  const name = field(formData, "name");
  const years = parseYears(field(formData, "experienceYears"));
  if (name.length < 2) redirectWith("/profile", { error: "Name is required." });
  if (!years.ok) redirectWith("/profile", { error: "Experience should be a whole number of years, or left blank." });

  await api("/me/profile/basic", {
    method: "PATCH",
    auth: true,
    body: {
      name: name.slice(0, 80),
      headline: field(formData, "headline").slice(0, 120),
      currentCompany: field(formData, "currentCompany").slice(0, 80),
      location: field(formData, "location").slice(0, 80),
      phone: field(formData, "phone").slice(0, 30),
      experienceYears: years.value,
      resumeHeadline: field(formData, "resumeHeadline").slice(0, 160),
      bio: field(formData, "bio").slice(0, 2000),
    },
  });

  refreshProfile();
  redirectWith("/profile", { notice: "Basic details saved." });
}

export async function updateCareerAction(formData: FormData) {
  const session = await requireSeeker();
  const currentCtc = parseMoney(field(formData, "currentCtc"));
  const expectedCtc = parseMoney(field(formData, "expectedCtc"));
  const noticePeriod = field(formData, "noticePeriod");
  const preferredType = field(formData, "preferredType");

  if (!currentCtc.ok || !expectedCtc.ok) {
    redirectWith("/profile", { error: "Salary should be a whole number of rupees per year, or left blank." });
  }
  if (noticePeriod && !NOTICE_PERIODS.some((item) => item === noticePeriod)) {
    redirectWith("/profile", { error: "Pick a notice period from the list." });
  }
  if (preferredType && !JOB_TYPES.some((item) => item.value === preferredType)) {
    redirectWith("/profile", { error: "Pick a job type from the list." });
  }

  await api("/me/profile/career", {
    method: "PATCH",
    auth: true,
    body: {
      currentCtc: currentCtc.value,
      expectedCtc: expectedCtc.value,
      noticePeriod,
      preferredLocations: field(formData, "preferredLocations").slice(0, 120),
      preferredType,
      industry: field(formData, "industry").slice(0, 80),
      department: field(formData, "department").slice(0, 80),
    },
  });

  refreshProfile();
  redirectWith("/profile", { notice: "Career profile saved." });
}

export async function updatePersonalAction(formData: FormData) {
  const session = await requireSeeker();
  const dateOfBirth = field(formData, "dateOfBirth");
  const gender = field(formData, "gender");

  if (dateOfBirth) {
    const parsed = new Date(`${dateOfBirth}T00:00:00`);
    const year = parsed.getFullYear();
    if (Number.isNaN(parsed.getTime()) || year < 1940 || parsed > new Date()) {
      redirectWith("/profile", { error: "Enter a valid date of birth." });
    }
  }
  if (gender && !GENDERS.some((item) => item === gender)) {
    redirectWith("/profile", { error: "Pick a gender option from the list." });
  }

  await api("/me/profile/personal", {
    method: "PATCH",
    auth: true,
    body: { dateOfBirth, gender, languages: field(formData, "languages").slice(0, 120) },
  });

  refreshProfile();
  redirectWith("/profile", { notice: "Personal details saved." });
}

export async function addSkillAction(formData: FormData) {
  const session = await requireSeeker();
  const name = field(formData, "name").replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) {
    redirectWith("/profile", { error: "A skill should be 2–40 characters." });
  }

  try {
    await api("/me/skills", { method: "POST", auth: true, body: { name } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) redirectWith("/profile", { notice: error.message });
    if (error instanceof ApiError) redirectWith("/profile", { error: error.message });
    throw error;
  }

  refreshProfile();
  redirectWith("/profile", { notice: "Skill added." });
}

export async function removeSkillAction(formData: FormData) {
  const session = await requireSeeker();
  await api(`/me/skills/${field(formData, "id")}`, { method: "DELETE", auth: true });
  refreshProfile();
  redirect("/profile");
}

export async function saveEmploymentAction(formData: FormData) {
  const session = await requireSeeker();
  const id = field(formData, "id");
  const designation = field(formData, "designation");
  const company = field(formData, "company");
  const current = formData.getAll("current").includes("true");
  const startMonth = parseMonth(field(formData, "startMonth"));
  const startYear = parseYear(field(formData, "startYear"), false);
  const endMonth = current ? null : parseMonth(field(formData, "endMonth"));
  const endYear = current ? null : parseYear(field(formData, "endYear"), false);

  if (designation.length < 2 || company.length < 2) {
    redirectWith("/profile", { error: "Add the job title and company." });
  }
  if (!startMonth || startYear == null) {
    redirectWith("/profile", { error: "Add the month and year you started." });
  }
  if (!current && (endMonth == null || endYear == null)) {
    redirectWith("/profile", { error: "Add an end date, or mark this as your current job." });
  }
  if (!current && endYear != null && (endYear < startYear || (endYear === startYear && (endMonth ?? 0) < startMonth))) {
    redirectWith("/profile", { error: "The end date can't be before the start date." });
  }

  const data = {
    designation: designation.slice(0, 80),
    company: company.slice(0, 80),
    location: field(formData, "location").slice(0, 80),
    startMonth,
    startYear,
    endMonth,
    endYear,
    current,
    description: field(formData, "description").slice(0, 1000),
  };

  try {
    await api("/me/employment", { method: "POST", auth: true, body: { id, ...data } });
  } catch (error) {
    if (error instanceof ApiError) redirectWith("/profile", { error: error.message });
    throw error;
  }

  refreshProfile();
  redirectWith("/profile", { notice: id ? "Employment updated." : "Employment added." });
}

export async function deleteEmploymentAction(formData: FormData) {
  const session = await requireSeeker();
  await api(`/me/employment/${field(formData, "id")}`, { method: "DELETE", auth: true });
  refreshProfile();
  redirect("/profile");
}

export async function saveEducationAction(formData: FormData) {
  const session = await requireSeeker();
  const id = field(formData, "id");
  const degree = field(formData, "degree");
  const institute = field(formData, "institute");
  const endYear = parseYear(field(formData, "endYear"), false);

  if (degree.length < 2 || institute.length < 2) {
    redirectWith("/profile", { error: "Add the degree and the institute." });
  }
  if (endYear == null) redirectWith("/profile", { error: "Add the year you finished, or expect to finish." });

  const data = {
    degree: degree.slice(0, 80),
    specialization: field(formData, "specialization").slice(0, 80),
    institute: institute.slice(0, 120),
    endYear,
    score: field(formData, "score").slice(0, 40),
  };

  try {
    await api("/me/education", { method: "POST", auth: true, body: { id, ...data } });
  } catch (error) {
    if (error instanceof ApiError) redirectWith("/profile", { error: error.message });
    throw error;
  }

  refreshProfile();
  redirectWith("/profile", { notice: id ? "Education updated." : "Education added." });
}

export async function deleteEducationAction(formData: FormData) {
  const session = await requireSeeker();
  await api(`/me/education/${field(formData, "id")}`, { method: "DELETE", auth: true });
  refreshProfile();
  redirect("/profile");
}
