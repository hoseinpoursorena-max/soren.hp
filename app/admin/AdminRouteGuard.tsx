"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["hoseinpour.sorena@gmail.com"];

export function AdminRouteGuard() {
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("ADMIN ROUTE GUARD AUTH ERROR:", error);
      }

      if (!data.user) {
        router.push("/login");
        return;
      }

      if (!data.user.email || !ADMIN_EMAILS.includes(data.user.email)) {
        router.push("/dashboard");
      }
    };

    checkAdmin();
  }, [router]);

  return null;
}
