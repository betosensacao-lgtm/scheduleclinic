import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { db } from "@/db";
import { users } from "@/db/schema";

// Handles:
// 1. Email confirmation links (signUp with confirmation enabled)
// 2. OAuth provider redirects (Google)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await db.insert(users).values({
        email: data.user.email!,
        name: data.user.user_metadata?.name ?? data.user.email!.split("@")[0],
        role: data.user.user_metadata?.role ?? "patient",
        supabaseId: data.user.id,
      }).onConflictDoNothing();

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
