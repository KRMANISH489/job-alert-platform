import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { seekerProfileSelect } from "../src/lib/profile";
import { buildResume } from "../src/lib/resume";

const prisma = new PrismaClient();

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

const companies = [
  {
    slug: "northline",
    name: "Northline",
    location: "Bengaluru",
    size: "51–200",
    website: "https://northline.example",
    about: "Northline builds internal tools for operations teams that have outgrown spreadsheets.",
    hrName: "Meera Kapoor",
    hrPhone: "+91 98450 22001",
    hrEmail: "meera@northline.in",
  },
  {
    slug: "kaveri-health",
    name: "Kaveri Health",
    location: "Hyderabad",
    size: "201–500",
    website: "https://kaveri.example",
    about: "Kaveri Health runs clinics and the software those clinics actually use day to day.",
    hrName: "Lakshmi Rao",
    hrPhone: "+91 98490 22110",
    hrEmail: "hr@kaveri.example",
  },
  {
    slug: "fieldnote",
    name: "Fieldnote",
    location: "Mumbai",
    size: "11–50",
    website: "https://fieldnote.example",
    about: "Fieldnote is a payments company for businesses that still collect money in person.",
    hrName: "Vikram Shah",
    hrPhone: "+91 98200 11880",
    hrEmail: "vikram@fieldnote.in",
  },
  {
    slug: "sable",
    name: "Sable Logistics",
    location: "Delhi",
    size: "201–500",
    website: "https://sable.example",
    about: "Sable moves freight across India and is replacing a decade of legacy dispatch software.",
    hrName: "Neha Malhotra",
    hrPhone: "+91 98100 44550",
    hrEmail: "hr@sable.example",
  },
  {
    slug: "loom-and-co",
    name: "Loom & Co",
    location: "Pune",
    size: "11–50",
    website: "https://loomandco.example",
    about: "Loom & Co makes commerce software for independent clothing labels.",
    hrName: "Ananya Deshpande",
    hrPhone: "+91 98810 33440",
    hrEmail: "hr@loomandco.example",
  },
  {
    slug: "halcyon",
    name: "Halcyon Analytics",
    location: "Remote",
    size: "11–50",
    website: "https://halcyon.example",
    about: "Halcyon helps finance teams see what their numbers are actually saying.",
    hrName: "Arjun Mehta",
    hrPhone: "+91 99001 77880",
    hrEmail: "hr@halcyon.example",
  },
  {
    slug: "mintwork",
    name: "Mintwork",
    location: "Bengaluru",
    size: "51–200",
    website: "https://mintwork.example",
    about: "Mintwork is hiring software for companies that hire a lot of people.",
    hrName: "Priya Nair",
    hrPhone: "+91 97310 55660",
    hrEmail: "hr@mintwork.example",
  },
  {
    slug: "aranya",
    name: "Aranya Energy",
    location: "Ahmedabad",
    size: "51–200",
    website: "https://aranya.example",
    about: "Aranya develops rooftop solar projects and the models that price them.",
    hrName: "Karan Patel",
    hrPhone: "+91 98790 33440",
    hrEmail: "hr@aranya.example",
  },
];

