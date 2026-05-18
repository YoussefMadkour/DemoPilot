export interface ScriptSegment {
  narration: string;
  actions: ScriptAction[];
}

export interface ScriptAction {
  type: "navigate" | "click" | "type" | "scroll" | "wait" | "hover" | "screenshot";
  selector?: string;
  value?: string;
  url?: string;
  duration?: number; // ms
  direction?: "up" | "down";
  pixels?: number;
}

export interface DemoScript {
  title: string;
  url: string;
  voice: string;
  resolution: { width: number; height: number };
  segments: ScriptSegment[];
}

export interface GenerateRequest {
  script: DemoScript;
}

export interface ScriptGenRequest {
  url: string;
  context?: string; // optional user hints about what to demo
}

export interface JobStatus {
  id: string;
  status: "queued" | "recording" | "generating_audio" | "composing" | "done" | "error";
  progress: number; // 0-100
  message?: string;
  outputPath?: string;
}

export interface AudioSegment {
  filePath: string;
  duration: number; // seconds
}
