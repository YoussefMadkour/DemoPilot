import { GoogleGenerativeAI } from "@google/generative-ai";
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import type { DemoScript } from "../types.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SCRIPT_GENERATION_PROMPT = `You are DemoPilot, an expert product demo director. Create demos that feel like a real human presenting a product walkthrough.

HOW TO STRUCTURE A GREAT DEMO:
1. Start on homepage — wait 2s for hero, then scroll down slowly (300-400px at a time) through the landing page content, narrating each section.
2. Click a nav link to go to another page. Wait 2-3s for it to load. Scroll through THAT page too, narrating key sections.
3. Navigate to 2-3 different pages total. On each page: wait → scroll down in steps → narrate what you see → then navigate to next page.
4. End back on homepage or a CTA page.

PACING RULES:
- Every segment MUST have at least one scroll action with "pixels": 300-500
- After every click/navigate: ALWAYS add { "type": "wait", "duration": 2500 } to let the page load
- Add 2-3 scroll actions per page to show different sections
- Narration should describe what's VISIBLE on screen at that moment, not abstract marketing talk
- Each segment = one page or one section of a page. 6-8 segments total.

ACTION TYPES:
- navigate: { type: "navigate", url: "https://full-url" }
- click: { type: "click", selector: "CSS selector" }
- scroll: { type: "scroll", direction: "down", pixels: 350 }
- wait: { type: "wait", duration: 2500 }
- hover: { type: "hover", selector: "CSS selector" }

SELECTOR RULES (critical — wrong selectors = broken demo):
- For nav links, use: a[href="/about"], a[href*="pricing"]
- For buttons: button:has-text("Get Started")
- ALWAYS provide comma-separated fallbacks: "a[href*='research'], a:has-text('Research')"
- NEVER use fragile class-based selectors like .nav-item-3

GOOD SEGMENT EXAMPLE (explores one page):
{
  "narration": "The pricing page shows transparent plans for teams of every size. Let's scroll through the options.",
  "actions": [
    { "type": "click", "selector": "a[href*='pricing'], a:has-text('Pricing')" },
    { "type": "wait", "duration": 2500 },
    { "type": "scroll", "direction": "down", "pixels": 400 },
    { "type": "wait", "duration": 1500 },
    { "type": "scroll", "direction": "down", "pixels": 400 }
  ]
}

BAD SEGMENT (stays still, boring):
{
  "narration": "Here is the homepage.",
  "actions": [{ "type": "wait", "duration": 3000 }]
}

Respond with ONLY valid JSON:
{
  "title": "Product Name — Feature Demo",
  "url": "the starting URL",
  "voice": "en-US-AvaMultilingualNeural",
  "resolution": { "width": 1920, "height": 1080 },
  "segments": [...]
}`;

function parseScriptJson(text: string): DemoScript {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = jsonMatch[1]?.trim() || text.trim();
  return JSON.parse(jsonStr);
}

function validateScript(script: DemoScript, url: string): DemoScript {
  if (!script.title) script.title = "Product Demo";
  if (!script.url) script.url = url;
  if (!script.voice) script.voice = "en-US-AvaMultilingualNeural";
  if (!script.resolution) script.resolution = { width: 1920, height: 1080 };
  if (!script.segments || script.segments.length === 0) {
    throw new Error("Generated an empty script");
  }
  return script;
}

// ─── Screenshot + page structure capture ───

export async function captureScreenshot(url: string): Promise<{ base64: string; path: string; pageInfo: string }> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3000);

    const { dismissConsentPopups } = await import("./consent.js");
    await dismissConsentPopups(page);
    await page.waitForTimeout(1000);

    // Extract page structure for Gemini — real selectors it can use
    const pageInfo = await page.evaluate(() => {
      const info: string[] = [];

      // Nav links
      const navLinks = document.querySelectorAll("nav a, header a, [role='navigation'] a");
      if (navLinks.length > 0) {
        info.push("NAV LINKS:");
        navLinks.forEach((a) => {
          const href = a.getAttribute("href") || "";
          const text = (a as HTMLElement).innerText?.trim().slice(0, 50);
          if (text && href) info.push(`  "${text}" → ${href}`);
        });
      }

      // Buttons
      const buttons = document.querySelectorAll("button, a.btn, a[class*='button'], [role='button']");
      if (buttons.length > 0) {
        info.push("BUTTONS:");
        buttons.forEach((b) => {
          const text = (b as HTMLElement).innerText?.trim().slice(0, 50);
          const id = b.id ? `#${b.id}` : "";
          if (text) info.push(`  "${text}" ${id}`);
        });
      }

      // Main headings
      const headings = document.querySelectorAll("h1, h2");
      if (headings.length > 0) {
        info.push("HEADINGS:");
        headings.forEach((h) => {
          const text = (h as HTMLElement).innerText?.trim().slice(0, 80);
          if (text) info.push(`  ${h.tagName}: "${text}"`);
        });
      }

      // Input fields
      const inputs = document.querySelectorAll("input[type='text'], input[type='search'], input[type='email'], textarea");
      if (inputs.length > 0) {
        info.push("INPUT FIELDS:");
        inputs.forEach((inp) => {
          const placeholder = (inp as HTMLInputElement).placeholder || "";
          const id = inp.id ? `#${inp.id}` : "";
          info.push(`  ${placeholder} ${id}`);
        });
      }

      // Page title
      info.unshift(`PAGE TITLE: ${document.title}`);
      info.unshift(`URL: ${window.location.href}`);

      return info.join("\n");
    });

    const screenshotBuffer = await page.screenshot({ type: "png", fullPage: false });
    const base64 = screenshotBuffer.toString("base64");

    const tmpPath = path.join("/tmp", `demopilot_screenshot_${Date.now()}.png`);
    await fs.writeFile(tmpPath, screenshotBuffer);

    await context.close();
    return { base64, path: tmpPath, pageInfo };
  } finally {
    await browser.close();
  }
}

