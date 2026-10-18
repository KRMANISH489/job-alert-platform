import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { api, ApiError } from "@/lib/api";

const COOKIE = "ja_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "seeker" | "employer" | "admin";
  companyId: string | null;
};

function secret() {
  return process.env.AUTH_SECRET || "jobalert-local-dev-secret";
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function encodeSession(userId: string) {
  const body = Buffer.from(JSON.stringify({ userId, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string) {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as { userId?: string; exp?: number };
    if (!data.userId || !data.exp || data.exp < Date.now()) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

function asRole(role: string): SessionUser["role"] {
  if (role === "employer" || role === "admin") return role;
  return "seeker";
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const parsed = decodeSession(token);
  if (!parsed) return null;
  try {
    const user = await api<SessionUser>("/auth/me", { auth: true });
    return { ...user, role: asRole(user.role) };
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
});

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function homeFor(role: string) {
  if (role === "employer") return "/hire";
  if (role === "admin") return "/admin";
  return "/";
}

export function safeNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "";
  return value;
}
