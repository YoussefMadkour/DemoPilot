import { GoogleGenerativeAI } from "@google/generative-ai";
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import type { DemoScript } from "../types.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SCRIPT_GENERATION_PROMPT = `You are DemoPilot, an expert product demo director. You create engaging, dynamic browser demo scripts that feel like a real human is giving a live product walkthrough.

CRITICAL RULES FOR GREAT DEMOS:
1. NEVER just scroll up and down — that's boring. Real demos CLICK things, HOVER over menus, NAVIGATE between pages.
2. Start with a "hero moment" — show the most impressive feature within the first 15 seconds.
3. Each segment should show a DIFFERENT part of the product (don't stay on one page).
4. Use click and navigate actions to explore the app like a real user would.
5. Mix action types: click a nav link, wait to let it load, hover over a feature, scroll to show content, click another link.
6. Narration should tell a STORY — "Imagine you're a manager who needs to..." not just "Here we see a button."
7. Keep narration punchy: 1-2 sentences per segment max.
8. If you have a screenshot, identify ACTUAL clickable elements (nav links, buttons, cards) and use them.

Available action types:
- navigate: Go to a URL { type: "navigate", url: "https://..." }
- click: Click an element { type: "click", selector: "CSS selector" }
- type: Type into a field { type: "type", selector: "CSS selector", value: "..." }
- scroll: Scroll the page { type: "scroll", direction: "down", pixels: 400 }
- wait: Pause to let content load/viewer absorb { type: "wait", duration: 2000 }
- hover: Hover to reveal tooltip/dropdown { type: "hover", selector: "CSS selector" }

SELECTOR STRATEGY (in order of preference):
1. Links by href: a[href="/pricing"], a[href*="docs"]
2. Buttons by text: button:has-text("Get Started"), button:has-text("Sign Up")
3. Nav links: nav a, header a, [role="navigation"] a
4. By ID: #pricing, #features
5. By aria-label: [aria-label="Menu"]
6. By visible text: :text("Features"), :text("Pricing")

EXAMPLE of a GOOD segment (interactive):
{
  "narration": "Let's explore the pricing options.",
  "actions": [
    { "type": "click", "selector": "a[href*='pricing'], a:has-text('Pricing'), nav a:has-text('Pricing')" },
    { "type": "wait", "duration": 2000 },
    { "type": "scroll", "direction": "down", "pixels": 300 }
  ]
}

EXAMPLE of a BAD segment (boring):
{
  "narration": "Here we can see the homepage of the product.",
  "actions": [
    { "type": "scroll", "direction": "down", "pixels": 500 },
    { "type": "scroll", "direction": "up", "pixels": 500 }
  ]
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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

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
