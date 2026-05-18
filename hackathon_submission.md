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

DemoPilot reduces demo video production from hours to ~60 seconds. It's built for hackathon teams, SaaS companies, and developer advocates who need professional demos without professional video editors. Both showcase videos on our landing page (AgentShield & Meridian) were generated entirely by DemoPilot — from URL to finished MP4, untouched by human hands.

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
