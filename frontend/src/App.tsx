import { useState, useEffect, useCallback, useRef } from "react";
import { ScriptEditor } from "./components/ScriptEditor";
import { ProgressPanel } from "./components/ProgressPanel";
import { VoiceRecorder } from "./components/VoiceRecorder";
import {
  fetchVoices, generateScript, captureScreenshot,
  voiceToScript, startGeneration, getJobStatus, getDownloadUrl,
} from "./api";
import type { DemoScript, ScriptSegment, Voice, JobStatus } from "./types";

const DEFAULT_SEGMENTS: ScriptSegment[] = [
  {
    narration: "Welcome to our product. Let me walk you through the key features.",
    actions: [{ type: "wait", duration: 2000 }],
  },
];

const STEPS = [
  { key: "url", label: "URL", title: "Set your target", desc: "Enter the web app URL you want to demo and optionally add context for smarter scripts." },
  { key: "script", label: "SCRIPT", title: "Generate your script", desc: "Let AI write the narration and browser actions, or describe the demo with your voice." },
  { key: "edit", label: "EDIT", title: "Refine & configure", desc: "Fine-tune segments, adjust settings, and pick a narrator voice." },
  { key: "render", label: "RENDER", title: "Render your video", desc: "Generate a production-ready MP4 demo video with synchronized narration." },
] as const;

interface AppProps {
  onBack?: () => void;
}

