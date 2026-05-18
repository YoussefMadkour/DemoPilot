---
name: DemoPilot Product Idea
description: Autonomous demo video agent — Playwright + edge-tts + ffmpeg. Generate narrated product demos from any web app URL + script. Future hackathon/product idea.
type: project
---

## DemoPilot — Autonomous Demo Video Agent

**Concept:** Give it a URL + a script → it drives the browser, generates voiceover, and outputs a production-ready narrated demo video. No screen recording software, no editing, no retakes.

**Origin:** Built during Meridian hackathon (May 2026) to auto-generate a 4-minute demo video. The pipeline worked: Playwright recordVideo + edge-tts (Microsoft Neural voices) + ffmpeg composition. Proved the concept end-to-end.

**Why it matters:**
- Every SaaS company needs demo videos. Currently: manual screen recording (OBS/Loom), re-recording on mistakes, manual editing, hiring voiceover artists or sounding robotic
- Average demo video takes 2-4 hours to produce. DemoPilot does it in ~5 minutes
- Deterministic — same script always produces same result. Easy to iterate: change one line of narration, re-run
- CI/CD integration — auto-generate updated demo videos on every release

**Stack proven in Meridian:**
- Playwright (browser automation + recordVideo)
- edge-tts (Microsoft Azure Neural voices, free, no API key)
- ffmpeg (video composition, title cards, audio sync)
- Node.js orchestrator

**For hackathon deployment:**
- Vultr VM backend (headless Playwright + ffmpeg)
- Web UI: paste URL, write script segments, pick voice, click Generate
- Gemini for auto-generating the script from just a URL (crawl the app, understand flows, write narration)
- Output: downloadable MP4

**Tracks it fits:** Agentic Workflows, Enterprise Utility
**Tech partners:** Vultr (deployment), Gemini (script generation), possibly Speechmatics (voice cloning)
