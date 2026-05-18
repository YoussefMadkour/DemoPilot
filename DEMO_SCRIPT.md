# DemoPilot — Demo & Presentation Script

> **Total time target:** 5-7 minutes (slides + live demo)
> **Live app:** https://representative-celebrity-locator-greene.trycloudflare.com (HTTPS)
> **Stable HTTP:** http://45.76.17.96

---

## SLIDE 1 — Title (30s)

**[Show: Title slide — "DEMOPILOT / Autonomous Demo Video Agent"]**

> "Hey everyone — I'm Youssef, and this is **DemoPilot**.
>
> The pitch is simple: **URL in, demo video out.** You give it any web app URL, and in about 60 seconds you get back a production-ready, narrated MP4 — fully autonomous, zero human editing."

---

## SLIDE 2 — The Problem (45s)

**[Show: Problem slide with stats — 2-4 hrs, 3-5x retakes, $500+, 0 min left]**

> "So why does this matter? Every software team needs demo videos — for investors, hackathon judges, product launches, onboarding. But today, making a 3-minute demo takes **2 to 4 hours**. You're screen-recording in OBS or Loom, re-recording 3 to 5 times per final version, editing in timeline software, and either paying $500+ for a voiceover artist or settling for robotic TTS.
>
> And every time your UI changes? You re-record everything from scratch. At hackathon deadlines, there's literally zero time left for demos."

---

## SLIDE 3 — Our Approach / Pipeline (45s)

**[Show: 5-step pipeline — Paste URL -> AI Script -> Record -> Narrate -> Compose]**

> "DemoPilot solves this with a **5-step autonomous pipeline**:
>
> 1. **Paste a URL** — any web application
> 2. **Gemini analyzes** the screenshot and page structure — nav links, buttons, forms — and writes a narrated demo script with real CSS selectors
> 3. **Playwright records** a headless Chromium browser at 1920x1080 with gold highlight glows on clicks and smooth scrolling
> 4. **edge-tts narrates** with Microsoft Azure neural voices — 10+ options
> 5. **ffmpeg composes** the final H.264 MP4 with synchronized audio
>
> Total time: about 60 seconds. And it's **deterministic** — same script always produces the same video. That means it's CI/CD ready."

---

## SLIDE 4 — The Solution / Features (45s)

**[Show: 6 feature cards grid]**

> "But it's not just automation — it's **intelligent**.
>
> - **AI Script Generation:** Gemini sees your actual screenshot plus page structure and writes a script with real CSS selectors and natural narration — not generic filler.
> - **Voice-to-Script:** Speak your demo intent into the mic. Speechmatics transcribes, Gemini converts to structured script. No typing.
> - **Natural Demo Feel:** Gold highlight glows on clicks, smooth quadratic scrolling, character-by-character typing — looks like a human driving the browser.
> - **AI Video QA:** Gemini vision reviews 6 frames from the final video, scores quality 1-10, flags issues.
> - **Cookie Consent Handling:** 80+ CMP selectors auto-dismiss consent banners before recording.
> - **Full Manual Override:** Edit every segment, narration line, and browser action before rendering."

---

## SLIDE 5 — Live Product (30s)

**[Show: 4 screenshots — Landing hero, URL input, Pipeline, Showcase]**

> "Here's what the product looks like. The landing page shows the pipeline and our showcase demos. The app itself is a 4-step wizard — paste URL, generate script, edit, and render. Clean, minimal UI."

---

## SLIDE 6 — Architecture (20s)

**[Show: System architecture diagram]**

> "Under the hood — the frontend talks to an Express.js API that orchestrates Gemini for scripting, Playwright for recording, edge-tts for narration, and ffmpeg for final composition. All running on a Vultr VM with headless Chromium."

---

## SLIDE 7 — Impact (30s)

**[Show: Before vs After comparison — 7 rows]**

> "The impact is clear. Before: 2-4 hours, 5+ tools, 3-5 retakes, $500+ voiceover, stale on update, no CI/CD, inconsistent quality. After DemoPilot: **60 seconds, 1 tool, 0 retakes, $0, auto-update, CI/CD ready, consistent quality every time.** That's 240x faster."

---

## SLIDE 8 — Technology (30s)

**[Show: 6 technology partner cards]**

