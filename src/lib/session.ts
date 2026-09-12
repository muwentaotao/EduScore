import { SignJWT, jwtVerify } from "jose";
import { AUTH_COOKIE } from "@/lib/auth";
import { SESSION_IDLE_TIMEOUT_SECONDS } from "@/lib/session-config";

const secret = process.env.AUTH_SECRET || "dev-auth-secret-change-in-production";
const key = new TextEncoder().encode(secret);

type SessionPayload = {
  sub: string;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_IDLE_TIMEOUT_SECONDS)
    .sign(key);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}

export function clearSessionCookieHeaders() {
  return {
    name: AUTH_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0
    }
  };
}

export function sessionCookieHeaders(token: string) {
  return {
    name: AUTH_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_IDLE_TIMEOUT_SECONDS
    }
  };
}
