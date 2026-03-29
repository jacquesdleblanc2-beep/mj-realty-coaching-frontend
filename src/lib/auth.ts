"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCoachByEmail, getRealtors, Realtor } from "./api";

export function isRealtorEmail(email: string, realtors: Realtor[]): boolean {
  return realtors.some((r) => r.email.toLowerCase() === email.toLowerCase());
}

export function useAuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    const email = session?.user?.email ?? "";

    getCoachByEmail(email)
      .then((coach) => {
        if (coach) {
          sessionStorage.setItem("coachId", coach.id);
          router.push("/coach");
          return;
        }
        getRealtors().then((realtors) => {
          if (realtors.some((r) => r.email.toLowerCase() === email.toLowerCase())) {
            router.push("/dashboard");
          } else {
            router.push("/no-access");
          }
        });
      })
      .catch(() => {
        router.push("/no-access");
      });
  }, [status, session, router]);
}
