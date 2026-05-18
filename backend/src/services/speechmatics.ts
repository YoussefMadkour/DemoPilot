import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const SPEECHMATICS_API_URL = "https://asr.api.speechmatics.com/v2";

interface TranscriptionResult {
  transcript: string;
  confidence: number;
  words: { content: string; start_time: number; end_time: number }[];
}

export async function transcribeAudio(
  audioPath: string
): Promise<TranscriptionResult> {
  const apiKey = process.env.SPEECHMATICS_API_KEY;
  if (!apiKey) {
    throw new Error("SPEECHMATICS_API_KEY not set");
  }

  // Convert to wav — webm from browser mic often has codec issues with APIs
  const wavPath = audioPath + ".wav";
  try {
    await execAsync(`ffmpeg -y -i "${audioPath}" -acodec pcm_s16le -ar 16000 -ac 1 "${wavPath}"`, { timeout: 15000 });
  } catch (err) {
    console.warn("Audio conversion failed:", err);
  }

  let uploadPath = audioPath;
  try {
    const stat = await fs.stat(wavPath);
    if (stat.size > 100) uploadPath = wavPath; // only use wav if it's valid
  } catch {
    // wav doesn't exist, use original
  }
  const fileName = path.basename(uploadPath);

  const configJson = JSON.stringify({
    type: "transcription",
    transcription_config: {
      language: "en",
      operating_point: "enhanced",
      enable_entities: true,
    },
  });

  // Use curl for reliable multipart upload — Node FormData + Blob is unreliable for file uploads
  const { stdout } = await execAsync(
    `curl -s -X POST "${SPEECHMATICS_API_URL}/jobs/" ` +
    `-H "Authorization: Bearer ${apiKey}" ` +
    `-F 'config=${configJson};type=application/json' ` +
    `-F 'data_file=@${uploadPath};type=audio/wav'`,
    { timeout: 30000 }
  );

  let job: any;
  try {
    job = JSON.parse(stdout);
  } catch {
    throw new Error(`Speechmatics API returned invalid JSON: ${stdout.slice(0, 200)}`);
  }

  if (job.error || job.code) {
    throw new Error(`Speechmatics API error: ${job.message || job.error || JSON.stringify(job)}`);
  }

  const jobId = job.id;
  if (!jobId) {
    throw new Error(`Speechmatics returned no job ID: ${JSON.stringify(job)}`);
  }

  console.log(`Speechmatics job created: ${jobId}`);

  // Poll for completion
  let result: any = null;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const { stdout: statusOut } = await execAsync(
        `curl -s "${SPEECHMATICS_API_URL}/jobs/${jobId}" -H "Authorization: Bearer ${apiKey}"`,
        { timeout: 10000 }
      );
      const statusData = JSON.parse(statusOut);

      if (statusData.job?.status === "done") {
        const { stdout: transcriptOut } = await execAsync(
          `curl -s "${SPEECHMATICS_API_URL}/jobs/${jobId}/transcript?format=json-v2" -H "Authorization: Bearer ${apiKey}"`,
          { timeout: 10000 }
        );
        result = JSON.parse(transcriptOut);
        break;
      } else if (statusData.job?.status === "rejected") {
        throw new Error(`Speechmatics job rejected: ${statusData.job.errors?.[0]?.message || "unknown"}`);
      }
    } catch (err: any) {
      if (err.message?.includes("rejected")) throw err;
      // keep polling on transient errors
    }
  }

  if (!result) {
    throw new Error("Speechmatics transcription timed out");
  }

  // Clean up temp wav
  fs.unlink(wavPath).catch(() => {});

  // Extract transcript
  const words = result.results
    ?.filter((r: any) => r.type === "word")
    .map((r: any) => ({
      content: r.alternatives?.[0]?.content || "",
      start_time: r.start_time || 0,
      end_time: r.end_time || 0,
    })) || [];

  const transcript = words.map((w: any) => w.content).join(" ");
  const avgConfidence =
    result.results
      ?.filter((r: any) => r.type === "word")
      .reduce((sum: number, r: any) => sum + (r.alternatives?.[0]?.confidence || 0), 0) /
    (words.length || 1);

  return { transcript, confidence: avgConfidence, words };
}
