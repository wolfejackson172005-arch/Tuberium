import type { System, SystemSummary } from "./spec/types";

// The only frontend env variable. Anything starting with VITE_ is baked into the browser bundle,
// so no secret may ever go in a frontend env file.
export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

export function getSystem(id: string): Promise<System> {
  return getJson<System>(`/systems/${encodeURIComponent(id)}`);
}

export function listSystems(): Promise<SystemSummary[]> {
  return getJson<SystemSummary[]>("/systems");
}

export async function startRun(systemId: string, taskId: string, inputs: Record<string, string>): Promise<string> {
  const body = await getJson<{ runId: string }>("/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemId, taskId, inputs }),
  });
  return body.runId;
}

export function runEventsUrl(runId: string): string {
  return `${API_URL}/runs/${encodeURIComponent(runId)}/events`;
}
