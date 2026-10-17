export function formatAmount(amount: number) {
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    const rounded = Number.isInteger(lakhs) ? String(lakhs) : lakhs.toFixed(1).replace(/\.0$/, "");
    return `₹${rounded}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatSalary(min?: number | null, max?: number | null) {
  if (min == null && max == null) return "Salary not listed";
  if (min != null && max != null) return `${formatAmount(min)} – ${formatAmount(max)}`;
  if (min != null) return `From ${formatAmount(min)}`;
  return `Up to ${formatAmount(max as number)}`;
}

export function formatExperience(years: number | null | undefined) {
  if (years == null) return "";
  if (years <= 0) return "Fresher";
  if (years === 1) return "1 year";
  return `${years} years`;
}

export function timeAgo(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function lines(text: string) {
  return text
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean);
}