const jobs = [
  {
    slug: "senior-product-designer",
    title: "Senior Product Designer",
    company: "loom-and-co",
    location: "Pune",
    workplace: "hybrid",
    type: "full-time",
    experience: "3-6",
    category: "Design",
    salaryMin: 1800000,
    salaryMax: 2800000,
    featured: true,
    daysAgo: 1,
    description:
      "Loom & Co is rebuilding the storefront tools used by independent labels. You will own the merchant dashboard, from the first sketch to the shipped interface.\n\nThis is a hands-on role. You will sit with engineering, talk to merchants every week, and care as much about the empty state as the main flow.",
    requirements: ["A portfolio of shipped product work, not only concepts", "Comfortable in Figma and in critique", "4+ years designing web software", "Clear writing"].join("\n"),
  },
  {
    slug: "backend-engineer",
    title: "Backend Engineer",
    company: "northline",
    location: "Bengaluru",
    workplace: "hybrid",
    type: "full-time",
    experience: "3-6",
    category: "Engineering",
    salaryMin: 2400000,
    salaryMax: 3600000,
    featured: true,
    daysAgo: 2,
    description:
      "Northline's core product is a workflow engine used by warehouse and finance teams. You will design APIs, keep Postgres honest, and make background jobs boring in the best way.\n\nThe team is small. You will review code, talk to a customer when a workflow breaks, and leave the system easier to operate than you found it.",
    requirements: ["Strong experience with Node, Go, or Python", "You have run Postgres in production", "You write tests for the paths that matter", "Comfortable with on-call a few weeks a year"].join("\n"),
  },
  {
    slug: "founding-product-manager",
    title: "Founding Product Manager",
    company: "fieldnote",
    location: "Mumbai",
    workplace: "onsite",
    type: "full-time",
    experience: "6+",
    category: "Product",
    salaryMin: 3200000,
    salaryMax: 4500000,
    featured: true,
    daysAgo: 0,
    description:
      "Fieldnote is hiring its first product manager. Merchants use the product to take payments at the counter and reconcile them the same evening.\n\nYou will decide what not to build, write the spec, and sit with shop owners in Mumbai until the flow is obvious.",
    requirements: ["You have owned a product used by non-technical people", "You can write a one-page spec", "You are happy to be in the office most days", "Experience in fintech is useful, not required"].join("\n"),
  },
  {
    slug: "data-analyst",
    title: "Data Analyst",
    company: "halcyon",
    location: "Remote",
    workplace: "remote",
    type: "full-time",
    experience: "1-3",
    category: "Data",
    salaryMin: 1200000,
    salaryMax: 1800000,
    featured: false,
    daysAgo: 3,
    description:
      "Halcyon turns messy finance exports into a weekly picture a CFO can trust. You will write SQL, check that a number means what we say it means, and explain the gap when it doesn't.\n\nThe team is remote across India. Overlap with 11:00 to 16:00 IST is expected.",
    requirements: ["Fluent SQL", "You have built a dashboard someone used more than once", "Comfortable questioning a metric", "Sheets and a notebook are both fine"].join("\n"),
  },
  {
    slug: "growth-marketer",
    title: "Growth Marketer",
    company: "mintwork",
    location: "Bengaluru",
    workplace: "hybrid",
    type: "full-time",
    experience: "1-3",
    category: "Marketing",
    salaryMin: 1000000,
    salaryMax: 1600000,
    featured: false,
    daysAgo: 4,
    description:
      "Mintwork sells to talent teams. You will run a small number of campaigns properly: one landing page, one email sequence, one honest report on what converted.\n\nWe care more about a clear experiment than a large media plan.",
    requirements: ["You have written pages that produced pipeline", "You can set up a basic analytics view", "You edit your own copy", "2+ years in B2B marketing"].join("\n"),
  },
  {
    slug: "account-executive",
    title: "Account Executive",
    company: "fieldnote",
    location: "Mumbai",
    workplace: "hybrid",
    type: "full-time",
    experience: "1-3",
    category: "Sales",
    salaryMin: 800000,
    salaryMax: 1400000,
    featured: false,
    daysAgo: 5,
    description:
      "You will sell Fieldnote to retail chains and multi-outlet businesses in western India. The cycle is short. Most deals start with a shop visit.\n\nBase plus a clear commission. We will share the plan before you join.",
    requirements: ["You have carried a quota", "You like meeting customers in person", "Comfortable with a simple CRM", "Hindi and English"].join("\n"),
  },
  {
    slug: "people-operations-lead",
    title: "People Operations Lead",
    company: "northline",
    location: "Bengaluru",
    workplace: "onsite",
    type: "full-time",
    experience: "6+",
    category: "Operations",
    salaryMin: 1800000,
    salaryMax: 2600000,
    featured: false,
    daysAgo: 6,
    description:
      "Northline is about 80 people and the people systems are starting to creak. You will own hiring operations, onboarding, and the basics of performance — without turning it into a process maze.\n\nYou will work beside the founders, not under a large HR department.",
    requirements: ["You have built hiring operations at a growing company", "You write clearly", "You are calm when a process is late", "Based in Bengaluru, in the office three days a week"].join("\n"),
  },
  {
    slug: "finance-associate",
    title: "Finance Associate",
    company: "sable",
    location: "Delhi",
    workplace: "onsite",
    type: "full-time",
    experience: "1-3",
    category: "Finance",
    salaryMin: 800000,
    salaryMax: 1200000,
    featured: false,
    daysAgo: 2,
    description:
      "Sable's finance team closes the books for a freight business with hundreds of lanes. You will own vendor reconciliations, help with monthly close, and flag the numbers that do not tie.\n\nThis is an in-office role in Delhi.",
    requirements: ["1–3 years in accounting or FP&A", "Careful with spreadsheets", "You have closed a month, or sat next to someone who did", "Comfortable asking when a number looks wrong"].join("\n"),
  },
  {
    slug: "frontend-engineer",
    title: "Frontend Engineer",
    company: "mintwork",
    location: "Remote",
    workplace: "remote",
    type: "full-time",
    experience: "3-6",
    category: "Engineering",
    salaryMin: 2000000,
    salaryMax: 3000000,
    featured: false,
    daysAgo: 1,
    description:
      "Mintwork's product is a dense hiring tool. You will build the screens recruiters live in all day: lists, filters, and the small states that make a tool feel finished.\n\nThe stack is TypeScript and React. Remote from anywhere in India.",
    requirements: ["Strong React and TypeScript", "You care about keyboard use and loading states", "You have shipped a product UI, not only marketing pages", "You communicate in writing"].join("\n"),
  },
  {
    slug: "clinical-ops-coordinator",
    title: "Clinical Ops Coordinator",
    company: "kaveri-health",
    location: "Hyderabad",
    workplace: "onsite",
    type: "full-time",
    experience: "1-3",
    category: "Operations",
    salaryMin: 700000,
    salaryMax: 1100000,
    featured: false,
    daysAgo: 7,
    description:
      "Kaveri's clinics need someone who can keep appointments, lab follow-ups, and staffing from slipping. You will be the person nurses call when the day plan breaks.\n\nTraining is provided. Healthcare experience helps, operational calm matters more.",
    requirements: ["You have coordinated a busy front desk, clinic, or similar", "Reliable with a roster and a phone", "Based in Hyderabad", "Telugu or Hindi, plus English"].join("\n"),
  },
  {
    slug: "brand-designer",
    title: "Brand Designer",
    company: "loom-and-co",
    location: "Pune",
    workplace: "hybrid",
    type: "full-time",
    experience: "1-3",
    category: "Design",
    salaryMin: 1000000,
    salaryMax: 1500000,
    featured: false,
    daysAgo: 3,
    description:
      "Loom & Co is about to refresh how the product looks in the world: the site, the deck, the emails merchants actually open. You will build a small system and then use it.\n\nYou will work next to the product designer, not in a separate brand silo.",
    requirements: ["A portfolio with identity and layout work", "You can design in a grid and also break it on purpose", "2+ years in a studio or in-house team", "Based in Pune or willing to move"].join("\n"),
  },
  {
    slug: "energy-analyst",
    title: "Energy Analyst",
    company: "aranya",
    location: "Ahmedabad",
    workplace: "hybrid",
    type: "full-time",
    experience: "1-3",
    category: "Data",
    salaryMin: 900000,
    salaryMax: 1400000,
    featured: false,
    daysAgo: 4,
    description:
      "Aranya prices rooftop solar projects. You will build the sheets and models that turn a site survey into a number a customer can sign.\n\nYou do not need to be an engineer. You do need to be careful, and curious about how a tariff actually works.",
    requirements: ["Strong spreadsheet modeling", "You can explain a model to someone who did not build it", "Interest in energy or infrastructure", "Ahmedabad, three days a week in office"].join("\n"),
  },
  {
    slug: "support-engineer",
    title: "Support Engineer",
    company: "sable",
    location: "Delhi",
    workplace: "onsite",
    type: "full-time",
    experience: "fresher",
    category: "Engineering",
    salaryMin: 500000,
    salaryMax: 800000,
    featured: false,
    daysAgo: 8,
    description:
      "Dispatch teams call when a shipment status looks wrong. You will reproduce the issue, write it down clearly, and either fix the small ones or hand a precise note to engineering.\n\nThis is a first job. We will teach the codebase. We cannot teach curiosity.",
    requirements: ["A degree or a serious project in any technical field", "You can write a clear bug report", "Patient on the phone", "Delhi, on-site"].join("\n"),
  },
  {
    slug: "contract-recruiter",
    title: "Contract Recruiter",
    company: "mintwork",
    location: "Remote",
    workplace: "remote",
    type: "contract",
    experience: "3-6",
    category: "Operations",
    salaryMin: 1500000,
    salaryMax: 2200000,
    featured: false,
    daysAgo: 2,
    description:
      "A six-month contract to hire engineers and designers for Mintwork's own team, and to pressure-test the product while you do it.\n\nYou will run the process end to end. The rate above is the annualised contract range.",
    requirements: ["You have hired technical people before", "You write thoughtful outreach", "Available to start within a month", "Remote, with overlap on IST afternoons"].join("\n"),
  },
  {
    slug: "product-design-intern",
    title: "Product Design Intern",
    company: "loom-and-co",
    location: "Pune",
    workplace: "hybrid",
    type: "internship",
    experience: "fresher",
    category: "Design",
    salaryMin: 300000,
    salaryMax: 450000,
    featured: false,
    daysAgo: 1,
    description:
      "A six-month internship beside the product design team. You will take a real slice of the merchant dashboard, not a fake brief.\n\nThe stipend is paid monthly. Final-year students and recent graduates are both welcome.",
    requirements: ["A portfolio, even if it is mostly studio work", "You can take a critique without disappearing", "Available in Pune at least three days a week", "Start date within two months"].join("\n"),
  },
  {
    slug: "staff-backend-engineer",
    title: "Staff Backend Engineer",
    company: "fieldnote",
    location: "Mumbai",
    workplace: "hybrid",
    type: "full-time",
    experience: "6+",
    category: "Engineering",
    salaryMin: 4500000,
    salaryMax: 6000000,
    featured: true,
    daysAgo: 0,
    description:
      "Payments at the counter cannot be almost right. You will lead the ledger, the retries, and the way we explain a failed payment to a merchant.\n\nThis is a senior role. You will set the standard for how the backend is reviewed and operated.",
    requirements: ["You have owned a ledger, billing system, or similar money path", "You can mentor without taking over", "Production experience with a relational database", "Mumbai, hybrid"].join("\n"),
  },
  {
    slug: "weekend-content-editor",
    title: "Weekend Content Editor",
    company: "loom-and-co",
    location: "Pune",
    workplace: "remote",
    type: "part-time",
    experience: "1-3",
    category: "Marketing",
    salaryMin: 400000,
    salaryMax: 600000,
    featured: false,
    daysAgo: 5,
    description:
      "Two days a week editing the guides Loom & Co sends to clothing labels: product updates, a short essay, the occasional launch note.\n\nYou will work with the founder on Fridays and publish on Monday. The pay above is the annual part-time range.",
    requirements: ["You have edited for a product or a magazine", "You can cut a paragraph in half", "A portfolio of published writing", "Available Friday and one other weekday"].join("\n"),
  },
];

