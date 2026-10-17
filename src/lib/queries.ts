import { Prisma } from "@prisma/client";
import { cache } from "react";
import type { JobFilters } from "@/lib/constants";
import { prisma } from "@/lib/db";

export const jobCardInclude = { company: true } satisfies Prisma.JobInclude;

export type JobCard = Prisma.JobGetPayload<{ include: typeof jobCardInclude }>;

export function buildJobWhere(filters: JobFilters): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = { status: "open" };
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q } },
      { description: { contains: filters.q } },
      { category: { contains: filters.q } },
      { company: { name: { contains: filters.q } } },
    ];
  }
  if (filters.location) where.location = { contains: filters.location };
  if (filters.category) where.category = filters.category;
  if (filters.type) where.type = filters.type;
  if (filters.workplace) where.workplace = filters.workplace;
  if (filters.experience) where.experience = filters.experience;
  return where;
}

export async function listJobs(filters: JobFilters) {
  return prisma.job.findMany({
    where: buildJobWhere(filters),
    include: jobCardInclude,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
}

export const getOpenJob = cache(async (slug: string) => {
  return prisma.job.findFirst({
    where: { slug, status: "open" },
    include: { company: true },
  });
});

export const getCompanyBySlug = cache(async (slug: string) => {
  return prisma.company.findUnique({ where: { slug } });
});

export async function jobsForAlert(alert: { keyword: string; location: string; category: string }) {
  return prisma.job.findMany({
    where: {
      status: "open",
      ...(alert.keyword
        ? {
            OR: [
              { title: { contains: alert.keyword } },
              { category: { contains: alert.keyword } },
              { description: { contains: alert.keyword } },
            ],
          }
        : {}),
      ...(alert.location ? { location: { contains: alert.location } } : {}),
      ...(alert.category ? { category: alert.category } : {}),
    },
    include: jobCardInclude,
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}
