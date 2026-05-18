# DemoPilot — Hackathon Submission (lablab.ai)

## Submission Title (50 chars max)
DemoPilot — Autonomous Demo Video Agent

## Short Description (255 chars max)
DemoPilot turns any web app URL into a polished, narrated demo video in ~60 seconds. Gemini analyzes the UI, writes the script, Playwright records the browser, edge-tts narrates, and ffmpeg renders the final MP4 — fully autonomous, zero human editing.

## Long Description (2000 chars max)

### The Problem

Every software team needs demo videos — for investors, hackathon judges, product launches, and onboarding. Today, creating one means: manually screen-recording (OBS, Loom), re-recording on every mistake, editing in timeline software, hiring voiceover artists or settling for robotic TTS. A single 3-minute demo video takes 2–4 hours to produce. For hackathon teams shipping at the last minute, there's simply no time.

### Our Approach

DemoPilot is a fully autonomous AI agent that generates production-ready demo videos from just a URL. The pipeline is end-to-end: no human touches the output.

**5-Step Pipeline:**
1. **Capture** — Playwright navigates to the target URL and captures a screenshot + full page structure (nav links, buttons, headings, form fields)
2. **Script** — Gemini 3 Flash analyzes the screenshot and page elements, then writes a narrated demo script with precise browser actions (click, type, scroll, navigate, hover) using real CSS selectors
3. **Record** — Playwright drives a headless Chromium browser through the scripted actions at 1920x1080, with gold highlight glows on clicks, smooth scrolling, and character-by-character typing for a natural feel
4. **Narrate** — edge-tts generates neural voiceover (Microsoft Azure voices, 10+ options) perfectly timed to each segment
5. **Compose** — ffmpeg merges the recording + narration into a final H.264 MP4

**Key Features:**
- Voice-to-script: Speak your demo intent into a mic, Speechmatics transcribes it, Gemini converts it to a structured script
- AI Quality Assurance: Gemini vision reviews 6 frames from the final video, scoring quality and flagging issues
- Cookie consent auto-dismissal (80+ CMP selectors — OneTrust, Ketch, Cookiebot, etc.)
- Deterministic output: same script always produces the same video — CI/CD friendly
- Full manual override: edit every segment, narration line, and action before rendering

### Technology

- **Google Gemini 3 Flash** — Script intelligence, screenshot analysis, video QA
- **Vultr** — Cloud deployment (headless Chromium + ffmpeg)
- **Speechmatics** — Voice-to-text transcription
- **Playwright** — Browser automation + video recording
- **edge-tts** — Microsoft Neural voice synthesis
- **ffmpeg** — Video composition and encoding
- **React 19 + Vite** — Frontend wizard UI
- **Express.js + TypeScript** — Backend API

### Impact

DemoPilot reduces demo video production from hours to ~60 seconds. It's built for hackathon teams, SaaS companies, and developer advocates who need professional demos without professional video editors. Three exported demos (AgentShield, Meridian, Cognee) in the `demos/` directory were generated entirely by DemoPilot — from URL to finished MP4, untouched by human hands. The live instance is deployed on Vultr with $5 of Gemini credits pre-loaded — try it yourself at http://45.76.17.96.

## Participation Mode
Online

## Categories / Event Tracks
- Agentic Workflows
- Enterprise Utility

## Technologies Used
- Google Gemini
- Vultr
- Speechmatics
- Playwright
- edge-tts
- ffmpeg

---

## Cover Image
- Use `docs/01_landing_hero.png` or a 16:9 screenshot of the landing page
- Alternative: `docs/architecture.png` for a technical cover

## Video Presentation (max 5 min, under 300MB)
- Record a walkthrough of DemoPilot generating a demo video live
- Suggested flow: Landing page → Paste URL → Generate script → Edit → Render → Download MP4
- Existing showcase videos can supplement: `agentshield_demo.mp4` (5:15), `meridian_demo_final.mp4` (3:33)

## GitHub Repository
https://github.com/YoussefMadkour/DemoPilot

## Demo Application Platform
Vultr Cloud (VM with Node.js + Playwright + ffmpeg, Cloudflare Tunnel for HTTPS)

## Demo Application URL
- **HTTPS (recommended):** https://representative-celebrity-locator-greene.trycloudflare.com
- **HTTP (stable):** http://45.76.17.96
- Note: HTTPS URL changes on server restart (free Cloudflare tunnel). To get current URL:
  `ssh root@45.76.17.96 'journalctl -u cloudflared --no-pager -n 20 | grep trycloudflare'`

## Additional Information

### For Judges

**Try It Yourself:** DemoPilot is live and fully functional at **https://representative-celebrity-locator-greene.trycloudflare.com** (HTTPS with valid SSL) or **http://45.76.17.96** (stable HTTP). The instance is pre-loaded with $5 of Gemini API credits, so it will work out of the box — no setup, no keys, no installation. Just open the link, paste any public web app URL, and click "Generate Script with AI." The entire pipeline runs in ~60 seconds and delivers a downloadable MP4.

**Deployed on Vultr:** The entire backend — Node.js, Playwright (headless Chromium), ffmpeg, and edge-tts — runs on a Vultr Cloud VM. Vultr is our central infrastructure: it hosts the API server, executes the browser recording pipeline, stores generated videos, and serves the frontend. Cloudflare Tunnel provides the HTTPS layer on top.

**Proof of Output:** Three demo videos in the `demos/` directory and playable on our landing page were generated entirely by DemoPilot — URL to finished MP4, zero human editing:
- **AgentShield** (5:15 min) — AI security dashboard walkthrough
- **Meridian** (3:33 min) — LC intelligence platform, workflow & analytics
- **Cognee** — Knowledge graph platform walkthrough
These are real outputs from real web apps, not mockups.

**How to Test:**
1. Open the HTTPS URL above
2. Click "Start Creating"
3. Paste any public web app URL (e.g., https://news.ycombinator.com)
4. Click "Generate Script with AI" — Gemini analyzes the page in ~10 seconds
5. Review/edit the script, pick a narrator voice
6. Click "Generate Demo Video" — takes ~60 seconds
7. Download your MP4

**Scalability Beyond Hackathon:**
- **CI/CD integration:** Deterministic output (same script = same video) means DemoPilot can auto-regenerate demo videos on every product release as a pipeline step
- **SaaS model:** Every software company needs demo videos for sales, onboarding, and marketing — this replaces a $500+/video manual process
- **API-first architecture:** The backend exposes a clean REST API that can be consumed by any client, CLI, or automation tool
- **Multi-tenant ready:** Job queue and output isolation are already built in

**Known Limitations:**
- HTTPS URL changes on server restart (free Cloudflare tunnel tier) — stable HTTP fallback always available
- Complex SPAs with heavy client-side rendering may require additional wait times in the script
- Voice-to-script requires microphone permissions (works on HTTPS, not HTTP)

**Technology Highlights:**
- 80+ cookie consent selectors auto-dismiss banners (OneTrust, Ketch, Cookiebot, etc.) before recording
- Gold highlight glows on clicks, smooth quadratic scrolling, character-by-character typing for natural demo feel
- AI QA: Gemini vision extracts 6 frames from the output video and scores quality 1-10
- 10+ Microsoft Azure Neural voices via edge-tts (free, no API key required)
