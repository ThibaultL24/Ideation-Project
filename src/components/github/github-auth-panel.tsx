"use client";

import { useCallback, useEffect, useState } from "react";
import { githubStrings as s } from "@/lib/strings/publish";

interface GithubSessionResponse {
  connected: boolean;
  oauthConfigured?: boolean;
  reason?: string;
  login?: string;
  avatarUrl?: string;
  publishRepo?: string;
}

interface GithubAuthPanelProps {
  returnTo: string;
  onConnectedChange?: (connected: boolean) => void;
}

export function GithubAuthPanel({
  returnTo,
  onConnectedChange,
}: GithubAuthPanelProps) {
  const [session, setSession] = useState<GithubSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/github/session");
      const data = (await res.json()) as GithubSessionResponse;
      setSession(data);
      onConnectedChange?.(Boolean(data.connected));
    } catch {
      setSession({ connected: false, oauthConfigured: false });
    } finally {
      setLoading(false);
    }
  }, [onConnectedChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function connect() {
    window.location.href = `/api/auth/github/login?returnTo=${encodeURIComponent(returnTo)}`;
  }

  async function logout() {
    await fetch("/api/auth/github/logout", { method: "POST" });
    await refresh();
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">{s.checkingSession}</p>;
  }

  if (session?.oauthConfigured === false) {
    return (
      <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
        {s.oauthNotConfigured.replace(
          "{reason}",
          session.reason ?? "missing env vars",
        )}
      </div>
    );
  }

  if (session?.connected && session.login) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="flex items-center gap-3">
          {session.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
          ) : null}
          <div className="text-sm">
            <p className="font-medium">@{session.login}</p>
            <p className="text-xs text-[var(--muted)]">
              {s.forkLabel}: {session.publishRepo ?? `${session.login}/ideas`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:border-[var(--accent)]"
        >
          {s.disconnect}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-sky-900/40 bg-sky-950/20 px-4 py-4 text-sm">
      <p className="text-sky-100">{s.connectLead}</p>
      <button
        type="button"
        onClick={connect}
        className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
      >
        {s.connectButton}
      </button>
    </div>
  );
}
