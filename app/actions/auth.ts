"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
};

export async function authenticate(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      error:
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.",
    };
  }

  const intent = String(formData.get("intent") ?? "signin");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 6) {
    return {
      error: "Enter an email and a password of at least 6 characters.",
    };
  }

  if (intent === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: error.message };
    }

    if (!data.session) {
      return {
        message:
          "Account created. Confirm the email from Supabase, then sign in.",
      };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
