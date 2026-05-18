import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import type { AudioSegment } from "../types.js";

const execAsync = promisify(exec);

interface ComposeOptions {
  videoPath: string;
  audioSegments: AudioSegment[];
  title: string;
  outputDir: string;
  resolution: { width: number; height: number };
}

export async function composeVideo(opts: ComposeOptions): Promise<string> {
  const { videoPath, audioSegments, outputDir, resolution } = opts;
  const { width, height } = resolution;

  // Step 1: Concat all audio segments into one track
  const concatListPath = path.join(outputDir, "audio_concat.txt");
  const concatAudioPath = path.join(outputDir, "narration_full.mp3");
  const outputPath = path.join(outputDir, "demo_final.mp4");

  const concatContent = audioSegments
    .map((s) => `file '${s.filePath}'`)
    .join("\n");
  await fs.writeFile(concatListPath, concatContent);

  await execAsync(
    `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${concatAudioPath}"`,
    { timeout: 60000 }
  );

  // Step 2: Convert recorded video to MP4 (from webm)
  // Playwright records at exact viewport size, so just transcode without scaling/padding
  const recordingMp4 = path.join(outputDir, "recording.mp4");
  await execAsync(
    `ffmpeg -y -i "${videoPath}" ` +
    `-c:v libx264 -preset medium -crf 18 -r 30 -pix_fmt yuv420p "${recordingMp4}"`,
    { timeout: 120000 }
  );

  // Step 3: Compose — merge narration audio onto browser recording (no title card)
  await execAsync(
    `ffmpeg -y -i "${recordingMp4}" -i "${concatAudioPath}" ` +
    `-c:v libx264 -preset medium -crf 18 -r 30 -pix_fmt yuv420p ` +
    `-c:a aac -b:a 192k -ar 44100 ` +
    `-map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`,
    { timeout: 120000 }
  );

  return outputPath;
}
