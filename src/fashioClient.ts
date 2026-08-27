/**
 * Thin fetch wrapper around the Fashio v1 API (docs.fashiolabs.com).
 * One file, no retries/caching — the MCP tools in index.ts are the contract.
 */
import { readFile } from "node:fs/promises";

const BASE_URL = process.env.FASHIO_API_BASE_URL || "https://api.fashiolabs.com";

function apiKey(): string {
  const key = process.env.FASHIO_API_KEY;
  if (!key) {
    throw new Error(
      "FASHIO_API_KEY is not set. Create a key at fashiolabs.com → Profile → API Keys, " +
        "then set it in this MCP server's env config.",
    );
  }
  return key;
}

async function asJson(res: Response): Promise<any> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Fashio API ${res.status}: ${body?.error || res.statusText}`);
  }
  return body;
}

export function listModels(): Promise<any> {
  return fetch(`${BASE_URL}/v1/models`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  }).then(asJson);
}

export function listFashionModels(params: { gender?: string; limit?: number }): Promise<any> {
  const qs = new URLSearchParams();
  if (params.gender) qs.set("gender", params.gender);
  if (params.limit) qs.set("limit", String(params.limit));
  return fetch(`${BASE_URL}/v1/fashion-models?${qs}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  }).then(asJson);
}

export function listVenues(params: { limit?: number }): Promise<any> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  return fetch(`${BASE_URL}/v1/venues?${qs}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  }).then(asJson);
}

export function listPoses(params: { type?: string; limit?: number }): Promise<any> {
  const qs = new URLSearchParams();
  if (params.type) qs.set("type", params.type);
  if (params.limit) qs.set("limit", String(params.limit));
  return fetch(`${BASE_URL}/v1/poses?${qs}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  }).then(asJson);
}

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Reads a LOCAL file path (the agent's own filesystem) and uploads it. */
export async function uploadImage(params: { filePath: string }): Promise<any> {
  const ext = params.filePath.slice(params.filePath.lastIndexOf(".")).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    throw new Error(`Unsupported extension "${ext}" — only .jpg, .jpeg, .png, .webp.`);
  }
  const bytes = await readFile(params.filePath);
  return fetch(`${BASE_URL}/v1/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": contentType,
    },
    body: bytes,
  }).then(asJson);
}

export function createGeneration(body: Record<string, unknown>): Promise<any> {
  return fetch(`${BASE_URL}/v1/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).then(asJson);
}

export function getGeneration(id: string): Promise<any> {
  return fetch(`${BASE_URL}/v1/generations/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  }).then(asJson);
}

export function getAccount(): Promise<any> {
  return fetch(`${BASE_URL}/v1/account`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  }).then(asJson);
}

export function createTemplateSet(body: Record<string, unknown>): Promise<any> {
  return fetch(`${BASE_URL}/v1/template-sets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).then(asJson);
}

export function listTemplateSets(): Promise<any> {
  return fetch(`${BASE_URL}/v1/template-sets`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  }).then(asJson);
}

export function deleteTemplateSet(id: string): Promise<any> {
  return fetch(`${BASE_URL}/v1/template-sets/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey()}` },
  }).then(asJson);
}

export function listReadyTemplateSets(params: Record<string, unknown>): Promise<any> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  }
  return fetch(`${BASE_URL}/v1/ready-template-sets?${qs}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  }).then(asJson);
}

export function getReadyTemplateSet(id: string): Promise<any> {
  return fetch(`${BASE_URL}/v1/ready-template-sets/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  }).then(asJson);
}

export function createCatalogJob(body: Record<string, unknown>): Promise<any> {
  return fetch(`${BASE_URL}/v1/catalog-jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).then(asJson);
}
