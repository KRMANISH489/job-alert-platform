import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flash } from "@/components/flash";
import { SeekerProfileView } from "@/components/seeker-profile";
import { getSession, homeFor } from "@/lib/auth";
import { getProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/profile");
  if (session.role !== "seeker") redirect(homeFor(session.role));

  const [params, profile] = await Promise.all([
    searchParams,
    getProfile(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Flash searchParams={params} />
      <SeekerProfileView profile={profile} editable />
    </main>
  );
}
