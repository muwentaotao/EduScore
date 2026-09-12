import { NextRequest, NextResponse } from "next/server";
import { AUTH_PASSWORD, AUTH_USERNAME } from "@/lib/auth";
import { createSessionToken, sessionCookieHeaders } from "@/lib/session";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { username?: string; password?: string };
  const username = String(payload.username ?? "").trim();
  const password = String(payload.password ?? "");

  if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
    return NextResponse.json({ message: "用户名或密码错误" }, { status: 401 });
  }

  const token = await createSessionToken({ sub: AUTH_USERNAME });
  const response = NextResponse.json({ message: "登录成功" });
  const cookie = sessionCookieHeaders(token);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
