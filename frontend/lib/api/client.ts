/**
 * Low-level HTTP client for the AquaTrace backend (FastAPI / Flask).
 *
 * Configure through environment variables (see .env.example):
 *   NEXT_PUBLIC_USE_MOCK      "false" to talk to the real backend
 *   NEXT_PUBLIC_API_BASE_URL  e.g. https://api.aquatrace.example/api/v1
 *
 * Mock data lives in lib/mock and is only wired in by lib/api/farmer.ts when
 * USE_MOCK is true. Nothing in the UI imports lib/mock directly.
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

let currentLocale = "en";

/** Called by I18nProvider so requests carry Accept-Language. */
export function setApiLocale(locale: string) {
  currentLocale = locale;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | undefined>;

interface ApiInit extends Omit<RequestInit, "body"> {
  query?: Query;
  body?: unknown;
}

export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { query, body, headers, ...rest } = init;
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    ...rest,
    headers: {
      Accept: "application/json",
      "Accept-Language": currentLocale,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      // TODO(auth): attach `Authorization: Bearer <token>` here once login exists.
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { detail?: string };
      if (data?.detail) message = String(data.detail);
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
