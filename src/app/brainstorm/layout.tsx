// src/app/brainstorm/layout.tsx
export default function BrainstormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="brainstorm-workspace">{children}</div>;
}
