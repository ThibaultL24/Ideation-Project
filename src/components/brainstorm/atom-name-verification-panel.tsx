"use client";

import { useEffect, useRef, useState } from "react";
import type { AtomNameVerification } from "@/lib/ideas/verify-atom-by-name";
import { networkExplorerAtomUrl } from "@/lib/intuition/config";
import { verificationStrings as s } from "@/lib/strings/publish";

interface AtomNameVerificationPanelProps {
  projectName: string;
  compact?: boolean;
  onVerificationChange?: (verification: AtomNameVerification | null) => void;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function formatFetchError(error: unknown): string {
  if (error instanceof Error) {
    if (isAbortError(error)) return "";
    if (error.message === "Failed to fetch") return s.fetchFailed;
    return error.message;
  }
  return s.unknownError;
}

async function fetchVerification(
  name: string,
  signal: AbortSignal,
): Promise<AtomNameVerification> {
  const res = await fetch(`/api/verify/atom-name?name=${encodeURIComponent(name)}`, {
    signal,
    cache: "no-store",
  });
  const data = (await res.json()) as AtomNameVerification & { error?: string };
  if (!res.ok) throw new Error(data.error ?? s.verificationFailed);
  return data;
}

export function AtomNameVerificationPanel({
  projectName,
  compact = false,
  onVerificationChange,
}: AtomNameVerificationPanelProps) {
  const [verification, setVerification] = useState<AtomNameVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onVerificationChangeRef = useRef(onVerificationChange);
  onVerificationChangeRef.current = onVerificationChange;

  useEffect(() => {
    const name = projectName.trim();
    if (name.length < 2) {
      setVerification(null);
      setError(null);
      onVerificationChangeRef.current?.(null);
      return;
    }

    const controller = new AbortController();
    const slowTimer = window.setTimeout(() => setSlow(true), 3000);

    void (async () => {
      setLoading(true);
      setSlow(false);
      setError(null);
      try {
        let data: AtomNameVerification;
        try {
          data = await fetchVerification(name, controller.signal);
        } catch (firstError) {
          if (controller.signal.aborted || isAbortError(firstError)) return;
          await new Promise((resolve) => window.setTimeout(resolve, 800));
          data = await fetchVerification(name, controller.signal);
        }
        setVerification(data);
        onVerificationChangeRef.current?.(data);
      } catch (e) {
        if (controller.signal.aborted || isAbortError(e)) return;
        setVerification(null);
        onVerificationChangeRef.current?.(null);
        const message = formatFetchError(e);
        if (message) setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setSlow(false);
        }
      }
    })();

    return () => {
      controller.abort();
      window.clearTimeout(slowTimer);
    };
  }, [projectName]);

  if (projectName.trim().length < 2) return null;

  const trimmedName = projectName.trim();

  if (loading) {
    return (
      <p className="text-sm text-[var(--muted)]">
        {s.loading.replace("{name}", trimmedName)}
        {slow ? s.slowHint : null}
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-200">
        <p>
          {s.errorPrefix} {error}
        </p>
        <button
          type="button"
          className="mt-2 text-xs text-[var(--accent)] hover:underline"
          onClick={() => {
            setError(null);
            setLoading(true);
            void fetchVerification(trimmedName, new AbortController().signal)
              .then((data) => {
                setVerification(data);
                onVerificationChangeRef.current?.(data);
              })
              .catch((e) => setError(formatFetchError(e) || s.unknownError))
              .finally(() => setLoading(false));
          }}
        >
          {s.retry}
        </button>
      </div>
    );
  }

  if (!verification) return null;

  const tone = verification.exactMatch
    ? "border-amber-900/50 bg-amber-950/30 text-amber-100"
    : verification.matches.length > 0
      ? "border-sky-900/40 bg-sky-950/20 text-sky-100"
      : "border-emerald-900/50 bg-emerald-950/30 text-emerald-100";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tone}`}>
      <p className="font-medium">
        {verification.exactMatch
          ? s.exactMatch
          : verification.matches.length > 0
            ? s.similarNames
            : s.nameAvailable}
      </p>
      <p className="mt-1 text-xs opacity-90">{verification.message}</p>

      {!compact && verification.matches.length > 0 ? (
        <ul className="mt-3 space-y-2 text-xs">
          {verification.matches.map((match) => (
            <li
              key={match.termId}
              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
            >
              <p className="font-medium">{match.label}</p>
              <p className="mt-1 font-mono text-[10px] text-[var(--muted)]">
                {match.termId.slice(0, 18)}… · {match.type}
                {match.exact ? " · exact" : ""}
                {match.coreTriplePresent ? s.coreTripleTag : ""}
              </p>
              <a
                href={networkExplorerAtomUrl(match.termId)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[var(--accent)] hover:underline"
              >
                {s.viewExplorer}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
