import { Router } from "express";
import { v4 as uuid } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { recordDemo } from "../services/browser.js";
import { generateAllAudio } from "../services/tts.js";
import { composeVideo } from "../services/composer.js";
import type { GenerateRequest, JobStatus } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_BASE = path.join(__dirname, "..", "..", "output");

export const generateRouter = Router();

// In-memory job store
const jobs = new Map<string, JobStatus>();

// POST /api/generate — start video generation
generateRouter.post("/", async (req, res) => {
  const { script } = req.body as GenerateRequest;

  if (!script || !script.segments?.length) {
    return res.status(400).json({ error: "Script with segments is required" });
  }

  const jobId = uuid();
  const outputDir = path.join(OUTPUT_BASE, jobId);
  await fs.mkdir(outputDir, { recursive: true });

  jobs.set(jobId, {
    id: jobId,
    status: "queued",
    progress: 0,
    message: "Job queued",
  });

  res.json({ jobId, status: "queued" });

  // Run pipeline async
  runPipeline(jobId, script, outputDir).catch((err) => {
    console.error(`Job ${jobId} failed:`, err);
    jobs.set(jobId, {
      id: jobId,
      status: "error",
      progress: 0,
      message: err.message || "Unknown error",
    });
  });
});

// GET /api/generate/:jobId — check status
generateRouter.get("/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// GET /api/generate/:jobId/download — download final video
generateRouter.get("/:jobId/download", async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.status !== "done" || !job.outputPath) {
    return res.status(400).json({ error: "Video not ready" });
  }

  try {
    await fs.access(job.outputPath);
    res.download(job.outputPath, "demopilot_demo.mp4");
  } catch {
    res.status(404).json({ error: "Video file not found" });
  }
});

async function runPipeline(
  jobId: string,
  script: import("../types.js").DemoScript,
  outputDir: string
) {
  const update = (status: JobStatus["status"], progress: number, message: string) => {
    jobs.set(jobId, { id: jobId, status, progress, message });
  };

  // Step 1: Generate narration audio
  update("generating_audio", 10, "Generating voiceover...");
  const audioDir = path.join(outputDir, "audio");
  const audioSegments = await generateAllAudio(script.segments, script.voice, audioDir);
  update("generating_audio", 30, "Voiceover complete");

  // Step 2: Record browser session
  update("recording", 40, "Recording browser demo...");
  const { videoPath } = await recordDemo({
    url: script.url,
    segments: script.segments,
    audioSegments,
    outputDir,
    resolution: script.resolution,
    onProgress: (seg, total) => {
      const pct = 40 + Math.round((seg / total) * 30);
      update("recording", pct, `Recording segment ${seg}/${total}`);
    },
  });
  update("recording", 70, "Recording complete");

  // Step 3: Compose final video
  update("composing", 75, "Composing final video...");
  const finalPath = await composeVideo({
    videoPath,
    audioSegments,
    title: script.title,
    outputDir,
    resolution: script.resolution,
  });
  // Step 4: Video QA with Gemini (non-blocking — video is ready even if QA fails)
  update("composing", 90, "Running AI quality review...");
  let qaResult = null;
  try {
    const { extractFrames, reviewVideo } = await import("../services/gemini.js");
    const framePaths = await extractFrames(finalPath, outputDir, 6);
    qaResult = await reviewVideo(framePaths);
    console.log(`Video QA: score=${qaResult.score}/10 passed=${qaResult.passed}`);
  } catch (err) {
    console.warn("Video QA skipped:", err);
  }

  const qaMsg = qaResult
    ? `Video ready (QA: ${qaResult.score}/10 — ${qaResult.summary})`
    : "Video ready for download";

  update("done", 100, qaMsg);
  jobs.set(jobId, {
    id: jobId,
    status: "done",
    progress: 100,
    message: qaMsg,
    outputPath: finalPath,
  });
}