> "Built on hackathon partner technologies:
>
> - **Google Gemini 2.5 Flash** — script intelligence, screenshot analysis, video QA
> - **Vultr Cloud** — headless Chromium + ffmpeg deployment
> - **Speechmatics** — voice-to-text transcription with word-level timestamps
> - Plus **Playwright**, **edge-tts**, and **ffmpeg** for recording, narration, and composition.
>
> Frontend is React 19 + Vite, backend is Express.js + TypeScript."

---

## SLIDE 9 — Hackathon Fit (30s)

**[Show: Agentic Workflows + Enterprise Utility cards]**

> "For **Agentic Workflows**: DemoPilot is a multi-step autonomous agent — analyze, script, record, narrate, compose, QA. Each step uses AI decision-making. No human in the loop.
>
> For **Enterprise Utility**: Every SaaS company needs demo videos. We replace a $500+ manual process with a 60-second pipeline. Deterministic output integrates into CI/CD."

---

## SLIDE 10 — Proof of Concept (30s)

**[Show: AgentShield + Meridian demo video cards]**

> "Proof it works — both showcase videos were generated **entirely by DemoPilot**. URL to MP4, zero human editing.
>
> - **AgentShield** — 5:15 min walkthrough of an AI security dashboard
> - **Meridian** — 3:33 min workflow and analytics walkthrough
>
> Real demos of real apps, generated autonomously."

---

## SLIDE 11 — Try It Live (transition to live demo)

**[Show: TRY IT LIVE slide with URLs]**

> "And it's deployed right now. Let me show you."

### LIVE DEMO (2-3 min)

1. **Open the app**
   - Navigate to: `https://representative-celebrity-locator-greene.trycloudflare.com`
   - Show the landing page — hero section, pipeline visualization, showcase videos
   - *"This is our landing page — pipeline steps and the AI-generated showcase demos."*

2. **Click "Start Creating"**
   - *"Let's create a demo right now."*

3. **Step 1 — URL**
   - Paste a target URL (e.g., `https://news.ycombinator.com` or another site)
   - Optionally add context: "Focus on the top stories and navigation"
   - Click the camera icon to capture a screenshot
   - *"I paste any web app URL. The camera captures a screenshot for Gemini."*

4. **Step 2 — Script**
   - Click **"Generate Script with AI"**
   - Wait ~10s for Gemini to analyze and generate
   - Show segments with narration and action counts
   - *"Gemini analyzed the screenshot and wrote a full demo script — narration, click targets, scroll actions, real CSS selectors."*

5. **Step 3 — Edit**
   - Show the script editor, expand one segment
   - Pick a narrator voice, hit preview
   - *"You can edit every segment, pick from 10+ neural voices. The AI script is usually good to go."*

6. **Step 4 — Render**
   - Click **"Generate Demo Video"**
   - Watch pipeline stages: Voiceover -> Recording -> Composing
   - *"Watch the pipeline — voiceover first, then Playwright records the browser, then ffmpeg composes the MP4."*

7. **Download**
   - Show QA score, click download
   - *"Done. Production-ready MP4, narrated, about 60 seconds total."*

### Backup Plan:
If live demo has issues (tunnel down, slow network):
- Play the pre-generated AgentShield or Meridian demo from the landing page
- Walk through UI screenshots in `/docs/`
- *"Here's a demo we generated earlier — actual output, completely untouched."*

---

## SLIDE 12 — Closing (15s)

**[Show: Closing slide — centered "DEMOPILOT / URL in. Demo video out."]**

> "**DemoPilot. URL in. Demo video out.** ~60 seconds, zero human editing, 10+ neural voices, CI/CD ready.
>
> Built for AI Agent Olympics 2026. Thank you."

---

## Quick Reference

| Item | Value |
|------|-------|
| **Live HTTPS URL** | https://representative-celebrity-locator-greene.trycloudflare.com |
| **Stable HTTP URL** | http://45.76.17.96 |
| **Server IP** | 45.76.17.96 |
| **Get current URL** | `ssh root@45.76.17.96 'journalctl -u cloudflared --no-pager -n 20 \| grep trycloudflare'` |
| **Note** | HTTPS URL changes on server restart (free Cloudflare tunnel) |
| **SSL** | Valid cert, mic access works, no browser warnings |
| **Good demo targets** | `https://news.ycombinator.com`, `https://github.com/trending`, any SaaS landing page |
