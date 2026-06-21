// src/components/brand/hunch-logo.tsx
// H monogram + rising teal node — foundation (H) → insight (hunch) on the graph.

interface HunchGlyphProps {
  size?: number;
}

export function HunchGlyph({ size = 32 }: HunchGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {/* H — two pillars + crossbar (ideation scaffold) */}
      <path
        d="M10 38V12M10 26H38M38 38V12"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Foundation anchors */}
      <circle
        cx="10"
        cy="38"
        r="3.75"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="var(--background)"
      />
      <circle
        cx="38"
        cy="38"
        r="3.75"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="var(--background)"
      />

      {/* Graph edge: draft → hunch */}
      <path
        d="M24 26V11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle
        cx="24"
        cy="26"
        r="3.25"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="var(--background)"
      />

      {/* Hunch — attested idea (teal, same token as UI accent) */}
      <circle cx="24" cy="8" r="8.5" fill="var(--accent)" opacity="0.2" />
      <circle cx="24" cy="8" r="5.25" fill="var(--accent)" />
      <circle cx="24" cy="8" r="2" fill="var(--background)" opacity="0.35" />
    </svg>
  );
}

export function HunchWordmark({ glyphSize = 28 }: { glyphSize?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-[var(--foreground)]">
      <HunchGlyph size={glyphSize} />
      <span className="font-semibold tracking-tight">Hunch</span>
    </span>
  );
}
