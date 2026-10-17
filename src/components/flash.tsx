export function Flash({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const error = typeof searchParams.error === "string" ? searchParams.error : "";
  const notice = typeof searchParams.notice === "string" ? searchParams.notice : "";
  if (!error && !notice) return null;

  return (
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "mb-6 rounded-xl border border-[#e4c8c4] bg-[#fbf4f2] px-4 py-3 text-sm text-danger"
          : "mb-6 rounded-xl border border-[#cfe0d6] bg-[#f3f7f4] px-4 py-3 text-sm text-forest"
      }
    >
      {error || notice}
    </p>
  );
}
