import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { Field, Submit, fieldClass } from "@/components/ui";
import { signupAction } from "@/server/actions";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "";
  const hiring = params.role === "employer";

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-4xl md:text-5xl">{hiring ? "Post roles on CareerRise" : "Create your desk"}</h1>
      <p className="mt-3 text-muted">
        {hiring
          ? "This creates a secondary admin for your company. The main admin must allow posting before a job goes live."
          : "A free account lets you apply, save roles, and keep alerts."}
      </p>
      <div className="mt-6">
        <Flash searchParams={params} />
      </div>
      <form action={signupAction} className="space-y-4 rounded-3xl border border-line bg-cream p-5">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <fieldset>
          <legend className="mb-2 text-sm font-medium">I am here to</legend>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="role" value="seeker" defaultChecked={!hiring} />
              Find work
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="role" value="employer" defaultChecked={hiring} />
              Hire
            </label>
          </div>
        </fieldset>
        <Field label="Your name" htmlFor="name">
          <input id="name" name="name" autoComplete="name" required className={fieldClass} />
        </Field>
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" autoComplete="email" required className={fieldClass} />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className={fieldClass}
          />
        </Field>
        <Field label="Company name" htmlFor="companyName" hint="Only needed if you are hiring.">
          <input id="companyName" name="companyName" autoComplete="organization" className={fieldClass} />
        </Field>
        <Submit>{hiring ? "Create hiring account" : "Create account"}</Submit>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-medium text-forest">
          Sign in
        </Link>
      </p>
    </main>
  );
}
