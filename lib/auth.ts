import { supabase } from "@/lib/supabase";

export async function signInWithGoogle() {
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo
    }
  });
}

export async function getLatestBusinessProfileForUser(userId: string) {
  return supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  return { user, error };
}

export async function signOut() {
  return supabase.auth.signOut();
}
