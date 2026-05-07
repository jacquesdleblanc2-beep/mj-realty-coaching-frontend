"use client";

// src/components/sidebar.tsx

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useNotices } from "@/lib/useNotices";

interface SidebarProps {
  role: "realtor" | "admin";
}

// ── Coach nav (unchanged) ──────────────────────────────────────────────────────

const coachNav = [
  { label: "Overview",     href: "/coach" },
  { label: "Notices",      href: "/coach/notices" },
  { label: "My Realtors",  href: "/coach/realtors" },
  { label: "Reports",      href: "/coach/reports" },
  { label: "Send History", href: "/coach/history" },
  { label: "Pipeline",     href: "/coach/scheduler" },
  { label: "Add Realtor®", href: "/coach/add" },
];

// ── Realtor nav structure ──────────────────────────────────────────────────────

interface NavItem {
  label:    string;
  href:     string;
  sub?:     { label: string; href: string }[];
  section?: string; // starts a new section
}

const realtorNav: NavItem[] = [
  {
    label: "Initial Setup",
    href:  "/dashboard/setup",
    sub: [
      { label: "Overview",          href: "/dashboard/setup" },
      { label: "Licensing",         href: "/dashboard/licensing" },
      { label: "Emails from Board", href: "/dashboard/emails-from-board" },
      { label: "Systems Setup",     href: "/dashboard/systems" },
      { label: "Signs & Swag",      href: "/dashboard/signs-swag" },
      { label: "Email Setup",       href: "/dashboard/email-setup" },
      { label: "REAL Links",        href: "/dashboard/real-links" },
      { label: "Notices",           href: "/dashboard/notices" },
    ],
  },
  {
    label: "Roadmap",
    href:  "/dashboard/roadmap",
    sub: [
      { label: "My Career Path",    href: "/dashboard/roadmap" },
      { label: "Finding My System", href: "/dashboard/system" },
      { label: "Finding My Niche",  href: "/dashboard/niche" },
    ],
  },
  {
    label:   "My Coaching",
    href:    "/dashboard/coaching",
    section: "MY COACHING",
    sub: [
      { label: "Overview", href: "/dashboard" },
      { label: "My Week",  href: "/dashboard/week" },
    ],
  },
];

// ── Logo ───────────────────────────────────────────────────────────────────────

function NBRLogo() {
  return (
    <div className="px-5 py-5 border-b border-teal-200">
      <div className="flex flex-col">
        <span className="font-bold text-[#0D5C63] text-2xl leading-none tracking-tight select-none">
          NBR
        </span>
        <span className="text-[#0D5C63] text-xs font-normal opacity-60 mt-1">
          Onboarding
        </span>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

export function Sidebar({ role }: SidebarProps) {
  const pathname          = usePathname();
  const { data: session } = useSession();
  const unreadCount       = useNotices(role);

  const name     = session?.user?.name ?? (role === "admin" ? "Coach" : "Realtor");
  const image    = session?.user?.image ?? null;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-teal-200 flex flex-col justify-between shrink-0">

      <NBRLogo />

      {/* Nav */}
      {role === "realtor" ? (
        <RealtorNav pathname={pathname} unreadCount={unreadCount} />
      ) : (
        <CoachNav pathname={pathname} unreadCount={unreadCount} />
      )}

      {/* Footer */}
      <div className="flex flex-col gap-0">
        {role === "realtor" && (
          <Link
            href="/dashboard/profile"
            className={cn(
              "flex items-center px-5 py-2.5 text-sm transition-colors border-t border-teal-100",
              pathname === "/dashboard/profile"
                ? "bg-teal-100 text-teal-600 font-medium"
                : "text-slate-700 hover:bg-teal-50"
            )}
          >
            Profile
          </Link>
        )}
        <div className="px-4 py-4 border-t border-teal-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center shrink-0 overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt={name}
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-white text-xs font-bold">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-teal-800 truncate">{name}</p>
            <p className="text-xs text-teal-400">{role === "admin" ? "Coach" : "Realtor"}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 px-3 py-2 mb-2 text-xs text-teal-400
                     hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span>↩</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ── Realtor nav ────────────────────────────────────────────────────────────────

function RealtorNav({ pathname, unreadCount }: { pathname: string; unreadCount: number }) {
  let inCoachingSection = false;

  return (
    <nav className="flex-1 overflow-y-auto">
      {realtorNav.map((item) => {
        if (item.section) inCoachingSection = true;

        const isParentActive = pathname === item.href ||
          item.sub?.some((s) => pathname === s.href);

        if (item.section) {
          // MY COACHING section
          return (
            <div key={item.href}>
              {/* Section header */}
              <div className="px-5 pt-4 pb-1">
                <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
                  {item.section}
                </span>
              </div>
              <div className="border-l-2 border-[#FF6B35] ml-3 mr-2 px-2 pt-1">
                <span className="flex items-center px-3 py-2 text-sm font-medium text-slate-700">
                  {item.label}
                </span>
                {item.sub && (
                  <div className="ml-3 mt-0.5 mb-1 border-l border-teal-200 pl-2 space-y-0.5">
                    {item.sub.map((sub) => {
                      const isActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className={cn(
                            "flex items-center px-2 py-1.5 rounded-md text-xs transition-colors",
                            isActive
                              ? "bg-teal-100 text-teal-600 font-medium"
                              : "text-slate-600 hover:bg-teal-50 hover:text-slate-800"
                          )}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div key={item.href} className="px-2 pt-1">
            {/* Parent item */}
            <Link
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors font-medium",
                isParentActive
                  ? "bg-teal-100 text-teal-600"
                  : "text-slate-700 hover:bg-teal-50"
              )}
            >
              {item.label}
            </Link>

            {/* Sub-items */}
            {item.sub && (
              <div className="ml-3 mt-0.5 mb-1 border-l border-teal-200 pl-2 space-y-0.5">
                {item.sub.map((sub) => {
                  const isActive = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors",
                        isActive
                          ? "bg-teal-100 text-teal-600 font-medium"
                          : "text-slate-600 hover:bg-teal-50 hover:text-slate-800"
                      )}
                    >
                      {sub.label}
                      {sub.label === "Notices" && unreadCount > 0 && (
                        <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-orange-500 text-white
                                         text-[9px] font-bold flex items-center justify-center shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ── Coach nav ──────────────────────────────────────────────────────────────────

function CoachNav({ pathname, unreadCount }: { pathname: string; unreadCount: number }) {
  return (
    <nav className="flex-1 px-2 py-4 space-y-0.5">
      {coachNav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
              active
                ? "bg-teal-100 text-teal-600 font-medium"
                : "text-slate-700 hover:bg-teal-50"
            )}
          >
            {item.label}
            {item.label === "Notices" && unreadCount > 0 ? (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white
                               text-[10px] font-bold flex items-center justify-center shrink-0">
                {unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
