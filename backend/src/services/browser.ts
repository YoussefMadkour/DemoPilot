import { chromium, type Browser, type Page, type BrowserContext } from "playwright";
import path from "path";
import fs from "fs/promises";
import { dismissConsentPopups } from "./consent.js";
import type { ScriptSegment, ScriptAction, AudioSegment } from "../types.js";

interface RecordingOptions {
  url: string;
  segments: ScriptSegment[];
  audioSegments: AudioSegment[];
  outputDir: string;
  resolution: { width: number; height: number };
  onProgress?: (segment: number, total: number) => void;
}

interface RecordingResult {
  videoPath: string;
  segmentTimings: { start: number; end: number }[];
}

export async function recordDemo(opts: RecordingOptions): Promise<RecordingResult> {
  const { url, segments, audioSegments, outputDir, resolution, onProgress } = opts;
  const videoDir = path.join(outputDir, "video");
  await fs.mkdir(videoDir, { recursive: true });

  const W = resolution.width;
  const H = resolution.height;

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      slowMo: 50, // slight delay between actions — natural but not sluggish
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        `--window-size=${W},${H}`,
      ],
    });

    // KEY: viewport and recordVideo.size MUST match exactly to avoid cropping
    const context: BrowserContext = await browser.newContext({
      viewport: { width: W, height: H },
      deviceScaleFactor: 2, // retina-quality recording
      recordVideo: {
        dir: videoDir,
        size: { width: W, height: H },
      },
      permissions: [],
      colorScheme: "light", // most websites look better in light mode for demos
    });

    const page: Page = await context.newPage();

    // Navigate to start URL
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);

    // Handle cookie consent — try multiple times (banners can load late)
    await dismissConsentPopups(page);
    await page.waitForTimeout(1000);
    await dismissConsentPopups(page);
    await page.waitForTimeout(500);

    // Inject visual cursor for the demo
    await injectCursor(page);

    const segmentTimings: { start: number; end: number }[] = [];
    const recordingStart = Date.now();

    for (let i = 0; i < segments.length; i++) {
      onProgress?.(i + 1, segments.length);
      const segment = segments[i];
      const audioDuration = audioSegments[i]?.duration ?? 3;

      const segStart = (Date.now() - recordingStart) / 1000;

      // Execute actions for this segment
      for (const action of segment.actions) {
        await executeAction(page, action);
      }

      // Wait for the full narration duration so video matches audio
      const actionTime = (Date.now() - recordingStart) / 1000 - segStart;
      const remainingWait = Math.max(0, audioDuration - actionTime + 1.0);
      await page.waitForTimeout(remainingWait * 1000);

      const segEnd = (Date.now() - recordingStart) / 1000;
      segmentTimings.push({ start: segStart, end: segEnd });
    }

    // Tail pause
    await page.waitForTimeout(2000);

    await context.close();

    const files = await fs.readdir(videoDir);
    const videoFile = files.find((f) => f.endsWith(".webm"));
    if (!videoFile) throw new Error("No video file recorded");

    return { videoPath: path.join(videoDir, videoFile), segmentTimings };
  } finally {
    if (browser) await browser.close();
  }
}

// ─── Inject visual cursor into page ───
async function injectCursor(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (document.getElementById("demopilot-cursor")) return;
    const cursor = document.createElement("div");
    cursor.id = "demopilot-cursor";
    cursor.style.cssText = `
      position: fixed; width: 24px; height: 24px; border-radius: 50%;
      background: rgba(99, 102, 241, 0.4); border: 2px solid rgba(99, 102, 241, 0.8);
      pointer-events: none; z-index: 999999; transition: all 0.15s ease-out;
      transform: translate(-50%, -50%); display: none;
    `;
    document.body.appendChild(cursor);

    // Click ripple element
    const ripple = document.createElement("div");
    ripple.id = "demopilot-ripple";
    ripple.style.cssText = `
      position: fixed; width: 40px; height: 40px; border-radius: 50%;
      border: 2px solid rgba(212, 168, 83, 0.8); pointer-events: none;
      z-index: 999998; transform: translate(-50%, -50%) scale(0);
      display: none; transition: none;
    `;
    document.body.appendChild(ripple);
  });
}

async function moveCursorTo(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(({ x, y }) => {
    const cursor = document.getElementById("demopilot-cursor");
    if (cursor) {
      cursor.style.display = "block";
      cursor.style.left = x + "px";
      cursor.style.top = y + "px";
    }
  }, { x, y });
}

async function showClickRipple(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(({ x, y }) => {
    const ripple = document.getElementById("demopilot-ripple");
    if (ripple) {
      ripple.style.display = "block";
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";
      ripple.style.transition = "none";
      ripple.style.transform = "translate(-50%, -50%) scale(0)";
      ripple.style.opacity = "1";
      // Trigger reflow
      ripple.offsetHeight;
      ripple.style.transition = "all 0.5s ease-out";
      ripple.style.transform = "translate(-50%, -50%) scale(1.5)";
      ripple.style.opacity = "0";
    }
  }, { x, y });
}

