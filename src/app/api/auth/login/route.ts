import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_PASSWORD, AUTH_USERNAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { username?: string; password?: string };
  const username = String(payload.username ?? "").trim();
  const password = String(payload.password ?? "");

  if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
    return NextResponse.json({ message: "用户名或密码错误" }, { status: 401 });
  }

  const response = NextResponse.json({ message: "登录成功" });
  response.cookies.set(AUTH_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12
  });
  return response;
}
