import { supabase } from "@/lib/supabase";

export async function signInOrSignUp(email: string, password: string) {
  const signInResult = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (!signInResult.error) {
    return signInResult;
  }

  return supabase.auth.signUp({
    email,
    password
  });
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
