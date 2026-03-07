import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookieHeaders } from "@/lib/session";

export async function POST(_: NextRequest) {
  const response = NextResponse.json({ message: "已退出登录" });
  const cleared = clearSessionCookieHeaders();
  response.cookies.set(cleared.name, cleared.value, cleared.options);
  return response;
}
