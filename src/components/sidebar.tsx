"use client";

// src/components/sidebar.tsx

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "realtor" | "admin";
}

const realtorNav = [
  { label: "Dashboard", href: "/dashboard",         dot: null },
  { label: "History",   href: "/dashboard/history", dot: null },
  { label: "Profile",   href: "/dashboard/profile", dot: null },
  { label: "Help",      href: "/dashboard/help",    dot: null },
];

const adminNav = [
  { label: "Overview",     href: "/coach",           dot: null },
  { label: "My Realtors",  href: "/coach/realtors",  dot: null },
  { label: "Reports",      href: "/coach/reports",   dot: null },
  { label: "Send History", href: "/coach/history",   dot: null },
  { label: "Pipeline",     href: "/coach/scheduler", dot: null },
  { label: "Add Realtor®", href: "/coach/add",       dot: null },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname          = usePathname();
  const { data: session } = useSession();
  const nav               = role === "realtor" ? realtorNav : adminNav;

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
    <aside className="w-56 min-h-screen bg-white border-r border-teal-200 flex flex-col shrink-0">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-teal-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">MJ</span>
          </div>
          <div>
            <p className="font-semibold text-teal-800 text-sm leading-none">MJ Realty</p>
            <p className="text-[11px] text-teal-400 mt-0.5">Coaching Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-teal-100 text-teal-600 font-medium"
                  : "text-teal-700 hover:bg-teal-50"
              )}
            >
              {item.label}
              {item.dot === "orange" && (
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / user */}
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
    </aside>
  );
}
