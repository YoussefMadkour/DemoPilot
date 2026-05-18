import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import type { AudioSegment } from "../types.js";

const execAsync = promisify(exec);

export const VOICES = [
  { id: "en-US-AndrewMultilingualNeural", name: "Andrew (US)", gender: "Male", lang: "en-US" },
  { id: "en-US-AvaMultilingualNeural", name: "Ava (US)", gender: "Female", lang: "en-US" },
  { id: "en-US-BrianMultilingualNeural", name: "Brian (US)", gender: "Male", lang: "en-US" },
  { id: "en-US-EmmaMultilingualNeural", name: "Emma (US)", gender: "Female", lang: "en-US" },
  { id: "en-US-GuyNeural", name: "Guy (US)", gender: "Male", lang: "en-US" },
  { id: "en-US-JennyNeural", name: "Jenny (US)", gender: "Female", lang: "en-US" },
  { id: "en-US-AriaNeural", name: "Aria (US)", gender: "Female", lang: "en-US" },
  { id: "en-GB-SoniaNeural", name: "Sonia (GB)", gender: "Female", lang: "en-GB" },
  { id: "en-GB-RyanNeural", name: "Ryan (GB)", gender: "Male", lang: "en-GB" },
  { id: "en-AU-NatashaNeural", name: "Natasha (AU)", gender: "Female", lang: "en-AU" },
];

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function generateAudio(
  text: string,
  voice: string,
  outputDir: string,
  index: number
): Promise<AudioSegment> {
  const outputFile = path.join(outputDir, `segment_${index}.mp3`);
  const safeText = text.replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");

  // Retry up to 3 times with backoff (edge-tts can 503 under load)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`  TTS retry ${attempt + 1}/3 for segment ${index} (waiting ${attempt * 3}s)...`);
        await sleep(attempt * 3000);
      }
      await execAsync(
        `edge-tts --voice "${voice}" --text "${safeText}" --write-media "${outputFile}"`,
        { timeout: 30000 }
      );

      const { stdout } = await execAsync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputFile}"`
      );
      const duration = parseFloat(stdout.trim()) || 3;
      return { filePath: outputFile, duration };
    } catch (err: any) {
      if (attempt === 2) throw err; // final attempt failed
      console.warn(`  TTS attempt ${attempt + 1} failed: ${err.message?.slice(0, 60)}`);
    }
  }

  throw new Error("TTS failed after 3 attempts");
}

export async function generateAllAudio(
  segments: { narration: string }[],
  voice: string,
  outputDir: string
): Promise<AudioSegment[]> {
  await fs.mkdir(outputDir, { recursive: true });

  const results: AudioSegment[] = [];
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].narration.trim()) {
      // Small delay between segments to avoid rate limiting
      if (i > 0) await sleep(500);
      const segment = await generateAudio(segments[i].narration, voice, outputDir, i);
      results.push(segment);
    } else {
      const silencePath = path.join(outputDir, `segment_${i}.mp3`);
      await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 2 "${silencePath}"`);
      results.push({ filePath: silencePath, duration: 2 });
    }
  }
  return results;
}
