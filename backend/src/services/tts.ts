import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import type { AudioSegment } from "../types.js";

const execAsync = promisify(exec);

// Available edge-tts voices (popular ones)
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

export async function generateAudio(
  text: string,
  voice: string,
  outputDir: string,
  index: number
): Promise<AudioSegment> {
  const outputFile = path.join(outputDir, `segment_${index}.mp3`);

  // Escape quotes in text for shell safety
  const safeText = text.replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");

  await execAsync(
    `edge-tts --voice "${voice}" --text "${safeText}" --write-media "${outputFile}"`,
    { timeout: 30000 }
  );

  // Get audio duration using ffprobe
  const { stdout } = await execAsync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputFile}"`
  );
  const duration = parseFloat(stdout.trim()) || 3;

  return { filePath: outputFile, duration };
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
      const segment = await generateAudio(segments[i].narration, voice, outputDir, i);
      results.push(segment);
    } else {
      // Silent segment — create a short silence
      const silencePath = path.join(outputDir, `segment_${i}.mp3`);
      await execAsync(
        `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 2 "${silencePath}"`
      );
      results.push({ filePath: silencePath, duration: 2 });
    }
  }
  return results;
}
