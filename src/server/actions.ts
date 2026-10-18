"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
import { hasCallablePhone } from "@/lib/resume";
import { APPLICATION_STATUSES, CATEGORIES, COMPANY_SIZES } from "@/lib/constants";
import { clearSessionCookie, getSession, homeFor, safeNext, setSessionCookie } from "@/lib/auth";

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

function refreshBoard(slug?: string) {
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/account");
  revalidatePath("/hire");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/jobs/${slug}`);
}

const emailSchema = z.email("Enter a valid email address.");

export async function signupAction(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const role = field(formData, "role") === "employer" ? "employer" : "seeker";
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const companyName = field(formData, "companyName");
  const back = role === "employer" ? "/signup?role=employer" : "/signup";

  if (name.length < 2 || name.length > 80) redirectWith(back, { error: "Add your name.", next });
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) redirectWith(back, { error: "Enter a valid email address.", next });
  if (password.length < 8 || password.length > 72) {
    redirectWith(back, { error: "Use a password of at least 8 characters.", next });
  }
  if (role === "employer" && companyName.length < 2) {
    redirectWith(back, { error: "Add your company name.", next });
  }

  try {
    const user = await api<{ id: string }>("/auth/signup", {
      method: "POST",
      body: { name, email, password, role, companyName },
    });
    await setSessionCookie(user.id);
  } catch (error) {
    if (error instanceof ApiError) redirectWith(back, { error: error.message, next });
    throw error;
  }
  redirect(next || homeFor(role));
}

export async function loginAction(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  try {
    const user = await api<{ id: string; role: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    await setSessionCookie(user.id);
    redirect(next || homeFor(user.role));
  } catch (error) {
    if (error instanceof ApiError) redirectWith("/login", { error: error.message, next });
    throw error;
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

function cleanWebsite(raw: string) {
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function updateCompanyAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "employer" || !session.companyId) redirect("/employers");

  const name = field(formData, "name");
  const location = field(formData, "location");
  const size = field(formData, "size");
  const about = field(formData, "about");
  const website = cleanWebsite(field(formData, "website"));

  if (name.length < 2) redirectWith("/hire", { error: "Company name is required." });
  if (website == null) redirectWith("/hire", { error: "That website address doesn't look right." });
  if (size && !COMPANY_SIZES.some((item) => item === size)) {
    redirectWith("/hire", { error: "Pick a team size." });
  }

  const contact = readContact(formData);
  if (!contact.ok) redirectWith("/hire", { error: contact.error });

  try {
    await api("/hire/company", {
      method: "PATCH",
      auth: true,
      body: {
        name: name.slice(0, 80),
        location: location.slice(0, 80),
        size,
        about: about.slice(0, 800),
        website,
        hrName: contact.hrName,
        hrPhone: contact.hrPhone,
        hrEmail: contact.hrEmail,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) redirectWith("/hire", { error: error.message });
    throw error;
  }

  revalidatePath("/hire");
  redirectWith("/hire", { notice: "Company profile saved." });
}

export async function applyAction(formData: FormData) {
  const slug = field(formData, "slug");
  const session = await getSession();
  if (!session) redirect(`/login?next=/jobs/${slug}`);
  if (session.role !== "seeker") redirectWith(`/jobs/${slug}`, { error: "Sign in with a job seeker account to apply." });

  const note = field(formData, "note");
  if (note.length < 20) redirectWith(`/jobs/${slug}`, { error: "Write at least a couple of sentences." });
  if (note.length > 2000) redirectWith(`/jobs/${slug}`, { error: "Keep the note under 2,000 characters." });

  try {
    await api(`/jobs/${slug}/apply`, { method: "POST", auth: true, body: { note } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      redirectWith(`/jobs/${slug}`, { notice: error.message });
    }
    if (error instanceof ApiError && error.status === 404) redirect("/jobs");
    if (error instanceof ApiError) redirectWith(`/jobs/${slug}`, { error: error.message });
    throw error;
  }

  refreshBoard(slug);
  redirectWith(`/jobs/${slug}`, {
    notice: "Application sent. The company has your full resume, including your phone number.",
  });
}

export async function saveJobAction(formData: FormData) {
  const slug = field(formData, "slug");
  const session = await getSession();
  if (!session) redirect(`/login?next=/jobs/${slug}`);
  if (session.role !== "seeker") redirectWith(`/jobs/${slug}`, { error: "Saving roles is for job seeker accounts." });

  try {
    await api(`/jobs/${slug}/save`, { method: "POST", auth: true });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) redirect("/jobs");
    if (error instanceof ApiError) redirectWith(`/jobs/${slug}`, { error: error.message });
    throw error;
  }

  revalidatePath("/account");
  redirectWith(`/jobs/${slug}`, { notice: "Saved to your desk." });
}

export async function unsaveJobAction(formData: FormData) {
  const slug = field(formData, "slug");
  const returnTo = safeNext(formData.get("returnTo"));
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  if (slug) await api(`/jobs/${slug}/save`, { method: "DELETE", auth: true });

  revalidatePath("/account");
  redirect(returnTo || (slug ? `/jobs/${slug}` : "/account"));
}

export async function createAlertAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "seeker") redirect("/login?next=/account");

  const keyword = field(formData, "keyword");
  const location = field(formData, "location");
  const category = field(formData, "category");

  if (keyword.length < 2) redirectWith("/account", { error: "An alert needs a keyword, like Design or Backend." });
  if (category && !CATEGORIES.some((item) => item === category)) {
    redirectWith("/account", { error: "Pick a category from the list." });
  }

  try {
    await api("/me/alerts", {
      method: "POST",
      auth: true,
      body: { keyword: keyword.slice(0, 60), location: location.slice(0, 60), category },
    });
  } catch (error) {
    if (error instanceof ApiError) redirectWith("/account", { error: error.message });
    throw error;
  }

  revalidatePath("/account");
  redirectWith("/account", { notice: "Alert saved. Matching open roles are listed under it." });
}

export async function deleteAlertAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  const id = field(formData, "id");
  await api(`/me/alerts/${id}`, { method: "DELETE", auth: true });
  revalidatePath("/account");
  redirect("/account");
}

const jobSchema = z.object({
  title: z.string().trim().min(4, "Add a clear job title.").max(100),
  location: z.string().trim().min(2, "Add a city, or Remote.").max(80),
  workplace: z.enum(["remote", "hybrid", "onsite"]),
  type: z.enum(["full-time", "part-time", "contract", "internship"]),
  experience: z.enum(["fresher", "1-3", "3-6", "6+"]),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(40, "Describe the role in a few sentences.").max(5000),
  requirements: z.string().trim().min(4, "Add at least one requirement.").max(3000),
  status: z.enum(["open", "closed"]).optional(),
});

function readContact(formData: FormData) {
  const hrName = field(formData, "hrName").slice(0, 80);
  const hrPhone = field(formData, "hrPhone").slice(0, 24);
  const hrEmail = field(formData, "hrEmail").slice(0, 120).toLowerCase();
  if (hrName.length < 2) return { ok: false as const, error: "Add the HR name candidates will see." };
  if (!hasCallablePhone(hrPhone)) return { ok: false as const, error: "Add an HR phone number with at least 10 digits." };
  if (hrEmail && !z.email().safeParse(hrEmail).success) {
    return { ok: false as const, error: "That HR email doesn't look right." };
  }
  return { ok: true as const, hrName, hrPhone, hrEmail };
}

function parseMoney(raw: string) {
  if (!raw) return { ok: true as const, value: null };
  if (!/^\d+$/.test(raw)) return { ok: false as const };
  const value = Number(raw);
  if (value > 100_000_000) return { ok: false as const };
  return { ok: true as const, value };
}

function readJob(formData: FormData, includeStatus: boolean) {
  const parsed = jobSchema.safeParse({
    title: field(formData, "title"),
    location: field(formData, "location"),
    workplace: field(formData, "workplace"),
    type: field(formData, "type"),
    experience: field(formData, "experience"),
    category: field(formData, "category"),
    description: field(formData, "description"),
    requirements: field(formData, "requirements"),
    status: includeStatus ? field(formData, "status") : undefined,
  });
  return parsed;
}

export async function setCompanyAccessAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login?next=/admin");

  const id = field(formData, "id");
  const approved = field(formData, "approved") === "true";
  let company: { name: string; approved: boolean };
  try {
    company = await api(`/admin/companies/${id}`, { method: "PATCH", auth: true, body: { approved } });
  } catch (error) {
    if (error instanceof ApiError) redirect("/admin");
    throw error;
  }
  revalidatePath("/admin");
  revalidatePath("/hire");
  revalidatePath("/hire/new");
  redirectWith("/admin", {
    notice: company.approved ? `${company.name} can post jobs.` : `${company.name} can no longer post jobs.`,
  });
}

export async function createJobAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "employer" || !session.companyId) redirect("/employers");

  const parsed = readJob(formData, false);
  if (!parsed.success) redirectWith("/hire/new", { error: parsed.error.issues[0]?.message ?? "Check the form." });

  const salaryMin = parseMoney(field(formData, "salaryMin"));
  const salaryMax = parseMoney(field(formData, "salaryMax"));
  if (!salaryMin.ok || !salaryMax.ok) redirectWith("/hire/new", { error: "Salary should be a whole number of rupees, or left blank." });
  if (salaryMin.value != null && salaryMax.value != null && salaryMin.value > salaryMax.value) {
    redirectWith("/hire/new", { error: "Minimum salary can't be higher than the maximum." });
  }

  const contact = readContact(formData);
  if (!contact.ok) redirectWith("/hire/new", { error: contact.error });

  let job: { id: string; slug: string };
  try {
    job = await api("/hire/jobs", {
      method: "POST",
      auth: true,
      body: {
        ...parsed.data,
        salaryMin: salaryMin.value,
        salaryMax: salaryMax.value,
        hrName: contact.hrName,
        hrPhone: contact.hrPhone,
        hrEmail: contact.hrEmail,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) redirectWith("/hire/new", { error: error.message });
    throw error;
  }

  refreshBoard(job.slug);
  redirectWith(`/hire/jobs/${job.id}`, { notice: "Role is live on the board." });
}

export async function updateJobAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "employer" || !session.companyId) redirect("/employers");

  const id = field(formData, "id");
  const back = `/hire/jobs/${id}`;
  const parsed = readJob(formData, true);
  if (!parsed.success) redirectWith(back, { error: parsed.error.issues[0]?.message ?? "Check the form." });

  const salaryMin = parseMoney(field(formData, "salaryMin"));
  const salaryMax = parseMoney(field(formData, "salaryMax"));
  if (!salaryMin.ok || !salaryMax.ok) redirectWith(back, { error: "Salary should be a whole number of rupees, or left blank." });
  if (salaryMin.value != null && salaryMax.value != null && salaryMin.value > salaryMax.value) {
    redirectWith(back, { error: "Minimum salary can't be higher than the maximum." });
  }

  const contact = readContact(formData);
  if (!contact.ok) redirectWith(back, { error: contact.error });

  let existing: { slug: string };
  try {
    existing = await api(`/hire/jobs/${id}`, {
      method: "PATCH",
      auth: true,
      body: {
        ...parsed.data,
        salaryMin: salaryMin.value,
        salaryMax: salaryMax.value,
        hrName: contact.hrName,
        hrPhone: contact.hrPhone,
        hrEmail: contact.hrEmail,
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) redirect("/hire");
    if (error instanceof ApiError) redirectWith(back, { error: error.message });
    throw error;
  }

  refreshBoard(existing.slug);
  redirectWith(back, { notice: "Role updated." });
}

export async function setApplicationStatusAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "employer" || !session.companyId) redirect("/employers");

  const applicationId = field(formData, "applicationId");
  const status = field(formData, "status");
  if (!APPLICATION_STATUSES.some((item) => item.value === status)) redirect("/hire");

  let application: { jobId: string };
  try {
    application = await api(`/hire/applications/${applicationId}`, {
      method: "PATCH",
      auth: true,
      body: { status },
    });
  } catch (error) {
    if (error instanceof ApiError) redirect("/hire");
    throw error;
  }
  revalidatePath(`/hire/jobs/${application.jobId}`);
  revalidatePath("/account");
  redirectWith(`/hire/jobs/${application.jobId}`, { notice: "Applicant status updated." });
}

export async function setJobFlagsAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login?next=/admin");

  const id = field(formData, "id");
  const status = field(formData, "status");
  const featured = field(formData, "featured");
  let job: { slug: string };
  try {
    job = await api(`/admin/jobs/${id}`, {
      method: "PATCH",
      auth: true,
      body: {
        status: status === "open" || status === "closed" ? status : null,
        featured: featured === "true" ? true : featured === "false" ? false : null,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) redirect("/admin");
    throw error;
  }

  refreshBoard(job.slug);
  redirectWith("/admin", { notice: "Listing updated." });
}
