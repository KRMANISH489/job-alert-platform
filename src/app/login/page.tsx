import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { Field, Submit, fieldClass } from "@/components/ui";
import { loginAction } from "@/server/actions";

export const metadata: Metadata = { title: "Sign in" };

const demos = [
  { name: "Aisha Sen", detail: "Applicant · designer in Pune", email: "aisha@jobalert.app" },
  { name: "Meera Kapoor", detail: "Secondary admin · Northline, posts jobs after access", email: "meera@northline.in" },
  { name: "Main admin", detail: "Gives companies access to post, and controls the board", email: "admin@jobalert.app" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "";

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
      <section>
        <h1 className="text-4xl md:text-5xl">Sign in</h1>
        <p className="mt-3 text-muted">Use your account, or step into a demo profile. Password for every demo is demo1234.</p>
        <div className="mt-6">
          <Flash searchParams={params} />
        </div>
        <form action={loginAction} className="space-y-4 rounded-3xl border border-line bg-cream p-5">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <Field label="Email" htmlFor="email">
            <input id="email" name="email" type="email" autoComplete="email" required className={fieldClass} />
          </Field>
          <Field label="Password" htmlFor="password">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={fieldClass}
            />
          </Field>
          <Submit>Sign in</Submit>
        </form>
        <p className="mt-4 text-sm text-muted">
          New here?{" "}
          <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-medium text-forest">
            Create an account
          </Link>
        </p>
      </section>
      <section className="rounded-3xl border border-line bg-cream p-5">
        <h2 className="text-2xl">Demo accounts</h2>
        <p className="mt-2 text-sm text-muted">These profiles already have roles, applications, and alerts.</p>
        <div className="mt-5 space-y-3">
          {demos.map((demo) => (
            <form key={demo.email} action={loginAction} className="rounded-2xl border border-line p-4">
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <input type="hidden" name="email" value={demo.email} />
              <input type="hidden" name="password" value="demo1234" />
              <p className="font-medium">{demo.name}</p>
              <p className="mt-1 text-sm text-muted">{demo.detail}</p>
              <button type="submit" className="mt-3 text-sm font-medium text-forest">
                Continue as {demo.name}
              </button>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
