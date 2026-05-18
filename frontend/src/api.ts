import type { DemoScript, Voice, JobStatus } from "./types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3002";

export async function fetchVoices(): Promise<Voice[]> {
  const res = await fetch(`${BASE}/api/voices`);
  if (!res.ok) throw new Error("Failed to fetch voices");
  return res.json();
}

export interface ScriptGenResult {
  script: DemoScript;
  hasScreenshot: boolean;
}

export async function generateScript(url: string, context?: string): Promise<ScriptGenResult> {
  const res = await fetch(`${BASE}/api/scripts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, context }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || err.details || "Script generation failed");
  }
  return res.json();
}

export async function captureScreenshot(url: string): Promise<string> {
  const res = await fetch(`${BASE}/api/scripts/screenshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Screenshot capture failed");
  const data = await res.json();
  return data.screenshot;
}

export interface VoiceScriptResult {
  script: DemoScript;
  transcript: string;
  confidence: number;
  hasScreenshot: boolean;
}

export async function voiceToScript(url: string, audioBlob: Blob): Promise<VoiceScriptResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("url", url);

  const res = await fetch(`${BASE}/api/scripts/voice`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || err.details || "Voice-to-script failed");
  }
  return res.json();
}

export async function startGeneration(script: DemoScript): Promise<string> {
  const res = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script }),
  });
  if (!res.ok) throw new Error("Failed to start generation");
  const data = await res.json();
  return data.jobId;
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${BASE}/api/generate/${jobId}`);
  if (!res.ok) throw new Error("Failed to get job status");
  return res.json();
}

export function getDownloadUrl(jobId: string): string {
  return `${BASE}/api/generate/${jobId}/download`;
}
