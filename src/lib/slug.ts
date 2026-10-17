import { prisma } from "@/lib/db";

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function uniqueCompanySlug(name: string) {
  const base = slugify(name) || "company";
  let slug = base;
  let index = 2;
  while (await prisma.company.findUnique({ where: { slug } })) {
    slug = `${base}-${index++}`;
  }
  return slug;
}

export async function uniqueJobSlug(title: string) {
  const base = slugify(title) || "role";
  let slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  while (await prisma.job.findUnique({ where: { slug } })) {
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}