// ─── Gold highlight glow before clicking ───
// Injects inline CSS glow on element for 800ms, then clicks
async function highlightAndClick(page: Page, selector: string): Promise<boolean> {
  try {
    // Try Playwright locator first
    let el = page.locator(selector).first();

    // If selector uses :has-text(), also try getByText as fallback
    const textMatch = selector.match(/:has-text\(["'](.+?)["']\)/);

    try {
      await el.waitFor({ state: "visible", timeout: 3000 });
    } catch {
      // Selector didn't match — try text-based fallback
      if (textMatch) {
        const linkText = textMatch[1];
        console.log(`  Selector "${selector}" not found, trying getByRole("link", { name: "${linkText}" })`);
        el = page.getByRole("link", { name: linkText }).first();
        try {
          await el.waitFor({ state: "visible", timeout: 3000 });
        } catch {
          el = page.getByText(linkText, { exact: false }).first();
          await el.waitFor({ state: "visible", timeout: 2000 });
        }
      } else {
        throw new Error(`Selector not visible: ${selector}`);
      }
    }

    // Move cursor to element
    const box = await el.boundingBox();
    if (box) {
      await moveCursorTo(page, box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);
    }

    // Scroll element into view first
    await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(300);

    // Gold highlight glow
    await el.evaluate((node) => {
      (node as HTMLElement).style.transition = "all 0.3s ease";
      (node as HTMLElement).style.boxShadow = "0 0 0 4px rgba(212,168,83,0.6), 0 0 20px rgba(212,168,83,0.3)";
      (node as HTMLElement).style.transform = "scale(1.02)";
      setTimeout(() => {
        (node as HTMLElement).style.boxShadow = "";
        (node as HTMLElement).style.transform = "";
        (node as HTMLElement).style.transition = "";
      }, 600);
    });

    await page.waitForTimeout(600);

    if (box) {
      await showClickRipple(page, box.x + box.width / 2, box.y + box.height / 2);
    }

    try {
      await el.click({ timeout: 3000 });
    } catch {
      // Force click as fallback (bypasses visibility/overlay checks)
      await el.click({ force: true, timeout: 3000 });
    }
    console.log(`  Clicked: ${selector}`);
    await page.waitForTimeout(2000); // wait for navigation/page load
    return true;
  } catch (err: any) {
    console.warn(`  Click FAILED: ${selector} — ${err.message?.slice(0, 80)}`);
    return false;
  }
}

// ─── Smooth scroll using mouse.wheel (Playwright native, visible in video) ───
async function smoothScroll(page: Page, totalDistance: number): Promise<void> {
  // Use mouse.wheel for smooth, visible scrolling (per Playwright docs)
  const steps = 15;
  const stepSize = totalDistance / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, stepSize);
    await page.waitForTimeout(60); // 60ms between wheel events = smooth motion
  }
  await page.waitForTimeout(400); // settle
}

async function executeAction(page: Page, action: ScriptAction): Promise<void> {
  const detail = action.selector || action.url || action.direction || `${action.duration}ms`;
  console.log(`  Action: ${action.type} ${detail}`);

  switch (action.type) {
    case "navigate":
      if (action.url) {
        await page.goto(action.url, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(2500);
        await dismissConsentPopups(page);
      }
      break;

    case "click":
      if (action.selector) {
        // Try multiple selectors (comma-separated)
        const selectors = action.selector.split(",").map((s) => s.trim());
        let clicked = false;
        for (const sel of selectors) {
          if (await highlightAndClick(page, sel)) {
            clicked = true;
            break;
          }
        }
        if (!clicked) {
          // Fallback: just wait so the video doesn't stall
          await page.waitForTimeout(1000);
        }
      }
      break;

    case "type":
      if (action.selector && action.value) {
        try {
          const el = page.locator(action.selector).first();
          await el.waitFor({ state: "visible", timeout: 5000 });
          await el.click({ timeout: 3000 });
          await page.waitForTimeout(300);
          // Type character by character for visible typing effect
          await el.pressSequentially(action.value, { delay: 60 });
          await page.waitForTimeout(800);
        } catch {
          await page.waitForTimeout(500);
        }
      }
      break;

    case "scroll": {
      const pixels = action.pixels ?? 400;
      const distance = action.direction === "up" ? -pixels : pixels;
      await smoothScroll(page, distance);
      break;
    }

    case "wait":
      await page.waitForTimeout(action.duration ?? 2000);
      break;

    case "hover":
      if (action.selector) {
        try {
          const el = page.locator(action.selector).first();
          await el.waitFor({ state: "visible", timeout: 5000 });
          const box = await el.boundingBox();
          if (box) {
            await moveCursorTo(page, box.x + box.width / 2, box.y + box.height / 2);
          }
          await el.hover({ timeout: 3000 });
          await page.waitForTimeout(800);
        } catch {
          await page.waitForTimeout(400);
        }
      }
      break;

    case "screenshot":
      await page.waitForTimeout(action.duration ?? 2000);
      break;
  }
}