function App({ onBack }: AppProps) {
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("Product Demo");
  const [voice, setVoice] = useState("en-US-AndrewMultilingualNeural");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [segments, setSegments] = useState<ScriptSegment[]>(DEFAULT_SEGMENTS);
  const [context, setContext] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    fetchVoices().then(setVoices).catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const goTo = (s: number) => {
    setStep(s);
    setAnimKey((k) => k + 1);
    setError(null);
  };

  const handleScreenshot = useCallback(async () => {
    if (!url.trim()) return;
    setScreenshotLoading(true);
    try {
      const img = await captureScreenshot(url.trim());
      setScreenshot(img);
    } catch { /* non-critical */ } finally {
      setScreenshotLoading(false);
    }
  }, [url]);

  const handleAutoGenerate = useCallback(async () => {
    if (!url.trim()) { setError("Enter a URL first"); return; }
    setScriptLoading(true);
    setError(null);
    try {
      const result = await generateScript(url.trim(), context.trim() || undefined);
      setTitle(result.script.title);
      setVoice(result.script.voice);
      setSegments(result.script.segments);
      if (result.hasScreenshot && !screenshot) handleScreenshot();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScriptLoading(false);
    }
  }, [url, context, screenshot, handleScreenshot]);

  const handleVoiceRecorded = useCallback(async (audioBlob: Blob) => {
    if (!url.trim()) { setError("Enter a URL first"); return; }
    setVoiceLoading(true);
    setError(null);
    try {
      const result = await voiceToScript(url.trim(), audioBlob);
      setTitle(result.script.title);
      setVoice(result.script.voice);
      setSegments(result.script.segments);
      setVoiceTranscript(result.transcript);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVoiceLoading(false);
    }
  }, [url]);

  const handleVoicePreview = useCallback(() => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
      setVoicePlaying(false);
      return;
    }
    const BASE = import.meta.env.VITE_API_URL || "http://localhost:3002";
    const audio = new Audio(`${BASE}/api/voices/${encodeURIComponent(voice)}/preview`);
    audio.onended = () => { setVoicePlaying(false); audioPreviewRef.current = null; };
    audio.onplay = () => setVoicePlaying(true);
    audio.onerror = () => { setVoicePlaying(false); audioPreviewRef.current = null; };
    audioPreviewRef.current = audio;
    audio.play();
  }, [voice]);

  const handleGenerate = useCallback(async () => {
    if (!url.trim()) { setError("Enter a URL first"); return; }
    if (!segments.length) { setError("Add at least one segment"); return; }
    setGenerating(true); setError(null); setJob(null);

    const script: DemoScript = { title, url: url.trim(), voice, resolution: { width: 1920, height: 1080 }, segments };

    try {
      const jobId = await startGeneration(script);
      setJob({ id: jobId, status: "queued", progress: 0, message: "Starting..." });
      pollRef.current = window.setInterval(async () => {
        try {
          const status = await getJobStatus(jobId);
          setJob(status);
          if (status.status === "done" || status.status === "error") {
            if (pollRef.current) clearInterval(pollRef.current);
            setGenerating(false);
          }
        } catch { /* keep polling */ }
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setGenerating(false);
    }
  }, [url, title, voice, segments]);

  const anyLoading = scriptLoading || voiceLoading || generating;
  const hasScript = segments.length > 0 && segments.some((s) => s.narration.trim().length > 0);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={bgStyle} />

      {/* Header */}
      <header style={headerStyle}>
        <div style={headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {onBack && (
              <button onClick={onBack} style={backBtnStyle} title="Back to home">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
            )}
            <img src="/logo.png" alt="DemoPilot" style={{ width: 28, height: 28, borderRadius: 7 }} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>DemoPilot</span>
          </div>

          {/* Stepper */}
          <div style={stepperStyle}>
            {STEPS.map((s, i) => {
              const isCompleted = i < step;
              const isCurrent = i === step;
              const canClick = isCompleted;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <button
                    onClick={() => canClick && goTo(i)}
                    style={{
                      ...stepBtnStyle,
                      cursor: canClick ? "pointer" : "default",
                      background: isCurrent ? "var(--accent-glow)" : "transparent",
                      borderColor: isCurrent ? "var(--accent)" : isCompleted ? "var(--emerald)" : "var(--border)",
                    }}
                    disabled={!canClick}
                  >
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: isCompleted ? "var(--emerald)" : isCurrent ? "var(--accent-bright)" : "var(--border-bright)",
                      boxShadow: isCurrent ? "0 0 8px var(--accent-glow-strong)" : "none",
                      transition: "all 0.3s",
                    }} />
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 1.2, fontWeight: isCurrent ? 600 : 400,
                      color: isCurrent ? "var(--text)" : isCompleted ? "var(--emerald)" : "var(--text-tertiary)",
                      transition: "all 0.3s",
                    }}>{s.label}</span>
                    {isCompleted && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                  {i < 3 && (
                    <div style={{
                      width: 32, height: 1,
                      background: isCompleted ? "var(--emerald)" : "var(--border)",
                      transition: "all 0.3s",
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: 1 }}>
            v1.0
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={mainStyle}>
        {/* Step header */}
        <div key={`header-${animKey}`} style={stepHeaderStyle}>
          <div style={stepNumberStyle}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--accent-bright)" }}>
              {String(step + 1).padStart(2, "0")}
            </span>
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>
              {STEPS[step].title}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>
              {STEPS[step].desc}
            </p>
          </div>
        </div>

        {/* Step content */}
        <div key={`content-${animKey}`} style={contentAreaStyle}>
          {/* STEP 0: URL */}
          {step === 0 && (
            <div style={narrowContainer}>
              <div style={card}>
                <div style={cardLabel}>TARGET URL</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="url" value={url}
                    onChange={(e) => { setUrl(e.target.value); setScreenshot(null); }}
                    placeholder="https://your-app.com"
                    style={input}
                    autoFocus
                  />
                  <button
                    onClick={handleScreenshot}
                    disabled={!url.trim() || screenshotLoading}
                    style={iconBtn}
                    title="Capture screenshot"
                  >
                    {screenshotLoading ? <span style={spinner} /> : "\ud83d\udcf7"}
                  </button>
                </div>

                {screenshot && (
                  <div style={screenshotBox}>
                    <img src={screenshot} alt="Preview" style={{ width: "100%", display: "block", borderRadius: "var(--radius-sm)" }} />
                    <span style={screenshotLabel}>Gemini uses this for smarter scripts</span>
                  </div>
                )}

                <div style={{ marginTop: 20 }}>
                  <div style={cardLabel}>CONTEXT <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>optional</span></div>
                  <textarea
                    value={context} onChange={(e) => setContext(e.target.value)}
                    placeholder="Focus on dashboard, show analytics, highlight the settings page..."
                    rows={3} style={{ ...input, resize: "vertical", minHeight: 64 }}
                  />
                  <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6, lineHeight: 1.5 }}>
                    Give the AI additional instructions about what to focus on in the demo.
                  </p>
                </div>

                <div style={dividerStyle}>
                  <div style={dividerLine} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: 1 }}>OR SPEAK</span>
                  <div style={dividerLine} />
                </div>

                {voiceLoading ? (
                  <div style={{ ...actionBtn, background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-secondary)", cursor: "default" }}>
                    <span style={spinner} /> Transcribing via Speechmatics...
                  </div>
                ) : (
                  <VoiceRecorder onRecorded={async (blob) => {
                    if (!url.trim()) { setError("Enter a URL first"); return; }
                    setVoiceLoading(true); setError(null);
                    try {
                      const BASE = import.meta.env.VITE_API_URL || "http://localhost:3002";
                      const fd = new FormData();
                      fd.append("audio", blob, "recording.webm");
                      fd.append("url", url.trim());
                      const res = await fetch(`${BASE}/api/scripts/voice`, { method: "POST", body: fd });
                      if (!res.ok) throw new Error("Transcription failed");
                      const data = await res.json();
                      if (data.transcript) {
                        setContext((prev) => prev ? `${prev}\n${data.transcript}` : data.transcript);
                        setVoiceTranscript(data.transcript);
                      }
                    } catch (err: any) { setError(err.message); }
                    finally { setVoiceLoading(false); }
                  }} disabled={anyLoading || !url.trim()} />
                )}

                {voiceTranscript && (
                  <div style={transcriptBox}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: 1 }}>TRANSCRIPT</span>
                    <p style={{ marginTop: 4, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, fontStyle: "italic" }}>"{voiceTranscript}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: SCRIPT */}
          {step === 1 && (
            <div style={narrowContainer}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* AI generation */}
                <div style={card}>
                  <div style={cardLabel}>AI SCRIPT GENERATION</div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.6 }}>
                    Gemini will analyze your target URL and generate a narrated script with browser actions.
                  </p>
                  <button
                    onClick={handleAutoGenerate}
                    disabled={anyLoading || !url.trim()}
                    style={primaryActionBtn}
                  >
                    {scriptLoading ? (
                      <><span style={spinner} /> Analyzing with Gemini...</>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        Generate Script with AI
                      </>
                    )}
                  </button>

                  <div style={dividerStyle}>
                    <div style={dividerLine} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: 1 }}>OR SPEAK</span>
                    <div style={dividerLine} />
                  </div>

                  {voiceLoading ? (
                    <div style={{ ...actionBtn, background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-secondary)", cursor: "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={spinner} /> Transcribing via Speechmatics...
                    </div>
                  ) : (
                    <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={anyLoading || !url.trim()} />
                  )}

                  {voiceTranscript && (
                    <div style={transcriptBox}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: 1 }}>TRANSCRIPT</span>
                      <p style={{ marginTop: 4, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, fontStyle: "italic" }}>"{voiceTranscript}"</p>
                    </div>
                  )}
                </div>

                {/* Preview of generated segments */}
                {hasScript && (
                  <div style={card}>
                    <div style={cardLabel}>GENERATED SCRIPT</div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, lineHeight: 1.6 }}>
                      <strong style={{ color: "var(--text)" }}>{segments.length}</strong> segment{segments.length !== 1 ? "s" : ""} with narration and browser actions.
                    </p>
                    <p style={{ fontSize: 12, color: "var(--emerald)", marginBottom: 12 }}>
                      You can edit, reorder, and refine each segment in the next step.
                    </p>
                    {segments.map((seg, i) => (
                      <div key={i} style={segPreview}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-bright)", letterSpacing: 1 }}>
                            SEG {String(i + 1).padStart(2, "0")}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
                            {seg.actions.length} action{seg.actions.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {seg.narration || "(no narration)"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: EDIT */}
          {step === 2 && (
            <div style={wideContainer}>
              <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>
                {/* Settings sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={card}>
                    <div style={cardLabel}>VIDEO SETTINGS</div>

                    <label style={fieldLabel}>Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Product Demo" style={input} />

                    <label style={{ ...fieldLabel, marginTop: 16 }}>Narrator Voice</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select value={voice} onChange={(e) => { setVoice(e.target.value); if (audioPreviewRef.current) { audioPreviewRef.current.pause(); audioPreviewRef.current = null; setVoicePlaying(false); }}} style={{ ...input, flex: 1 }}>
                        {voices.length > 0
                          ? voices.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>)
                          : <option value={voice}>{voice}</option>}
                      </select>
                      <button onClick={handleVoicePreview} style={{
                        ...iconBtn,
                        background: voicePlaying ? "var(--accent)" : "var(--bg-input)",
                        color: voicePlaying ? "#fff" : "var(--text)",
                      }} title={voicePlaying ? "Stop" : "Preview voice"}>
                        {voicePlaying ? "\u23f9" : "\u25b6"}
                      </button>
                    </div>
                  </div>

                  {/* Segment count summary */}
                  <div style={{ ...card, background: "var(--accent-glow)", borderColor: "rgba(99,102,241,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "var(--radius)", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                        {segments.length}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Segment{segments.length !== 1 ? "s" : ""}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                          {segments.reduce((a, s) => a + s.actions.length, 0)} total actions
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Script editor */}
                <div style={{ ...card, minHeight: 400 }}>
                  {/* Voice edit bar */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, padding: 12, background: "var(--bg-elevated)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                    <VoiceRecorder
                      onRecorded={async (blob) => {
                        setVoiceLoading(true);
                        setError(null);
                        try {
                          const result = await voiceToScript(url.trim(), blob);
                          // Merge: append new segments to existing ones
                          setSegments((prev) => [...prev, ...result.script.segments]);
                          setVoiceTranscript(result.transcript);
                        } catch (err: any) {
                          setError(err.message);
                        } finally {
                          setVoiceLoading(false);
                        }
                      }}
                      disabled={voiceLoading || !url.trim()}
                    />
                  </div>
                  {voiceLoading && (
                    <div style={{ padding: 10, marginBottom: 12, background: "var(--accent-glow)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--accent-bright)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={spinner} /> Adding segments from voice...
                    </div>
                  )}
                  <ScriptEditor segments={segments} onChange={setSegments} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RENDER */}
          {step === 3 && (
            <div style={narrowContainer}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Summary card */}
                <div style={card}>
                  <div style={cardLabel}>RENDER SUMMARY</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
                    <div style={summaryItem}>
                      <span style={summaryLabel}>TARGET</span>
                      <span style={summaryValue}>{url}</span>
                    </div>
                    <div style={summaryItem}>
                      <span style={summaryLabel}>TITLE</span>
                      <span style={summaryValue}>{title}</span>
                    </div>
                    <div style={summaryItem}>
                      <span style={summaryLabel}>SEGMENTS</span>
                      <span style={summaryValue}>{segments.length}</span>
                    </div>
                    <div style={summaryItem}>
                      <span style={summaryLabel}>VOICE</span>
                      <span style={summaryValue}>{voices.find((v) => v.id === voice)?.name || voice.split("-").slice(2).join(" ")}</span>
                    </div>
                  </div>
                </div>

                {/* Generate button */}
                {!job && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !url.trim() || !segments.length}
                    style={generateBtn}
                  >
                    {generating ? (
                      <><span style={spinner} /> Generating...</>
                    ) : (
                      <>
                        Generate Demo Video
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </>
                    )}
                  </button>
                )}

                {/* Pipeline stages */}
                {job && (
                  <>
                    <div style={card}>
                      <div style={cardLabel}>PIPELINE</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                          { key: "generating_audio", icon: "\ud83c\udfa4", label: "Generating voiceover", detail: `${segments.length} segments with edge-tts` },
                          { key: "recording", icon: "\ud83c\udfac", label: "Recording browser", detail: "Playwright driving headless Chrome at 1920\u00d71080" },
                          { key: "composing", icon: "\ud83c\udfac", label: "Composing video", detail: "ffmpeg merging video + audio into MP4" },
                        ].map((stage) => {
                          const isActive = job.status === stage.key;
                          const isDone = (
                            stage.key === "generating_audio" && ["recording", "composing", "done"].includes(job.status)
                          ) || (
                            stage.key === "recording" && ["composing", "done"].includes(job.status)
                          ) || (
                            stage.key === "composing" && job.status === "done"
                          );
                          return (
                            <div key={stage.key} style={{
                              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                              borderRadius: "var(--radius)",
                              background: isActive ? "var(--accent-glow)" : "var(--bg-input)",
                              border: `1px solid ${isActive ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
                              opacity: isDone || isActive ? 1 : 0.4,
                              transition: "all 0.3s",
                            }}>
                              <span style={{ fontSize: 18 }}>{isDone ? "\u2705" : stage.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? "var(--accent-bright)" : isDone ? "var(--emerald)" : "var(--text-tertiary)" }}>
                                  {stage.label}
                                  {isActive && <span style={{ ...spinner, marginLeft: 8, width: 10, height: 10 }} />}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{stage.detail}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <ProgressPanel job={job} downloadUrl={job.status === "done" ? getDownloadUrl(job.id) : null} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div style={{ ...errorBox, maxWidth: 600, margin: "16px auto 0" }}>{error}</div>}
        </div>

        {/* Navigation */}
        <div style={navBarStyle}>
          <div style={navInner}>
            {step > 0 ? (
              <button onClick={() => goTo(step - 1)} style={navBackBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
            ) : <div />}

            {step < 3 && (() => {
              const cantContinue =
                (step === 0 && !url.trim()) ||
                (step === 1 && !hasScript) ||
                (step === 2 && (!title.trim() || !voice));
              const hint =
                step === 0 && !url.trim() ? "Enter a URL to continue" :
                step === 1 && !hasScript ? "Generate or write a script first" :
                step === 2 && !title.trim() ? "Add a video title" :
                null;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {hint && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--rose)", letterSpacing: 0.5 }}>
                      {hint}
                    </span>
                  )}
                  <button
                    onClick={() => goTo(step + 1)}
                    disabled={cantContinue}
                    style={navNextBtn}
                  >
                    Continue
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---- Styles ---- */

const bgStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: -1,
  background: "radial-gradient(ellipse 60% 40% at 20% 0%, rgba(99,102,241,0.08) 0%, transparent 50%)",
};

const headerStyle: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 50,
  background: "rgba(6,6,11,0.85)", backdropFilter: "blur(16px)",
  borderBottom: "1px solid var(--border)",
};

const headerInner: React.CSSProperties = {
  maxWidth: 1280, margin: "0 auto", padding: "10px 24px",
  display: "flex", justifyContent: "space-between", alignItems: "center",
};

const backBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: "var(--radius-sm)",
  background: "var(--bg-input)", border: "1px solid var(--border)",
  color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
};

const logoStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7,
  background: "linear-gradient(135deg, var(--accent), var(--cyan))",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 10, color: "#fff",
};

const stepperStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 0,
};

const stepBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "5px 10px", borderRadius: 20,
  border: "1px solid var(--border)", background: "transparent",
  transition: "all 0.3s",
};

const mainStyle: React.CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column",
  maxWidth: 1280, margin: "0 auto", width: "100%",
};

const stepHeaderStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 16,
  padding: "32px 24px 0",
  animation: "fadeInUp 0.35s ease-out both",
};

const stepNumberStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
  background: "var(--accent-glow)", border: "1px solid rgba(99,102,241,0.25)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const contentAreaStyle: React.CSSProperties = {
  flex: 1, padding: "24px 24px 120px",
  animation: "fadeInUp 0.4s ease-out 0.05s both",
};

const narrowContainer: React.CSSProperties = {
  maxWidth: 600, margin: "0 auto", width: "100%",
};

const wideContainer: React.CSSProperties = {
  maxWidth: 960, margin: "0 auto", width: "100%",
};

const card: React.CSSProperties = {
  background: "var(--bg-card)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)", padding: 20,
};

const cardLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
  color: "var(--text-secondary)", letterSpacing: 1.5, marginBottom: 12,
};

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-mono)", fontSize: 10,
  color: "var(--text-tertiary)", letterSpacing: 1, marginBottom: 5,
  textTransform: "uppercase",
};

const input: React.CSSProperties = {
  width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", padding: "10px 14px",
  color: "var(--text)", fontSize: 13, fontFamily: "var(--font-body)",
  outline: "none", transition: "all 0.2s",
};

const iconBtn: React.CSSProperties = {
  width: 40, height: 40, flexShrink: 0, borderRadius: "var(--radius)",
  background: "var(--bg-input)", border: "1px solid var(--border)",
  color: "var(--text)", fontSize: 16, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "all 0.2s",
};

const primaryActionBtn: React.CSSProperties = {
  width: "100%", padding: "12px 20px",
  background: "linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)",
  border: "none", borderRadius: "var(--radius)", color: "#fff",
  fontWeight: 600, fontSize: 14, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  boxShadow: "0 0 20px var(--accent-glow), 0 2px 8px rgba(0,0,0,0.3)",
  transition: "all 0.2s",
};

const actionBtn: React.CSSProperties = {
  width: "100%", padding: "10px 20px",
  background: "transparent", border: "1px solid var(--border-bright)",
  borderRadius: "var(--radius)", color: "var(--text-secondary)",
  fontWeight: 600, fontSize: 13, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  transition: "all 0.2s",
};

const generateBtn: React.CSSProperties = {
  width: "100%", padding: "16px 24px",
  background: "linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)",
  color: "#fff", border: "none", borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16,
  cursor: "pointer",
  boxShadow: "0 0 30px var(--accent-glow-strong), 0 4px 16px rgba(0,0,0,0.3)",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  transition: "all 0.2s",
};

const spinner: React.CSSProperties = {
  display: "inline-block", width: 14, height: 14,
  border: "2px solid transparent", borderTopColor: "currentColor",
  borderRadius: "50%", animation: "spin 0.7s linear infinite",
};

const errorBox: React.CSSProperties = {
  padding: 12, background: "var(--rose-glow)",
  border: "1px solid rgba(251,113,133,0.2)", borderRadius: "var(--radius)",
  fontSize: 13, color: "var(--rose)",
};

const dividerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12, margin: "16px 0",
};

const dividerLine: React.CSSProperties = {
  flex: 1, height: 1, background: "var(--border)",
};

const screenshotBox: React.CSSProperties = {
  marginTop: 12, borderRadius: "var(--radius)", overflow: "hidden",
  border: "1px solid var(--border)",
};

const screenshotLabel: React.CSSProperties = {
  display: "block", padding: "6px 10px", background: "var(--bg-input)",
  fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: 0.5,
};

const transcriptBox: React.CSSProperties = {
  marginTop: 12, padding: 12, background: "var(--bg-input)",
  borderRadius: "var(--radius)", border: "1px solid var(--border)",
};

const segPreview: React.CSSProperties = {
  padding: 14, marginBottom: 8, background: "var(--bg-input)",
  borderRadius: "var(--radius)", border: "1px solid var(--border)",
  transition: "border-color 0.2s",
};

const summaryItem: React.CSSProperties = {
  padding: 12, background: "var(--bg-input)", borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  display: "flex", flexDirection: "column", gap: 4,
};

const summaryLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600,
  color: "var(--text-tertiary)", letterSpacing: 1.5,
};

const summaryValue: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: "var(--text)",
  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};

const navBarStyle: React.CSSProperties = {
  position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
  background: "rgba(6,6,11,0.9)", backdropFilter: "blur(16px)",
  borderTop: "1px solid var(--border)",
};

const navInner: React.CSSProperties = {
  maxWidth: 1280, margin: "0 auto", padding: "14px 24px",
  display: "flex", justifyContent: "space-between", alignItems: "center",
};

const navBackBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "10px 20px", background: "var(--bg-card)",
  border: "1px solid var(--border)", borderRadius: "var(--radius)",
  color: "var(--text-secondary)", fontWeight: 600, fontSize: 13,
  cursor: "pointer", transition: "all 0.2s",
};

const navNextBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "10px 24px",
  background: "linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)",
  border: "none", borderRadius: "var(--radius)",
  color: "#fff", fontWeight: 600, fontSize: 13,
  cursor: "pointer", transition: "all 0.2s",
  boxShadow: "0 0 16px var(--accent-glow)",
};

export default App;
