import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const session = await verifySessionToken(cookie.value);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
      clinicId: session.clinicId,
    },
  });
}
