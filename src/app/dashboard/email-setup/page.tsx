"use client";

// src/app/dashboard/email-setup/page.tsx — Email Setup (full)

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Mail, AtSign, Sparkles,
  ArrowRight, Users, Bell,
  Check,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, updateRealtor, Realtor } from "@/lib/api";

// ── State model ────────────────────────────────────────────────────────────────

type EmailPath   = "personal" | "business_existing" | "business_new";
type OldStatus   = "none" | "handled" | "skipped";

interface EmailSetupState {
  path:         EmailPath | null;
  emailAddress: string;
  oldStatus:    OldStatus;
  completed:    boolean;
}

const DEFAULT_STATE: EmailSetupState = {
  path:         null,
  emailAddress: "",
  oldStatus:    "none",
  completed:    false,
};

// ── Key helpers ────────────────────────────────────────────────────────────────

const PFX_PATH  = "email_path:";
const PFX_ADDR  = "email_addr:";
const KEY_OLD_H = "email_old_handled";
const KEY_OLD_S = "email_old_skipped";
const KEY_DONE  = "email_completed";

function parseEmailSetup(completed: string[]): EmailSetupState {
  let path:         EmailPath | null = null;
  let emailAddress: string           = "";
  let oldStatus:    OldStatus        = "none";
  let isDone:       boolean          = false;

  for (const k of completed) {
    if (k.startsWith(PFX_PATH)) path         = k.slice(PFX_PATH.length) as EmailPath;
    if (k.startsWith(PFX_ADDR)) emailAddress = decodeURIComponent(k.slice(PFX_ADDR.length));
    if (k === KEY_OLD_H)         oldStatus    = "handled";
    if (k === KEY_OLD_S)         oldStatus    = "skipped";
    if (k === KEY_DONE)          isDone       = true;
  }
  return { path, emailAddress, oldStatus, completed: isDone };
}

