"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCoachByEmail, getRealtorByEmail, registerSelf } from "./api";

const SUPER_ADMIN = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

async function resolveRealtorAndRedirect(
  name: string,
  email: string,
  router: ReturnType<typeof useRouter>
) {
  try {
    const existing = await getRealtorByEmail(email);
    if (existing) {
      router.push("/dashboard");
      return;
    }
    await registerSelf(name, email);
    router.push("/dashboard");
  } catch {
    router.push("/no-access");
  }
}

export function useAuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    const name  = session?.user?.name  ?? email;

    // 1. Super admin
    if (SUPER_ADMIN && email.toLowerCase() === SUPER_ADMIN.toLowerCase()) {
      router.push("/admin");
      return;
    }

    // 2. Coach check → 3. Realtor check / auto-register
    getCoachByEmail(email)
      .then((coach) => {
        if (coach) {
          sessionStorage.setItem("coachId", coach.id);
          router.push("/coach");
          return;
        }
        resolveRealtorAndRedirect(name, email, router);
      })
      .catch(() => resolveRealtorAndRedirect(name, email, router));
  }, [status, session, router]);
}
