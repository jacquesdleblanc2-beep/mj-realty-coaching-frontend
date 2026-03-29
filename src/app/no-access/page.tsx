"use client";

// src/app/no-access/page.tsx

import { signOut, useSession } from "next-auth/react";

export default function NoAccessPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-base select-none">MJ</span>
        </div>
        <span className="text-teal-800 font-semibold text-xl">MJ Realty</span>
      </div>

      <h1 className="text-2xl font-medium text-teal-800 text-center mb-3">
        You don&apos;t have access yet
      </h1>
      <p className="text-base text-teal-400 text-center max-w-xs mb-6">
        Ask Martin to add you to the coaching platform.
      </p>

      {session?.user?.email && (
        <p className="text-sm text-teal-300 mb-8">
          Signed in as <span className="text-teal-500 font-medium">{session.user.email}</span>
        </p>
      )}

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-2 bg-white border border-teal-200 hover:border-teal-400
                   text-teal-700 font-medium px-5 py-2.5 rounded-xl shadow-sm hover:shadow
                   transition-all text-sm"
      >
        Sign out
      </button>
    </div>
  );
}