function buildCompleted(base: string[], state: EmailSetupState): string[] {
  const cleaned = base.filter(
    (k) =>
      !k.startsWith(PFX_PATH) &&
      !k.startsWith(PFX_ADDR) &&
      k !== KEY_OLD_H &&
      k !== KEY_OLD_S &&
      k !== KEY_DONE,
  );
  if (state.path)                          cleaned.push(`${PFX_PATH}${state.path}`);
  if (state.emailAddress.trim())           cleaned.push(`${PFX_ADDR}${encodeURIComponent(state.emailAddress.trim())}`);
  if (state.oldStatus === "handled")       cleaned.push(KEY_OLD_H);
  if (state.oldStatus === "skipped")       cleaned.push(KEY_OLD_S);
  if (state.completed)                     cleaned.push(KEY_DONE);
  return cleaned;
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function SetupProgress({ state }: { state: EmailSetupState }) {
  const steps = [
    { label: "Path selected",      done: !!state.path },
    { label: "Email address set",  done: !!state.emailAddress.trim() },
    { label: "Old email handled",  done: state.oldStatus !== "none" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const pct       = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="bg-white border border-[#B2DFDB] rounded-xl p-4 mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#0D5C63]">
          {doneCount} of {steps.length} steps complete
        </span>
        <span className="text-sm font-bold text-[#0D5C63]">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-[#B2DFDB] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-[#0D5C63] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-4 flex-wrap">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0
                             ${s.done ? "bg-[#0D5C63]" : "bg-slate-200"}`}>
              {s.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </span>
            <span className={s.done ? "text-[#0D5C63] font-medium" : "text-slate-400"}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pros / cons list ───────────────────────────────────────────────────────────

function ProsList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
          <span className="mt-0.5 text-emerald-500 font-bold shrink-0">✓</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function ConsList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
          <span className="mt-0.5 text-rose-400 font-bold shrink-0">✗</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

// ── Numbered step ──────────────────────────────────────────────────────────────

interface Step {
  num:  number;
  head: string;
  body: string;
  link?: { label: string; href: string };
  note?: string;
}

function NumberedStep({ step }: { step: Step }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-[#0D5C63] text-white text-xs font-bold
                      flex items-center justify-center shrink-0 mt-0.5">
        {step.num}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{step.head}</p>
        <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{step.body}</p>
        {step.link && (
          <a
            href={step.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#0D5C63] font-medium
                       mt-1.5 hover:underline"
          >
            {step.link.label} <ArrowRight className="w-3 h-3" />
          </a>
        )}
        {step.note && (
          <p className="text-xs text-slate-400 italic mt-1">{step.note}</p>
        )}
      </div>
    </div>
  );
}

// ── Email steps shared between Path 2 and Path 3 ──────────────────────────────

const EMAIL_STEPS: Step[] = [
  {
    num:  1,
    head: "Sign up for Google Workspace Business Starter ($7/user/month billed annually)",
    body: "Google Workspace gives you a professional email at your domain plus Drive, Docs, Meet, and Calendar.",
    link: { label: "Start free trial", href: "https://workspace.google.com/business/signup/welcome" },
  },
  {
    num:  2,
    head: "Verify your domain ownership",
    body: "Google gives you a TXT record. Log into your domain registrar and add it to DNS. Changes can take up to 48 hours, usually much faster.",
  },
  {
    num:  3,
    head: "Update MX records so email routes to Google",
    body: "Google provides one MX record to add to your registrar's DNS settings.",
  },
  {
    num:  4,
    head: "Create your email address",
    body: "Pick something professional: firstname@yourdomain.ca or firstinitial.lastname@yourdomain.ca. Avoid cute names — this goes on every contract you sign for years.",
  },
  {
    num:  5,
    head: "Add SPF, DKIM, and DMARC records for deliverability",
    body: "These stop your email from landing in spam. Google's admin console gives you the exact values to paste into your DNS.",
  },
  {
    num:  6,
    head: "Test by emailing yourself from Gmail",
    body: "If it arrives in your inbox, you're live.",
  },
];

// ── Registrar card ─────────────────────────────────────────────────────────────

interface RegistrarCardProps {
  name:        string;
  price:       string;
  pros:        string[];
  cons:        string[];
  href:        string;
  recommended: boolean;
}

function RegistrarCard({ name, price, pros, cons, href, recommended }: RegistrarCardProps) {
  return (
    <div className="bg-white border border-[#B2DFDB] rounded-xl p-5 flex flex-col gap-3 shadow-sm relative">
      {recommended && (
        <span className="absolute top-3 right-3 bg-[#FF6B35] text-white text-xs px-2 py-1 rounded-full font-semibold">
          RECOMMENDED
        </span>
      )}
      <div>
        <p className="text-xl font-bold text-slate-800 pr-20">{name}</p>
        <p className="text-lg font-semibold text-[#0D5C63] mt-0.5">{price}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pros</p>
        <ProsList items={pros} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cons</p>
        <ConsList items={cons} />
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                   border border-[#0D5C63] text-[#0D5C63] hover:bg-[#0D5C63] hover:text-white
                   transition-colors self-start"
      >
        Go to {name} <ArrowRight className="w-3 h-3" />
      </a>
    </div>
  );
}

// ── Section divider ────────────────────────────────────────────────────────────

function SectionDivider({ pill, title }: { pill: string; title: string }) {
  return (
    <div className="mt-12">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{pill}</p>
      <h3 className="text-xl font-semibold text-slate-800 mt-1">{title}</h3>
    </div>
  );
}

// ── Email input ────────────────────────────────────────────────────────────────

function EmailInput({
  placeholder,
  value,
  onSave,
}: {
  placeholder: string;
  value:       string;
  onSave:      (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);

  return (
    <div className="mt-4">
      <label className="block text-xs font-semibold text-slate-600 mb-1">Your email address</label>
      <input
        type="email"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { if (local !== value) onSave(local); }}
        className="w-full max-w-sm border border-[#B2DFDB] rounded-lg px-3 py-2 text-sm
                   text-slate-800 focus:outline-none focus:border-[#0D5C63] bg-white"
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EmailSetupPage() {
  const { data: session, status } = useSession();
  const router  = useRouter();

  const [realtor,    setRealtor]    = useState<Realtor | null>(null);
  const [setupState, setSetupState] = useState<EmailSetupState>(DEFAULT_STATE);
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [flashDone,  setFlashDone]  = useState(false);
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    getRealtorByEmail(email)
      .then((r) => {
        if (!r) { router.push("/"); return; }
        setRealtor(r);
        setSetupState(parseEmailSetup(r.roadmap_completed ?? []));
      })
      .finally(() => setLoading(false));
  }, [status, session, router]);

  // ── Save helper ──────────────────────────────────────────────────────────────

  async function save(newState: EmailSetupState) {
    if (!realtor) return;
    setSaving(true);
    try {
      const updatedCompleted = buildCompleted(realtor.roadmap_completed ?? [], newState);
      const updated = await updateRealtor(realtor.id, { roadmap_completed: updatedCompleted });
      setRealtor(updated);
      setSetupState(newState);
    } catch (e) {
      console.error("Failed to save email setup", e);
    } finally {
      setSaving(false);
    }
  }

  function selectPath(path: EmailPath) {
    const newState: EmailSetupState = {
      ...setupState,
      path,
      completed: false, // reset completion when path changes
    };
    save(newState);
    // Scroll to the section
    setTimeout(() => {
      document.getElementById(`path-${path}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function saveEmail(addr: string) {
    save({ ...setupState, emailAddress: addr });
  }

  function toggleOldHandled() {
    const next: OldStatus = setupState.oldStatus === "handled" ? "none" : "handled";
    save({ ...setupState, oldStatus: next, completed: false });
  }

  function skipOldEmail() {
    save({ ...setupState, oldStatus: "skipped", completed: false });
  }

  async function markComplete() {
    const newState = { ...setupState, completed: true };
    await save(newState);
    if (flashRef.current) clearTimeout(flashRef.current);
    setFlashDone(true);
    flashRef.current = setTimeout(() => setFlashDone(false), 3000);
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const canComplete =
    !!setupState.path &&
    !!setupState.emailAddress.trim() &&
    setupState.oldStatus !== "none";

  const pathLabel: Record<EmailPath, string> = {
    personal:          "Personal Email",
    business_existing: "Business Email (existing domain)",
    business_new:      "Business Email (new domain)",
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-[#F0FAFA] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  // ── Path comparison cards ─────────────────────────────────────────────────────

  const pathOptions: {
    key:       EmailPath;
    icon:      React.ReactNode;
    title:     string;
    cost:      string;
    time:      string;
    bestFor:   string;
  }[] = [
    {
      key:     "personal",
      icon:    <Mail className="w-5 h-5 text-[#0D5C63]" />,
      title:   "Personal Email",
      cost:    "$0/mo",
      time:    "Instant",
      bestFor: "Brand new, moving fast",
    },
    {
      key:     "business_existing",
      icon:    <AtSign className="w-5 h-5 text-[#0D5C63]" />,
      title:   "Business Email (existing domain)",
      cost:    "$6–$7/mo",
      time:    "~30 min",
      bestFor: "Already own a domain",
    },
    {
      key:     "business_new",
      icon:    <Sparkles className="w-5 h-5 text-[#0D5C63]" />,
      title:   "Business Email (new domain)",
      cost:    "$8–$27/mo + domain $8–$20/yr",
      time:    "1–2 hrs",
      bestFor: "Building a lasting brand",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Initial Setup</p>
          <h1 className="text-3xl font-bold text-[#0D5C63] mt-2">Email Setup</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Set up your professional email. Choose the path that fits where you are today — you can always upgrade later.
          </p>
        </div>

        <SetupProgress state={setupState} />

        {/* ── Your Options ──────────────────────────────────────────────────── */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Options</p>
          <h2 className="text-xl font-semibold text-slate-800 mt-1">Pick the path that fits you</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {pathOptions.map((opt) => {
            const selected = setupState.path === opt.key;
            return (
              <div
                key={opt.key}
                className={`rounded-xl p-6 flex flex-col gap-4 border shadow-sm hover:shadow-md transition-shadow cursor-pointer
                            ${selected
                              ? "border-l-4 border-l-[#FF6B35] bg-gradient-to-br from-white to-[#FFF8F5] border-[#FF6B35]"
                              : "bg-white border-[#B2DFDB]"}`}
                onClick={() => selectPath(opt.key)}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-[#F0FAFA] p-2 rounded-lg shrink-0">{opt.icon}</div>
                  <h3 className="text-sm font-semibold text-slate-800 leading-snug">{opt.title}</h3>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Cost</span>
                    <span className="text-slate-700 font-semibold">{opt.cost}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Setup time</span>
                    <span className="text-slate-700 font-semibold">{opt.time}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Best for</span>
                    <span className="text-slate-700 font-semibold text-right ml-2">{opt.bestFor}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); selectPath(opt.key); }}
                  disabled={saving}
                  className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-colors self-start
                              ${selected
                                ? "bg-[#FF6B35] border-[#FF6B35] text-white"
                                : "border-[#0D5C63] text-[#0D5C63] hover:bg-[#0D5C63] hover:text-white"}`}
                >
                  {selected ? "✓ Selected" : "Choose this path"}
                </button>
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            PATH 1 — Personal Email
        ══════════════════════════════════════════════════════════════════════ */}
        <div id="path-personal" className="scroll-mt-8">
          <SectionDivider pill="Path 1" title="Personal Email" />
          <p className="text-sm text-slate-600 mt-3 mb-6 max-w-2xl">
            The fastest way to get moving. If you&apos;re brand new or just need to start answering clients today, your personal Gmail, Outlook, or iCloud will work.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-[#B2DFDB] rounded-xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Pros</p>
              <ProsList items={[
                "Free, no setup time",
                "Already configured on your phone and computer",
                "Familiar interface",
                "Zero technical work",
              ]} />
            </div>
            <div className="bg-white border border-[#B2DFDB] rounded-xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-3">Cons</p>
              <ConsList items={[
                "Looks less professional on contracts and listing signs",
                "Mixes business with personal messages",
                "Harder to scale if you build a team or rebrand later",
                "Some clients may hesitate to send important documents to a @gmail.com address",
              ]} />
            </div>
          </div>

          <EmailInput
            placeholder="jacques@gmail.com"
            value={setupState.path === "personal" ? setupState.emailAddress : ""}
            onSave={saveEmail}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            PATH 2 — Business Email (existing domain)
        ══════════════════════════════════════════════════════════════════════ */}
        <div id="path-business_existing" className="scroll-mt-8 mt-12">
          <SectionDivider pill="Path 2" title="Business Email (You already own a domain)" />
          <p className="text-sm text-slate-600 mt-3 mb-6 max-w-2xl">
            You already own something like jacquesleblanc.ca. Connect it to Google Workspace or Microsoft 365 to get you@yourdomain.ca working as real email.
          </p>

          <div className="bg-white border border-[#B2DFDB] rounded-xl p-6 shadow-sm space-y-5">
            {EMAIL_STEPS.map((step) => (
              <NumberedStep key={step.num} step={step} />
            ))}
          </div>

          <EmailInput
            placeholder="you@yourdomain.ca"
            value={setupState.path === "business_existing" ? setupState.emailAddress : ""}
            onSave={saveEmail}
          />

          <p className="text-xs text-slate-400 italic mt-3">
            Prefer Microsoft? Microsoft 365 Business Basic is $7/user/mo with the same setup flow.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            PATH 3 — Business Email (new domain)
        ══════════════════════════════════════════════════════════════════════ */}
        <div id="path-business_new" className="scroll-mt-8 mt-12">
          <SectionDivider pill="Path 3" title="Business Email (Build a branded domain from scratch)" />
          <p className="text-sm text-slate-600 mt-3 mb-6 max-w-2xl">
            No existing domain. You want one. This is the full branded setup — domain, email, professional address in ~2 hours of work across 1–2 days of DNS propagation.
          </p>

          {/* Step 1 — Pick domain name */}
          <div className="bg-white border border-[#B2DFDB] rounded-xl p-5 shadow-sm mb-6">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">1. Pick your domain name</h4>
            <ul className="space-y-1.5">
              {[
                "Use your name if it's available (jacquesleblanc.ca is stronger than jacquesthesrealtor.ca)",
                "Prefer .ca if you serve New Brunswick — it signals local",
                ".com is fine if your .ca is taken",
                "Keep it under 20 characters if possible",
                "Don't use hyphens or numbers",
                "Say it out loud. If you have to spell it every time, pick something else.",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-[#0D5C63] font-bold shrink-0 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Step 2 — Buy domain (registrar cards) */}
          <h4 className="text-sm font-semibold text-slate-800 mb-3">2. Buy your domain</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <RegistrarCard
              name="Squarespace Domains"
              price="~$20/yr .com"
              recommended
              pros={[
                "Cleanest modern UX — made for people who aren't developers",
                "Includes WHOIS privacy, SSL, and email forwarding at no extra cost",
                "Built-in integration with Google Workspace for email",
                "First year free if you also build a website with Squarespace",
              ]}
              cons={[
                "Renewal pricing is higher than competitors ($20/yr vs $8–14/yr elsewhere)",
              ]}
              href="https://domains.squarespace.com/"
            />
            <RegistrarCard
              name="GoDaddy"
              price="$10–15/yr .com"
              recommended={false}
              pros={[
                "Canadian realtors often already have accounts from other businesses",
                "Simpler dashboard than Namecheap for pure domain management",
                "Easy to add Microsoft 365 email directly from GoDaddy",
              ]}
              cons={[
                "Upsell-heavy checkout (decline everything you didn't come for)",
              ]}
              href="https://www.godaddy.com/en-ca/domains"
            />
            <RegistrarCard
              name="Namecheap"
              price="$8–14/yr .com"
              recommended={false}
              pros={[
                "Cheapest of the three",
                "Free WHOIS privacy included",
                "Private Email hosting is only ~$10/year if you don't want Google Workspace",
              ]}
              cons={[
                "Dashboard is less polished",
                "You'll configure MX and DNS manually",
              ]}
              href="https://www.namecheap.com/domains/"
            />
          </div>

          {/* Step 3 — Set up email */}
          <h4 className="text-sm font-semibold text-slate-800 mb-3">3. Set up email</h4>
          <p className="text-sm text-slate-500 italic mb-4">
            Now that you own the domain, follow the exact same steps as Path 2 to connect Google Workspace or Microsoft 365.
          </p>
          <div className="bg-white border border-[#B2DFDB] rounded-xl p-6 shadow-sm space-y-5 mb-4">
            {EMAIL_STEPS.map((step) => (
              <NumberedStep key={step.num} step={step} />
            ))}
          </div>

          <EmailInput
            placeholder="you@yourdomain.ca"
            value={setupState.path === "business_new" ? setupState.emailAddress : ""}
            onSave={saveEmail}
          />

          <p className="text-xs text-slate-400 italic mt-3">
            Prefer Microsoft? Microsoft 365 Business Basic is $7/user/mo with the same setup flow.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            COMING FROM ANOTHER BROKERAGE?
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="mt-12">
          <div className="bg-white border border-[#B2DFDB] border-l-4 border-l-[#FF6B35] rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800 mb-1">
              Coming from another brokerage?
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Handle your old email in 3 steps — whichever path above you picked.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  icon: <ArrowRight className="w-5 h-5 text-[#0D5C63]" />,
                  title: "Forward your old email",
                  body: "Log into your old brokerage email and set up auto-forwarding to your new address. Every Gmail, Outlook, and web-based email supports this in Settings. This keeps past clients reaching you while you transition.",
                },
                {
                  icon: <Users className="w-5 h-5 text-[#0D5C63]" />,
                  title: "Export your contacts",
                  body: "Your address book is gold. Export all contacts from your old email to a .csv file, then import to your new account. In Gmail: Contacts → Export. In Outlook: People → Manage → Export.",
                },
                {
                  icon: <Bell className="w-5 h-5 text-[#0D5C63]" />,
                  title: "Tell clients directly",
                  body: "Don't rely on forwarding forever. Send a short email to active clients announcing your new address and new brokerage. Keep it warm and brief — two sentences is enough.",
                },
              ].map((card, i) => (
                <div key={i} className="bg-[#F0FAFA] rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-white p-1.5 rounded-lg shrink-0">{card.icon}</div>
                    <p className="text-sm font-semibold text-slate-800">{card.title}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button
                  onClick={toggleOldHandled}
                  disabled={saving}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                              ${setupState.oldStatus === "handled"
                                ? "bg-[#0D5C63] border-[#0D5C63]"
                                : "border-slate-300 hover:border-[#0D5C63]"}`}
                >
                  {setupState.oldStatus === "handled" && (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </button>
                <span className="text-sm text-slate-700">I&apos;ve handled my old brokerage email</span>
              </label>

              <button
                onClick={skipOldEmail}
                disabled={saving || setupState.oldStatus === "skipped"}
                className={`text-xs underline transition-colors
                            ${setupState.oldStatus === "skipped"
                              ? "text-[#0D5C63] font-medium no-underline"
                              : "text-slate-400 hover:text-slate-600"}`}
              >
                {setupState.oldStatus === "skipped"
                  ? "✓ Skipped — not from another brokerage"
                  : "I'm not coming from another brokerage — skip this step"}
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            COMPLETION CARD
        ══════════════════════════════════════════════════════════════════════ */}
        <div className={`mt-12 bg-white rounded-xl p-6 shadow-sm border border-l-4 transition-colors
                         ${setupState.completed || flashDone
                           ? "border-[#0D5C63] border-l-[#0D5C63]"
                           : "border-[#B2DFDB] border-l-[#FF6B35]"}`}>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Mark email setup complete</h2>

          <p className="text-sm text-slate-500 mb-5">
            {setupState.path
              ? <>You chose: <strong>{pathLabel[setupState.path]}</strong>.{" "}</>
              : "No path selected yet. "}
            {setupState.emailAddress.trim()
              ? <>Your email: <strong>{setupState.emailAddress.trim()}</strong>.{" "}</>
              : "No email address saved yet. "}
            {setupState.oldStatus === "handled"
              ? "Old email: handled."
              : setupState.oldStatus === "skipped"
              ? "Old email: skipped."
              : "Old email: not yet addressed."}
          </p>

          {setupState.completed || flashDone ? (
            <div className="flex items-center gap-2 text-[#0D5C63] font-semibold text-sm">
              <Check className="w-5 h-5" />
              Email setup complete
            </div>
          ) : (
            <button
              onClick={markComplete}
              disabled={!canComplete || saving}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors
                          ${canComplete && !saving
                            ? "bg-[#FF6B35] hover:bg-[#E85A24] text-white"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
            >
              {saving ? "Saving…" : "Complete email setup"}
            </button>
          )}

          {!canComplete && !setupState.completed && (
            <p className="text-xs text-slate-400 mt-2">
              Select a path, enter your email address, and handle (or skip) your old brokerage email first.
            </p>
          )}
        </div>

        <div className="h-12" />

      </main>
    </div>
  );
}
