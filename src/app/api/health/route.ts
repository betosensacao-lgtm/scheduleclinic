import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  // Verify cron secret for scheduled requests
  const authHeader = request.headers.get("authorization");
  const isCronRequest = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  // Allow public access for basic health check, but log cron details only for authenticated requests
  const checks: Record<string, { status: string; details?: string }> = {};

  // 1. Database connection
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = { status: "ok" };
  } catch (e: any) {
    checks.database = { status: "error", details: e.message };
  }

  // 2. Check all tables exist
  const expectedTables = [
    "users", "clinics", "professionals", "appointments",
    "triage_sessions", "triage_messages", "pre_anamnesis", "whatsapp_sessions"
  ];

  try {
    const result = await db.execute(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ${sql.raw(`(${expectedTables.map(t => `'${t}'`).join(',')})`)}
    `);
    const found = (result as any[]).map((r: any) => r.table_name);
    const missing = expectedTables.filter(t => !found.includes(t));

    checks.tables = {
      status: missing.length === 0 ? "ok" : "warning",
      details: missing.length > 0 ? `Missing: ${missing.join(", ")}` : `${found.length}/${expectedTables.length} tables`
    };
  } catch (e: any) {
    checks.tables = { status: "error", details: e.message };
  }

  // 3. Check RLS status (only for authenticated requests)
  if (isCronRequest) {
    try {
      const result = await db.execute(sql`
        SELECT tablename, rowsecurity FROM pg_tables
        WHERE schemaname = 'public'
      `);
      const tables = (result as any[]);
      const noRLS = tables.filter((t: any) => !t.rowsecurity);

      checks.rls = {
        status: noRLS.length === 0 ? "ok" : "critical",
        details: noRLS.length > 0 ? `Tables without RLS: ${noRLS.map((t: any) => t.tablename).join(", ")}` : "All tables have RLS"
      };
    } catch (e: any) {
      checks.rls = { status: "error", details: e.message };
    }
  }

  // 4. WhatsApp configuration
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM clinics
      WHERE whatsapp_phone_number_id IS NOT NULL AND whatsapp_access_token IS NOT NULL
    `);
    const count = (result as any[])[0]?.count || 0;
    checks.whatsapp = {
      status: count > 0 ? "ok" : "warning",
      details: `${count} clinic(s) configured`
    };
  } catch (e: any) {
    checks.whatsapp = { status: "error", details: e.message };
  }

  const hasErrors = Object.values(checks).some(c => c.status === "error" || c.status === "critical");

  return NextResponse.json({
    status: hasErrors ? "degraded" : "healthy",
    timestamp: new Date().toISOString(),
    checks,
  });
}