async function main() {
  await prisma.application.deleteMany();
  await prisma.savedJob.deleteMany();
  await prisma.jobAlert.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.employment.deleteMany();
  await prisma.education.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await hash("demo1234", 10);
  const createdCompanies = await Promise.all(companies.map((company) => prisma.company.create({ data: company })));
  const companyId = Object.fromEntries(createdCompanies.map((company) => [company.slug, company.id]));

  await prisma.user.create({
    data: {
      email: "admin@jobalert.app",
      name: "JobAlert Admin",
      passwordHash,
      role: "admin",
    },
  });

  const aisha = await prisma.user.create({
    data: {
      email: "aisha@jobalert.app",
      name: "Aisha Sen",
      passwordHash,
      role: "seeker",
      headline: "Product Designer",
      resumeHeadline: "Product designer with 5 years building calm tools for operators",
      location: "Pune",
      phone: "+91 98450 11220",
      bio: "I design product flows for people who use software all day: merchants, warehouse leads, and clinic staff. The last five years have been spent on dashboards, empty states, and the sentence a user reads when something fails.\n\nI am looking for a product team that ships weekly and talks to customers. Portfolio: aisha.example",
      experienceYears: 5,
      currentCompany: "Paperkite",
      currentCtc: 1600000,
      expectedCtc: 2400000,
      noticePeriod: "30 days",
      preferredLocations: "Pune, Bengaluru, Remote",
      preferredType: "full-time",
      dateOfBirth: "1996-08-19",
      gender: "Female",
      languages: "English, Hindi, Marathi",
      industry: "Internet",
      department: "Design",
      skills: {
        create: ["Figma", "User research", "Design systems", "Prototyping", "UX writing"].map((name) => ({
          name,
          nameKey: name.toLowerCase(),
        })),
      },
      employments: {
        create: [
          {
            designation: "Product Designer",
            company: "Paperkite",
            location: "Pune",
            startMonth: 3,
            startYear: 2023,
            current: true,
            description: "Own the merchant dashboard. Weekly interviews with clothing labels, then the interface that comes out of them.",
          },
          {
            designation: "Product Designer",
            company: "Field & Form",
            location: "Pune",
            startMonth: 6,
            startYear: 2021,
            endMonth: 2,
            endYear: 2023,
            description: "Designed onboarding and billing for a studio tool used by about 400 teams.",
          },
          {
            designation: "UI Designer",
            company: "Brightlane",
            location: "Mumbai",
            startMonth: 7,
            startYear: 2019,
            endMonth: 5,
            endYear: 2021,
            description: "Marketing pages and the first version of the product UI.",
          },
        ],
      },
      educations: {
        create: [
          {
            degree: "B.Des",
            specialization: "Communication Design",
            institute: "Maya Institute of Design, Pune",
            endYear: 2019,
            score: "8.4 CGPA",
          },
        ],
      },
    },
  });

  const rohan = await prisma.user.create({
    data: {
      email: "rohan@jobalert.app",
      name: "Rohan Iyer",
      passwordHash,
      role: "seeker",
      headline: "Backend Engineer",
      resumeHeadline: "Backend engineer, 6 years, Postgres and the jobs that run at night",
      location: "Bengaluru",
      phone: "+91 99000 22110",
      bio: "I build the unglamorous parts of product systems: retries, ledgers, and the page that explains why a number does not match. Six years across logistics and fintech.\n\nI want a team that treats production incidents as design problems, not heroics.",
      experienceYears: 6,
      currentCompany: "Harbor Systems",
      currentCtc: 2800000,
      expectedCtc: 4000000,
      noticePeriod: "60 days",
      preferredLocations: "Bengaluru, Mumbai, Remote",
      preferredType: "full-time",
      dateOfBirth: "1995-01-09",
      gender: "Male",
      languages: "English, Hindi, Tamil",
      industry: "IT Services",
      department: "Engineering",
      skills: {
        create: ["Node.js", "PostgreSQL", "TypeScript", "Redis", "System design"].map((name) => ({
          name,
          nameKey: name.toLowerCase(),
        })),
      },
      employments: {
        create: [
          {
            designation: "Senior Backend Engineer",
            company: "Harbor Systems",
            location: "Bengaluru",
            startMonth: 4,
            startYear: 2022,
            current: true,
            description: "Own settlement reports and the worker queue that retries failed shipments.",
          },
          {
            designation: "Backend Engineer",
            company: "Sable Logistics",
            location: "Delhi",
            startMonth: 8,
            startYear: 2019,
            endMonth: 3,
            endYear: 2022,
            description: "Built dispatch APIs and the first version of lane-level reporting.",
          },
        ],
      },
      educations: {
        create: [
          {
            degree: "B.E.",
            specialization: "Computer Science",
            institute: "Southline Institute of Technology, Bengaluru",
            endYear: 2018,
            score: "8.1 CGPA",
          },
        ],
      },
    },
  });

  await prisma.user.create({
    data: {
      email: "meera@northline.in",
      name: "Meera Kapoor",
      passwordHash,
      role: "employer",
      companyId: companyId["northline"],
    },
  });

  await prisma.user.create({
    data: {
      email: "vikram@fieldnote.in",
      name: "Vikram Shah",
      passwordHash,
      role: "employer",
      companyId: companyId.fieldnote,
    },
  });

  const hiring = Object.fromEntries(companies.map((company) => [company.slug, company]));

  for (const job of jobs) {
    const { company, daysAgo: age, ...rest } = job;
    const hr = hiring[company];
    await prisma.job.create({
      data: {
        ...rest,
        companyId: companyId[company],
        hrName: hr.hrName,
        hrPhone: hr.hrPhone,
        hrEmail: hr.hrEmail,
        createdAt: daysAgo(age),
        status: "open",
        currency: "INR",
      },
    });
  }

  const designer = await prisma.job.findUniqueOrThrow({ where: { slug: "senior-product-designer" } });
  const brand = await prisma.job.findUniqueOrThrow({ where: { slug: "brand-designer" } });
  const backend = await prisma.job.findUniqueOrThrow({ where: { slug: "backend-engineer" } });
  const staff = await prisma.job.findUniqueOrThrow({ where: { slug: "staff-backend-engineer" } });
  const founding = await prisma.job.findUniqueOrThrow({ where: { slug: "founding-product-manager" } });
  const aishaProfile = await prisma.user.findUniqueOrThrow({ where: { id: aisha.id }, select: seekerProfileSelect });
  const rohanProfile = await prisma.user.findUniqueOrThrow({ where: { id: rohan.id }, select: seekerProfileSelect });
  const aishaResume = JSON.stringify(buildResume(aishaProfile));
  const rohanResume = JSON.stringify(buildResume(rohanProfile));

  await prisma.application.create({
    data: {
      jobId: designer.id,
      userId: aisha.id,
      resumeJson: aishaResume,
      status: "shortlisted",
      createdAt: daysAgo(1),
      note: "I have spent the last three years on merchant tools, including a catalog editor that labels still use. The empty states in your dashboard brief are the part I would want to get right first. Portfolio: aisha.example",
    },
  });

  await prisma.application.create({
    data: {
      jobId: brand.id,
      userId: aisha.id,
      resumeJson: aishaResume,
      status: "submitted",
      createdAt: daysAgo(0),
      note: "Brand and product have been the same job at both of my last teams. I can show a small identity system and the product screens that came out of it. Happy to share the deck.",
    },
  });

  await prisma.application.create({
    data: {
      jobId: backend.id,
      userId: rohan.id,
      resumeJson: rohanResume,
      status: "reviewing",
      createdAt: daysAgo(2),
      note: "I have run a Postgres-backed workflow service for a logistics company: retries, idempotency keys, and a weekly page on what failed. Northline's problem sounds familiar. I can start after a three-week notice.",
    },
  });

  await prisma.application.create({
    data: {
      jobId: staff.id,
      userId: rohan.id,
      resumeJson: rohanResume,
      status: "submitted",
      createdAt: daysAgo(0),
      note: "The ledger work is the part I want. I have not owned a payments ledger end to end, but I have owned settlement reports that finance signed off on. I would like to talk about the gap honestly.",
    },
  });

  await prisma.savedJob.create({ data: { userId: aisha.id, jobId: founding.id, createdAt: daysAgo(1) } });
  await prisma.savedJob.create({ data: { userId: rohan.id, jobId: staff.id, createdAt: daysAgo(0) } });

  await prisma.jobAlert.create({
    data: { userId: aisha.id, keyword: "Design", location: "Pune", category: "Design" },
  });
  await prisma.jobAlert.create({
    data: { userId: rohan.id, keyword: "Engineer", location: "Bengaluru", category: "Engineering" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
