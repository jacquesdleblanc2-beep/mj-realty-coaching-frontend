"use client";

// src/app/admin/status/page.tsx — Live system health page

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SUPER_ADMIN = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

const RAILWAY  = "https://web-production-80c0d.up.railway.app";
const VERCEL   = "https://mj-realty-coaching-frontend.vercel.app";
const SUPABASE = "https://eytrmeplwmjrityzelvl.supabase.co";

type Expect = 200 | "any";

interface CheckDef {
  name: string;
  url: string;
  expect: Expect;
}

interface CheckResult extends CheckDef {
  status: number | null;
  ms: number | null;
  ok: boolean | null; // null = pending
}

const CHECKS: CheckDef[] = [
  { name: "Vercel frontend",        url: VERCEL,                                                    expect: 200  },
  { name: "Railway backend",        url: RAILWAY + "/health",                                       expect: 200  },
  { name: "Supabase",               url: SUPABASE,                                                  expect: "any"},
  { name: "/api/realtors",          url: RAILWAY + "/api/realtors",                                 expect: 200  },
  { name: "/api/realtors/by-email", url: RAILWAY + "/api/realtors/by-email/test@test.com",          expect: 200  },
  { name: "/api/coaches/by-email",  url: RAILWAY + "/api/coaches/by-email/test@test.com",           expect: 200  },
  { name: "/api/admin/coaches",     url: RAILWAY + "/api/admin/coaches",                            expect: 200  },
  { name: "/api/admin/realtors",    url: RAILWAY + "/api/admin/realtors",                           expect: 200  },
  { name: "/api/pipeline/status",   url: RAILWAY + "/api/pipeline/status",                          expect: 200  },
];

const KNOWN_ISSUES = [
  "Email scheduler not on Railway — Sunday/Monday emails won't fire automatically",
  "API endpoints have no authentication — not safe for public launch yet",
  "Google Sheets pipeline untested end-to-end",
  "params.id async fix may still be pending — test realtor setup page",
];

async function runCheck(def: CheckDef): Promise<CheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  const start = Date.now();
  try {
    const res = await fetch(def.url, { signal: controller.signal, cache: "no-store" });
    const ms = Date.now() - start;
    const ok = def.expect === "any" ? true : res.status === def.expect;
    return { ...def, status: res.status, ms, ok };
  } catch {
    const ms = Date.now() - start;
    return { ...def, status: null, ms, ok: false };
  } finally {
    clearTimeout(timer);
  }
}

function Dot({ ok }: { ok: boolean | null }) {
  const color =
    ok === null  ? "bg-amber-400" :
    ok           ? "bg-green-500" :
                   "bg-red-500";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />;
}

export default function StatusPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [results,     setResults]     = useState<CheckResult[]>(() =>
    CHECKS.map((c) => ({ ...c, status: null, ms: null, ok: null }))
  );
  const [checking,    setChecking]    = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const email = session?.user?.email ?? "";

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated")   return;
    if (SUPER_ADMIN && email.toLowerCase() !== SUPER_ADMIN.toLowerCase()) {
      router.push("/");
      return;
    }
    runAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, email]);

  async function runAll() {
    setChecking(true);
    setResults(CHECKS.map((c) => ({ ...c, status: null, ms: null, ok: null })));
    const settled = await Promise.all(CHECKS.map(runCheck));
    setResults(settled);
    setLastChecked(new Date());
    setChecking(false);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const degraded = results.filter((r) => r.ok === false).length;
  const allDone  = results.every((r) => r.ok !== null);

  return (
    <div className="min-h-screen bg-teal-50">
      <div className="max-w-2xl mx-auto p-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-teal-800 mb-1">System Status</h1>
          <p className="text-sm text-teal-400 mb-4">
            {lastChecked
              ? `Last checked: ${lastChecked.toLocaleTimeString()}`
              : "Not yet checked"}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/admin"
              className="text-sm text-teal-600 hover:text-teal-800 border border-teal-200
                         px-4 py-2 rounded-lg transition-colors bg-white"
            >
              ← Admin
            </Link>
            <button
              onClick={runAll}
              disabled={checking}
              className="text-sm text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50
                         px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {checking ? "Checking…" : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* Summary banner */}
        {checking || !allDone ? (
          <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700 font-medium">
            Checking…
          </div>
        ) : degraded === 0 ? (
          <div className="mb-6 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 font-medium">
            All systems operational
          </div>
        ) : (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
            {degraded} service{degraded !== 1 ? "s" : ""} degraded — see below
          </div>
        )}

        {/* Check cards */}
        <div className="space-y-2 mb-8">
          {results.map((r) => (
            <div
              key={r.name}
              className="bg-white border border-teal-200 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <Dot ok={r.ok} />
              <span className="text-sm font-medium text-teal-800 w-44 shrink-0">{r.name}</span>
              <span className="text-xs text-teal-400 font-mono truncate flex-1 hidden sm:block">
                {r.url}
              </span>
              <span className="text-xs text-teal-600 shrink-0 w-14 text-right">
                {r.status !== null ? r.status : r.ok === null ? "—" : "ERR"}
              </span>
              <span className="text-xs text-teal-400 shrink-0 w-14 text-right">
                {r.ms !== null ? `${r.ms}ms` : ""}
              </span>
            </div>
          ))}
        </div>

        {/* Known issues */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-amber-700 mb-3">Known issues</p>
          <ul className="space-y-2">
            {KNOWN_ISSUES.map((issue) => (
              <li key={issue} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="mt-0.5 shrink-0">⚠</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
