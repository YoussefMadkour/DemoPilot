import { Router } from "express";
import { VOICES, generateAudio } from "../services/tts.js";
import fs from "fs/promises";

export const voicesRouter = Router();

// GET /api/voices — list available TTS voices
voicesRouter.get("/", (_req, res) => {
  res.json(VOICES);
});

// GET /api/voices/:id/preview — play a sample of a voice
voicesRouter.get("/:id/preview", async (req, res) => {
  const voiceId = req.params.id;
  const voice = VOICES.find((v) => v.id === voiceId);
  if (!voice) return res.status(404).json({ error: "Voice not found" });

  const tmpDir = "/tmp/demopilot-voice-previews";
  await fs.mkdir(tmpDir, { recursive: true });

  const cachePath = `${tmpDir}/${voiceId}.mp3`;

  // Serve cached preview if available
  try {
    await fs.access(cachePath);
    return res.sendFile(cachePath);
  } catch {
    // generate fresh
  }

  try {
    const sampleText = `Welcome to the product demo. Let me walk you through the key features and show you how everything works.`;
    const segment = await generateAudio(sampleText, voiceId, tmpDir, 0);

    // Rename to cache name
    await fs.rename(segment.filePath, cachePath);
    res.sendFile(cachePath);
  } catch (err: any) {
    res.status(500).json({ error: "Preview generation failed", details: err.message });
  }
});
