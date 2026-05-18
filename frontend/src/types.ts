export interface ScriptAction {
  type: "navigate" | "click" | "type" | "scroll" | "wait" | "hover" | "screenshot";
  selector?: string;
  value?: string;
  url?: string;
  duration?: number;
  direction?: "up" | "down";
  pixels?: number;
}

export interface ScriptSegment {
  narration: string;
  actions: ScriptAction[];
}

export interface DemoScript {
  title: string;
  url: string;
  voice: string;
  resolution: { width: number; height: number };
  segments: ScriptSegment[];
}

export interface Voice {
  id: string;
  name: string;
  gender: string;
  lang: string;
}

export interface JobStatus {
  id: string;
  status: "queued" | "recording" | "generating_audio" | "composing" | "done" | "error";
  progress: number;
  message?: string;
}
