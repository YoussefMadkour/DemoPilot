import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import {
  generateScript,
  captureScreenshot,
  voiceToScript,
  extractFrames,
  reviewVideo,
} from "../services/gemini.js";
import { transcribeAudio } from "../services/speechmatics.js";
import type { ScriptGenRequest } from "../types.js";

const upload = multer({ dest: "/tmp/demopilot-uploads/" });

export const scriptsRouter = Router();

// POST /api/scripts — auto-generate a demo script from URL (with screenshot analysis)
scriptsRouter.post("/", async (req, res) => {
  const { url, context } = req.body as ScriptGenRequest;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Capture screenshot + page structure for visual + semantic context
    let screenshotBase64: string | undefined;
    let pageInfo: string | undefined;
    try {
      console.log("Capturing screenshot + page structure of", url);
      const screenshot = await captureScreenshot(url);
      screenshotBase64 = screenshot.base64;
      pageInfo = screenshot.pageInfo;
      console.log("Screenshot captured. Page info:\n", pageInfo?.slice(0, 500));
    } catch (err) {
      console.warn("Screenshot capture failed, generating without visual context:", err);
    }

    const script = await generateScript(url, context, screenshotBase64, pageInfo);
    res.json({ script, hasScreenshot: !!screenshotBase64 });
  } catch (err: any) {
    console.error("Script generation failed:", err);
    res.status(500).json({
      error: "Failed to generate script",
      details: err.message,
    });
  }
});

// POST /api/scripts/screenshot — capture and return a screenshot of a URL
scriptsRouter.post("/screenshot", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const { base64 } = await captureScreenshot(url);
    res.json({ screenshot: `data:image/png;base64,${base64}` });
  } catch (err: any) {
    res.status(500).json({ error: "Screenshot failed", details: err.message });
  }
});

// POST /api/scripts/voice — voice-to-script: upload audio → Speechmatics → Gemini
scriptsRouter.post("/voice", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Audio file is required" });
  }

  const url = req.body.url;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Step 1: Transcribe with Speechmatics
    console.log("Transcribing audio with Speechmatics...");
    const { transcript, confidence } = await transcribeAudio(req.file.path);
    console.log(`Transcript (${(confidence * 100).toFixed(0)}% confidence): ${transcript}`);

    if (!transcript.trim()) {
      return res.status(400).json({ error: "No speech detected in audio" });
    }

    // Step 2: Capture screenshot + page info
    let screenshotBase64: string | undefined;
    let pageInfo: string | undefined;
    try {
      const screenshot = await captureScreenshot(url);
      screenshotBase64 = screenshot.base64;
      pageInfo = screenshot.pageInfo;
    } catch {
      // proceed without screenshot
    }

    // Step 3: Convert transcript to structured script via Gemini
    console.log("Converting voice transcript to demo script via Gemini...");
    const script = await voiceToScript(url, transcript, screenshotBase64, pageInfo);

    res.json({
      script,
      transcript,
      confidence,
      hasScreenshot: !!screenshotBase64,
    });
  } catch (err: any) {
    console.error("Voice-to-script failed:", err);
    res.status(500).json({
      error: "Voice-to-script failed",
      details: err.message,
    });
  } finally {
    // Clean up uploaded file
    fs.unlink(req.file.path).catch(() => {});
  }
});

// POST /api/scripts/review — QA review a generated video
scriptsRouter.post("/review", async (req, res) => {
  const { videoPath } = req.body;
  if (!videoPath) {
    return res.status(400).json({ error: "videoPath is required" });
  }

  try {
    const outputDir = path.dirname(videoPath);
    const framePaths = await extractFrames(videoPath, outputDir, 6);
    const qa = await reviewVideo(framePaths);
    res.json(qa);
  } catch (err: any) {
    console.error("Video QA failed:", err);
    res.status(500).json({ error: "Video QA failed", details: err.message });
  }
});
