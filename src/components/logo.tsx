const MARK =
  "M 30 376 L 30 269 L 67.5 269 L 67.5 336.5 L 152 336.5 L 152 160 L 189.5 160 L 189.5 264.5 L 274.5 264.5 L 274.5 72 L 301.5 72 L 262.5 4 L 223.5 72 L 250.5 72 L 250.5 240.5 L 213.5 240.5 L 213.5 136 L 128 136 L 128 312.5 L 91.5 312.5 L 91.5 245 L 6 245 L 6 376 Z";

export function Logo({ className = "h-10 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 307.5 382" className={className} aria-hidden="true">
      <path fill="#F7941D" d={MARK} />
    </svg>
  );
}
