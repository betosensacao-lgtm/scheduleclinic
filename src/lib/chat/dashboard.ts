import { db } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export interface DashboardStats {
  totalSessions: number;
  sessionsToday: number;
  totalMessages: number;
  messagesToday: number;
  recentSessions: Array<{
    sessionId: string;
    patientName: string | null;
    patientPhone: string | null;
    patientEmail: string | null;
    messageCount: number;
    createdAt: Date;
  }>;
}

export async function getDashboardStats(clinicId?: string): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sessionFilter = clinicId
    ? eq(chatSessions.clinicId, clinicId)
    : sql`true`;

  const messageFilter = clinicId
    ? eq(chatMessages.sessionId, sql`(SELECT session_id FROM chat_sessions WHERE clinic_id = ${clinicId})`)
    : sql`true`;

  const [totalSessions] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatSessions)
    .where(sessionFilter);

  const [sessionsToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatSessions)
    .where(sql`${sessionFilter} AND created_at >= ${today}`);

  const [totalMessages] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessages);

  const [messagesToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessages)
    .where(sql`created_at >= ${today}`);

  const recentSessions = await db
    .select({
      sessionId: chatSessions.sessionId,
      patientName: chatSessions.patientName,
      patientPhone: chatSessions.patientPhone,
      patientEmail: chatSessions.patientEmail,
      messageCount: sql<number>`(SELECT count(*)::int FROM ${chatMessages} WHERE ${chatMessages.sessionId} = ${chatSessions.sessionId})`,
      createdAt: chatSessions.createdAt,
    })
    .from(chatSessions)
    .where(sessionFilter)
    .orderBy(desc(chatSessions.createdAt))
    .limit(20);

  return {
    totalSessions: totalSessions?.count ?? 0,
    sessionsToday: sessionsToday?.count ?? 0,
    totalMessages: totalMessages?.count ?? 0,
    messagesToday: messagesToday?.count ?? 0,
    recentSessions,
  };
}
