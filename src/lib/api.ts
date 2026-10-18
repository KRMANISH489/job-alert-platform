import { cookies } from "next/headers";

const BASE = process.env.API_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function revive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = key === "createdAt" && typeof item === "number" ? new Date(item) : revive(item);
    }
    return out;
  }
  return value;
}

export async function api<T>(
  path: string,
  options?: { method?: string; body?: unknown; auth?: boolean },
): Promise<T> {
  const headers = new Headers();
  if (options?.body !== undefined) headers.set("content-type", "application/json");
  if (options?.auth) {
    const token = (await cookies()).get("ja_session")?.value;
    if (token) headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BASE}${path}`, {
    method: options?.method ?? (options?.body === undefined ? "GET" : "POST"),
    headers,
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  const text = await response.text();
  let data: { detail?: unknown } = {};
  if (text) {
    try {
      data = JSON.parse(text) as { detail?: unknown };
    } catch {
      if (!response.ok) throw new ApiError(response.status, "The API returned an unexpected response.");
      throw new ApiError(response.status || 500, "The API returned an unexpected response.");
    }
  }
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "Request failed.";
    throw new ApiError(response.status, detail);
  }
  return revive(data) as T;
}
