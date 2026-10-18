import { Prisma, PrismaClient } from "@prisma/client";
import type { SeekerProfile } from "../src/lib/profile";
import { buildResume } from "../src/lib/resume";

const seekerProfileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  headline: true,
  resumeHeadline: true,
  location: true,
  bio: true,
  experienceYears: true,
  currentCompany: true,
  currentCtc: true,
  expectedCtc: true,
  noticePeriod: true,
  preferredLocations: true,
  preferredType: true,
  dateOfBirth: true,
  gender: true,
  languages: true,
  industry: true,
  department: true,
  skills: { select: { id: true, name: true } },
  employments: {
    select: {
      id: true,
      designation: true,
      company: true,
      location: true,
      startMonth: true,
      startYear: true,
      endMonth: true,
      endYear: true,
      current: true,
      description: true,
    },
  },
  educations: {
    select: { id: true, degree: true, specialization: true, institute: true, endYear: true, score: true },
  },
} satisfies Prisma.UserSelect;

const contacts: Record<string, { hrName: string; hrPhone: string; hrEmail: string }> = {
  northline: { hrName: "Meera Kapoor", hrPhone: "+91 98450 22001", hrEmail: "meera@northline.in" },
  "kaveri-health": { hrName: "Lakshmi Rao", hrPhone: "+91 98490 22110", hrEmail: "hr@kaveri.example" },
  fieldnote: { hrName: "Vikram Shah", hrPhone: "+91 98200 11880", hrEmail: "vikram@fieldnote.in" },
  sable: { hrName: "Neha Malhotra", hrPhone: "+91 98100 44550", hrEmail: "hr@sable.example" },
  "loom-and-co": { hrName: "Ananya Deshpande", hrPhone: "+91 98810 33440", hrEmail: "hr@loomandco.example" },
  halcyon: { hrName: "Arjun Mehta", hrPhone: "+91 99001 77880", hrEmail: "hr@halcyon.example" },
  mintwork: { hrName: "Priya Nair", hrPhone: "+91 97310 55660", hrEmail: "hr@mintwork.example" },
  aranya: { hrName: "Karan Patel", hrPhone: "+91 98790 33440", hrEmail: "hr@aranya.example" },
};

const prisma = new PrismaClient();

async function main() {
  for (const [slug, hr] of Object.entries(contacts)) {
    await prisma.company.updateMany({ where: { slug, hrPhone: "" }, data: hr });
    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company) continue;
    await prisma.job.updateMany({
      where: { companyId: company.id, hrPhone: "" },
      data: {
        hrName: company.hrName || hr.hrName,
        hrPhone: company.hrPhone || hr.hrPhone,
        hrEmail: company.hrEmail || hr.hrEmail,
      },
    });
  }

  const applications = await prisma.application.findMany({
    where: { resumeJson: "" },
    include: { user: { select: seekerProfileSelect } },
  });

  for (const application of applications) {
    await prisma.application.update({
      where: { id: application.id },
      data: { resumeJson: JSON.stringify(buildResume(application.user as SeekerProfile)) },
    });
  }

  console.log(`Backfilled HR contacts and ${applications.length} resumes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
