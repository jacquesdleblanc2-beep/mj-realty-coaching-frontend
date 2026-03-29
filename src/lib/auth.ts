"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCoachByEmail, getRealtors, Realtor } from "./api";

const SUPER_ADMIN = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

export function isRealtorEmail(email: string, realtors: Realtor[]): boolean {
  return realtors.some((r) => r.email.toLowerCase() === email.toLowerCase());
}

export function useAuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    const email = session?.user?.email ?? "";

    // 1. Super admin check (env var only, never in DB)
    if (SUPER_ADMIN && email.toLowerCase() === SUPER_ADMIN.toLowerCase()) {
      router.push("/admin");
      return;
    }

    // 2. Coach check
    getCoachByEmail(email)
      .then((coach) => {
        if (coach) {
          sessionStorage.setItem("coachId", coach.id);
          router.push("/coach");
          return;
        }

        // 3. Realtor check
        getRealtors().then((realtors) => {
          if (isRealtorEmail(email, realtors)) {
            router.push("/dashboard");
          } else {
            router.push("/no-access");
          }
        });
      })
      .catch(() => {
        // If coach API fails, fall through to realtor check
        getRealtors().then((realtors) => {
          if (isRealtorEmail(email, realtors)) {
            router.push("/dashboard");
          } else {
            router.push("/no-access");
          }
        });
      });
  }, [status, session, router]);
}
