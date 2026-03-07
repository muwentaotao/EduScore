import { SignJWT, jwtVerify } from "jose";
import { AUTH_COOKIE } from "@/lib/auth";

const secret = process.env.AUTH_SECRET || "dev-auth-secret-change-in-production";
const key = new TextEncoder().encode(secret);

type SessionPayload = {
  sub: string;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
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
