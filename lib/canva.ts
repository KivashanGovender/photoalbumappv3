import "server-only";
import { connection } from "next/server";
import { fetchWithTimeout } from "@/lib/fetch-timeout";

const TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token";
const BRAND_TEMPLATES_URL = "https://api.canva.com/rest/v1/brand-templates";
const BRAND_TEMPLATE_SCOPE = "service:brandtemplate:meta:read";
const EXPIRY_MARGIN_MS = 60_000;

export type CanvaBrandTemplate = {
  id: string;
  title: string;
  view_url: string;
  create_url: string;
  thumbnail?: {
    width: number;
    height: number;
    url: string;
  };
  created_at: number;
  updated_at: number;
};

type BrandTemplatesResponse = {
  items?: CanvaBrandTemplate[];
  message?: string;
  code?: string;
  error?: string;
  error_description?: string;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

const cache = new Map<string, CachedToken>();
const pending = new Map<string, Promise<string>>();

function credentials() {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Add CANVA_CLIENT_ID and CANVA_CLIENT_SECRET to .env.local, then restart the dev server.");
  }

  return { clientId, clientSecret };
}

function cacheKey(scope: string | undefined) {
  return scope?.trim() ?? "";
}

export async function getCanvaAccessToken(scope?: string) {
  const key = cacheKey(scope);
  const current = cache.get(key);

  if (current && current.expiresAt > Date.now() + EXPIRY_MARGIN_MS) {
    return current.accessToken;
  }

  const existing = pending.get(key);

  if (existing) {
    return existing;
  }

  const request = requestAccessToken(key).finally(() => {
    pending.delete(key);
  });
  pending.set(key, request);
  return request;
}

async function requestAccessToken(scope: string) {
  const { clientId, clientSecret } = credentials();
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  if (scope) {
    body.set("scope", scope);
  }

  const response = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as TokenResponse | null;

  if (!response.ok || !payload?.access_token) {
    const detail = payload?.error_description || payload?.error || `Canva token request failed (${response.status}).`;
    throw new Error(detail);
  }

  const expiresIn = typeof payload.expires_in === "number" && payload.expires_in > 0 ? payload.expires_in : 60;
  cache.set(scope, {
    accessToken: payload.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  });

  return payload.access_token;
}

export async function getCanvaBrandTemplates() {
  try {
    await connection();
    const accessToken = await getCanvaAccessToken(BRAND_TEMPLATE_SCOPE);
    const response = await fetchWithTimeout(BRAND_TEMPLATES_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as BrandTemplatesResponse | null;

    if (!response.ok || !payload?.items) {
      return [];
    }

    return payload.items;
  } catch {
    return [];
  }
}
