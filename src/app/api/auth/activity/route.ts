import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import {
  clearSessionCookieHeaders,
  createSessionToken,
  sessionCookieHeaders,
  verifySessionToken
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || typeof session.sub !== "string") {
    const response = NextResponse.json(
      { message: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
    const cleared = clearSessionCookieHeaders();
    response.cookies.set(cleared.name, cleared.value, cleared.options);
    return response;
  }

  const refreshedToken = await createSessionToken({ sub: session.sub });
  const response = NextResponse.json(
    { message: "会话已续期" },
    { headers: { "Cache-Control": "no-store" } }
  );
  const cookie = sessionCookieHeaders(refreshedToken);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
