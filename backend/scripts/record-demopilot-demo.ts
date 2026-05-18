/**
 * Records a demo of DemoPilot itself in action.
 * Shows: Landing page → Enter URL → Generate Script → Edit → Render
 *
 * Run: cd backend && npx tsx scripts/record-demopilot-demo.ts
 * Requires: DemoPilot frontend running on localhost:5173
 */

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "output", "demopilot-self-demo");

const DEMO_URL = "https://www.anthropic.com"; // The site we'll demo DemoPilot against

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function smoothType(page: any, selector: string, text: string) {
  await page.locator(selector).click();
  await sleep(300);
  for (const char of text) {
    await page.keyboard.type(char, { delay: 40 });
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    slowMo: 80,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  console.log("1. Opening DemoPilot landing page...");
  await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
  await sleep(3000);

  // Scroll through landing page
  console.log("2. Scrolling landing page...");
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 350);
    await sleep(800);
  }
  await sleep(1500);

  // Click "Start Creating" or "Launch App"
  console.log("3. Clicking Launch App...");
  try {
    const launchBtn = page.getByText("Start Creating").or(page.getByText("Launch App")).first();
    await launchBtn.scrollIntoViewIfNeeded();
    await sleep(500);
    await launchBtn.click();
    await sleep(2000);
  } catch {
    // Try nav button
    await page.getByText("Launch App").first().click();
    await sleep(2000);
  }

  // STEP 1: Enter URL
  console.log("4. Entering URL...");
  await sleep(1000);
  const urlInput = page.locator('input[type="url"]').first();
  await urlInput.click();
  await sleep(300);
  await urlInput.fill("");
  for (const char of DEMO_URL) {
    await page.keyboard.type(char, { delay: 30 });
  }
  await sleep(1500);

  // Click screenshot button
  console.log("5. Capturing screenshot...");
  try {
    // The camera button
    const screenshotBtn = page.locator('button[title*="screenshot"], button[title*="Preview"]').first();
    await screenshotBtn.click();
    await sleep(8000); // wait for screenshot to load
  } catch {
    console.log("  Screenshot button not found, skipping");
  }

  // Click Continue to Step 2
  console.log("6. Continuing to Script step...");
  const continueBtn = page.getByText("Continue").first();
  await continueBtn.click();
  await sleep(2000);

  // STEP 2: Generate Script
  console.log("7. Generating script with AI...");
  const generateScriptBtn = page.getByText("Generate Script with AI").first();
  await generateScriptBtn.scrollIntoViewIfNeeded();
  await sleep(500);
  await generateScriptBtn.click();

  // Wait for script generation (can take 15-30s)
  console.log("  Waiting for Gemini to generate script...");
  await sleep(30000);

  // Scroll down to see generated script
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 300);
    await sleep(600);
  }
  await sleep(2000);

  // Click Continue to Edit step
  console.log("8. Continuing to Edit step...");
  try {
    await page.getByText("Continue").first().click();
    await sleep(2000);
  } catch {
    console.log("  Continue not found, trying to proceed...");
  }

  // STEP 3: Edit — scroll through segments
  console.log("9. Browsing Edit step...");
  await sleep(1500);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 300);
    await sleep(800);
  }
  await sleep(2000);

  // Click Continue to Render step
  console.log("10. Continuing to Render step...");
  try {
    await page.getByText("Continue").first().click();
    await sleep(2000);
  } catch {
    console.log("  Continue not found");
  }

  // STEP 4: Render — click Generate
  console.log("11. Starting video generation...");
  await sleep(1500);
  try {
    const renderBtn = page.getByText("Generate Demo Video").first();
    await renderBtn.scrollIntoViewIfNeeded();
    await sleep(500);
    await renderBtn.click();
  } catch {
    console.log("  Generate button not found");
  }

  // Wait for generation progress (show the pipeline stages)
  console.log("  Watching pipeline progress...");
  await sleep(5000);
  // Scroll to see progress
  await page.mouse.wheel(0, 200);
  await sleep(60000); // Wait up to 60s for generation

  // Final scroll to see result
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 200);
    await sleep(600);
  }
  await sleep(5000);

  // Close page to finalize video
  console.log("12. Finalizing recording...");
  await page.close();
  const video = page.video();
  if (video) {
    const videoPath = path.join(OUTPUT_DIR, "demopilot-in-action.webm");
    await video.saveAs(videoPath);
    console.log(`Video saved: ${videoPath}`);

    // Convert to MP4
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    const mp4Path = path.join(OUTPUT_DIR, "DemoPilot_In_Action.mp4");
    await execAsync(`ffmpeg -y -i "${videoPath}" -c:v libx264 -preset medium -crf 18 -r 30 -pix_fmt yuv420p "${mp4Path}"`, { timeout: 120000 });
    console.log(`MP4 saved: ${mp4Path}`);

    // Copy to Desktop
    const desktopPath = "/Users/youssefmadkour/Desktop/DemoPilot_In_Action.mp4";
    await execAsync(`cp "${mp4Path}" "${desktopPath}"`);
    console.log(`Copied to: ${desktopPath}`);
  }

  await context.close();
  await browser.close();
  console.log("DONE!");
}

main().catch(console.error);
