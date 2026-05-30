"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loginSchema, registerSchema } from "@/lib/validations";
import type { LoginInput, RegisterInput } from "@/lib/validations";

export async function loginAction(
  data: LoginInput,
  next?: string
): Promise<{ error: string } | void> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid credentials." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { error: error.message };

  // Only allow internal redirects (prevent open-redirect via ?next=)
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  redirect(safeNext);
}

export async function registerAction(data: RegisterInput): Promise<{ error: string } | void> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data." };

  const supabase = await createServerSupabaseClient();

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name, role: parsed.data.role },
    },
  });

  if (signUpError) return { error: signUpError.message };
  if (!authData.user) return { error: "Registration failed. Please try again." };

  if (authData.session) {
    // Email confirmation is disabled — user is immediately authenticated
    await db.insert(users).values({
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      supabaseId: authData.user.id,
    }).onConflictDoNothing();

    redirect("/dashboard");
  } else {
    // Email confirmation is enabled — user profile will be created in /auth/callback
    redirect("/auth/verify-email");
  }
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
