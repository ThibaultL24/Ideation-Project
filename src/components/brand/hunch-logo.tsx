// src/components/brand/hunch-logo.tsx
// Brand glyph: a knowledge-graph triple rising like a spark — the top teal node
// is the published idea, the white outlined nodes are the work in progress.

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
      <line x1="11" y1="37" x2="24" y2="24" stroke="currentColor" strokeWidth="2" />
      <line x1="24" y1="24" x2="36" y2="12" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="38" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="37" cy="11" r="9" fill="var(--accent)" opacity="0.25" />
      <circle cx="37" cy="11" r="5.5" fill="var(--accent)" />
    </svg>
  );
}

export function HunchWordmark({ glyphSize = 28 }: { glyphSize?: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-[var(--foreground)]">
      <HunchGlyph size={glyphSize} />
      <span className="font-semibold tracking-tight">Hunch</span>
    </span>
  );
}