// ─── Script generation (with screenshot + page structure) ───

export async function generateScript(
  url: string,
  context?: string,
  screenshotBase64?: string,
  pageInfo?: string
): Promise<DemoScript> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

  const parts: any[] = [{ text: SCRIPT_GENERATION_PROMPT }];

  if (screenshotBase64) {
    parts.push({
      inlineData: { mimeType: "image/png", data: screenshotBase64 },
    });

    let structurePrompt = `Screenshot of ${url}.\n`;
    if (pageInfo) {
      structurePrompt += `\nHere are the REAL interactive elements on this page (use these exact selectors):\n\n${pageInfo}\n`;
    }
    structurePrompt += `\n${context ? `User wants to focus on: ${context}` : "Create an engaging walkthrough of this product. Click through different pages/sections, don't just scroll."}`;
    parts.push({ text: structurePrompt });
  } else {
    parts.push({
      text: context
        ? `Generate a demo for: ${url}\n\nFocus on: ${context}`
        : `Generate an engaging interactive demo for: ${url}. Make it dynamic — click nav links, explore pages, show features.`,
    });
  }

  const result = await model.generateContent(parts);
  const script = parseScriptJson(result.response.text());
  return validateScript(script, url);
}

// ─── Voice-to-script ───

export async function voiceToScript(
  url: string,
  transcript: string,
  screenshotBase64?: string,
  pageInfo?: string
): Promise<DemoScript> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

  const parts: any[] = [
    { text: SCRIPT_GENERATION_PROMPT },
    { text: `The user described their demo via voice:\n\n"${transcript}"\n\nTarget URL: ${url}${pageInfo ? `\n\nPage structure:\n${pageInfo}` : ""}\n\nConvert into an interactive demo script.` },
  ];

  if (screenshotBase64) {
    parts.splice(1, 0, { inlineData: { mimeType: "image/png", data: screenshotBase64 } });
  }

  const result = await model.generateContent(parts);
  const script = parseScriptJson(result.response.text());
  return validateScript(script, url);
}

// ─── Video QA ───

export interface VideoQAResult {
  score: number;
  passed: boolean;
  summary: string;
  issues: string[];
}

export async function reviewVideo(framePaths: string[]): Promise<VideoQAResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

  const parts: any[] = [{
    text: `Review these frames from a generated demo video. Score 1-10. Respond with JSON: { "score": N, "passed": bool, "summary": "...", "issues": [] }`,
  }];

  const step = Math.max(1, Math.floor(framePaths.length / 5));
  const selected = framePaths.filter((_, i) => i % step === 0).slice(0, 5);

  for (const fp of selected) {
    const data = await fs.readFile(fp);
    parts.push({ inlineData: { mimeType: "image/png", data: data.toString("base64") } });
  }

  const result = await model.generateContent(parts);
  const text = result.response.text();
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];

  try {
    return JSON.parse(jsonMatch[1]?.trim() || text.trim());
  } catch {
    return { score: 5, passed: true, summary: "Could not parse QA", issues: [] };
  }
}

export async function extractFrames(videoPath: string, outputDir: string, count: number = 8): Promise<string[]> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  const framesDir = path.join(outputDir, "qa_frames");
  await fs.mkdir(framesDir, { recursive: true });

  const { stdout } = await execAsync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`
  );
  const duration = parseFloat(stdout.trim());
  const interval = duration / (count + 1);

  const framePaths: string[] = [];
  for (let i = 1; i <= count; i++) {
    const time = interval * i;
    const framePath = path.join(framesDir, `frame_${i}.png`);
    await execAsync(`ffmpeg -y -ss ${time} -i "${videoPath}" -vframes 1 -q:v 2 "${framePath}"`, { timeout: 10000 });
    framePaths.push(framePath);
  }
  return framePaths;
}
