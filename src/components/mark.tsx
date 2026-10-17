const tones = ["#1e4a38", "#9a4e24", "#1f3a5f", "#6b3f69", "#3f4f22", "#7a3e2e", "#24515a"];

function tone(seed: string) {
  let index = 0;
  for (const char of seed) index = (index + char.charCodeAt(0)) % tones.length;
  return tones[index];
}

export function Mark({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const box = size === "lg" ? "h-14 w-14 text-base" : "h-11 w-11 text-sm";

  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-xl font-medium text-cream ${box}`}
      style={{ background: tone(name) }}
    >
      {letters}
    </span>
  );
}
