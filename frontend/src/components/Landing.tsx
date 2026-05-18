import { useEffect, useRef, useState } from "react";

interface Props {
  onLaunch: () => void;
}

const SHOWCASE_DEMOS = [
  {
    title: "AgentShield",
    desc: "AI security guardian — real-time threat dashboard demo",
    src: "/demos/agentshield_demo.mp4",
    poster: "/demos/agentshield_thumb.jpg",
    accent: "#22d3ee",
    accentGlow: "rgba(34, 211, 238, 0.25)",
    tag: "HACKATHON ENTRY",
  },
  {
    title: "Meridian",
    desc: "LC intelligence platform — workflow & analytics walkthrough",
    src: "/demos/meridian_demo_final.mp4",
    poster: "/demos/meridian_thumb.jpg",
    accent: "#a78bfa",
    accentGlow: "rgba(167, 139, 250, 0.25)",
    tag: "COMPETITION ENTRY",
  },
];

const PIPELINE_STEPS = [
  { icon: "01", label: "PASTE URL", desc: "Any web application", color: "var(--cyan)" },
  { icon: "02", label: "AI SCRIPT", desc: "Gemini analyzes & writes", color: "var(--accent-bright)" },
  { icon: "03", label: "RECORD", desc: "Playwright captures browser", color: "var(--emerald)" },
  { icon: "04", label: "NARRATE", desc: "Neural voice synthesis", color: "var(--amber)" },
  { icon: "05", label: "COMPOSE", desc: "ffmpeg renders final cut", color: "var(--rose)" },
];

const PARTNERS = [
  { name: "Google Gemini", role: "Script Intelligence", color: "var(--cyan)" },
  { name: "Vultr", role: "Cloud Infrastructure", color: "#007bfc" },
  { name: "Speechmatics", role: "Voice Transcription", color: "var(--accent-bright)" },
  { name: "Playwright", role: "Browser Automation", color: "var(--emerald)" },
  { name: "edge-tts", role: "Neural Narration", color: "var(--amber)" },
  { name: "ffmpeg", role: "Video Composition", color: "var(--rose)" },
];

export function Landing({ onLaunch }: Props) {
  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setVisible(true);
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % PIPELINE_STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Background effects */}
      <div style={bgGradientStyle} />
      <div style={gridOverlayStyle} />

      {/* Nav */}
      <nav style={navStyle}>
        <div style={navInnerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="DemoPilot" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
              DemoPilot
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: 1 }}>
              AI AGENT OLYMPICS 2026
            </span>
            <button onClick={onLaunch} style={navCTAStyle}>Launch App</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        ...heroStyle,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <div style={heroTagStyle}>
          <span style={statusDotStyle} />
          AUTONOMOUS DEMO AGENT
        </div>

        <h1 style={heroTitleStyle}>
          URL in.<br />
          <span style={{ color: "var(--accent-bright)" }}>Demo video</span> out.
        </h1>

        <p style={heroDescStyle}>
          Paste any web app URL. Our AI agent captures a screenshot, writes a narrated script,
          drives the browser, generates voiceover, and delivers a production-ready MP4.
          No recording. No editing. No retakes.
        </p>

        <div style={{ display: "flex", gap: 16, marginTop: 40, justifyContent: "center" }}>
          <button onClick={onLaunch} style={heroCTAStyle}>
            Start Creating
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <a href="#pipeline" style={heroSecondaryStyle}>
            See how it works
          </a>
        </div>

        {/* Stats */}
        <div style={statsRowStyle}>
          {[
            { value: "~60s", label: "Generation time" },
            { value: "5", label: "AI pipeline steps" },
            { value: "10+", label: "Neural voices" },
          ].map((s, i) => (
            <div key={i} style={statStyle}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: "var(--text)" }}>{s.value}</span>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section id="pipeline" style={pipelineSectionStyle}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 12 }}>
            THE PIPELINE
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 700, marginBottom: 48, lineHeight: 1.2 }}>
            Five autonomous steps.<br />
            <span style={{ color: "var(--text-tertiary)" }}>Zero human intervention.</span>
          </h2>

          <div style={pipelineGridStyle}>
            {PIPELINE_STEPS.map((step, i) => (
              <div
                key={i}
                style={{
                  ...pipelineCardStyle,
                  borderColor: activeStep === i ? step.color : "var(--border)",
                  boxShadow: activeStep === i ? `0 0 30px ${step.color}20` : "none",
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: step.color,
                  letterSpacing: 2,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: activeStep === i ? step.color : "var(--text-tertiary)",
                    transition: "all 0.3s",
                  }} />
                  STEP {step.icon}
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                  {step.label}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {step.desc}
                </p>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div style={connectorStyle}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section style={showcaseSectionStyle}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 12 }}>
            GENERATED RESULTS
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
            Real demos. Zero effort.
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 56, maxWidth: 520 }}>
            These videos were generated entirely by DemoPilot — from URL to finished MP4, untouched by human hands.
          </p>

          <div style={showcaseGridStyle}>
            {SHOWCASE_DEMOS.map((demo, i) => (
              <ShowcaseCard key={i} demo={demo} />
            ))}
          </div>
        </div>
      </section>

      {/* Tech Partners */}
      <section style={partnersSectionStyle}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 12 }}>
            TECHNOLOGY
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 700, marginBottom: 48 }}>
            Powered by the best.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            {PARTNERS.map((p, i) => (
              <div key={i} style={partnerCardStyle}>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 15,
                  fontWeight: 700,
                  color: p.color,
                  marginBottom: 4,
                }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{p.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={ctaSectionStyle}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
            Ready to automate your demos?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32 }}>
            Stop wasting hours on screen recordings. Let DemoPilot handle it.
          </p>
          <button onClick={onLaunch} style={heroCTAStyle}>
            Launch DemoPilot
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: 1 }}>
          DEMOPILOT
        </div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          AI Agent Olympics 2026 — Milan AI Week
        </div>
      </footer>
    </div>
  );
}

/* ---- Showcase Card Component ---- */

function ShowcaseCard({ demo }: { demo: typeof SHOWCASE_DEMOS[number] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        background: `linear-gradient(135deg, ${demo.accent}18 0%, transparent 60%)`,
        border: `1px solid ${isHovered ? demo.accent + "60" : "var(--border)"}`,
        overflow: "hidden",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: isHovered ? `0 0 60px ${demo.accentGlow}, 0 20px 60px rgba(0,0,0,0.4)` : "0 4px 24px rgba(0,0,0,0.2)",
        cursor: "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={togglePlay}
    >
      {/* Tag badge */}
      <div style={{
        position: "absolute", top: 16, left: 16, zIndex: 10,
        fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
        letterSpacing: 2, color: demo.accent,
        padding: "4px 10px", borderRadius: 6,
        background: `${demo.accent}15`,
        border: `1px solid ${demo.accent}30`,
        backdropFilter: "blur(8px)",
      }}>
        {demo.tag}
      </div>

      {/* Video container */}
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#000" }}>
        <video
          ref={videoRef}
          src={demo.src}
          poster={demo.poster}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#000" }}
          onEnded={() => setIsPlaying(false)}
          playsInline
          preload="auto"
        />

        {/* Play/Pause overlay */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: isPlaying ? "transparent" : "rgba(0,0,0,0.35)",
          transition: "all 0.3s ease",
          opacity: isPlaying && !isHovered ? 0 : 1,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: `${demo.accent}20`,
            border: `2px solid ${demo.accent}90`,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(12px)",
            transition: "all 0.3s ease",
            transform: isHovered ? "scale(1.1)" : "scale(1)",
            opacity: isPlaying && !isHovered ? 0 : 1,
          }}>
            {isPlaying ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill={demo.accent}>
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill={demo.accent}>
                <path d="M8 5.14v14.72a1 1 0 001.5.86l11.72-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div style={{
        padding: "16px 20px",
        background: "var(--bg-card)",
        borderTop: `1px solid ${demo.accent}15`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700,
            color: "var(--text)", marginBottom: 2,
          }}>
            {demo.title}
          </div>
          <div style={{
            fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.4,
          }}>
            {demo.desc}
          </div>
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: demo.accent, letterSpacing: 1,
          padding: "4px 10px", borderRadius: 6,
          border: `1px solid ${demo.accent}25`,
          whiteSpace: "nowrap",
        }}>
          AI GENERATED
        </div>
      </div>
    </div>
  );
}

/* ---- Styles ---- */

const bgGradientStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: -2,
  background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(34,211,238,0.06) 0%, transparent 50%)",
};

const gridOverlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: -1,
  backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
  backgroundSize: "80px 80px",
  opacity: 0.15,
};

const navStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
  background: "rgba(6,6,11,0.8)", backdropFilter: "blur(16px)",
  borderBottom: "1px solid var(--border)",
};

const navInnerStyle: React.CSSProperties = {
  maxWidth: 1200, margin: "0 auto", padding: "12px 32px",
  display: "flex", justifyContent: "space-between", alignItems: "center",
};


const navCTAStyle: React.CSSProperties = {
  padding: "7px 18px", borderRadius: "var(--radius-sm)",
  background: "var(--accent)", color: "#fff", border: "none",
  fontWeight: 600, fontSize: 13,
};

const heroStyle: React.CSSProperties = {
  maxWidth: 800, margin: "0 auto", padding: "160px 32px 80px", textAlign: "center",
};

const heroTagStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 2,
  color: "var(--accent-bright)",
  padding: "6px 16px", borderRadius: 20,
  border: "1px solid var(--border-bright)",
  background: "var(--accent-glow)",
  marginBottom: 32,
};

const statusDotStyle: React.CSSProperties = {
  width: 6, height: 6, borderRadius: "50%",
  background: "var(--emerald)",
  animation: "pulse 2s ease-in-out infinite",
};

const heroTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: 64, fontWeight: 800,
  lineHeight: 1.05, letterSpacing: "-2px",
  marginBottom: 24,
};

const heroDescStyle: React.CSSProperties = {
  fontSize: 17, lineHeight: 1.7, color: "var(--text-secondary)",
  maxWidth: 580, margin: "0 auto",
};

const heroCTAStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 10,
  padding: "14px 32px", borderRadius: "var(--radius)",
  background: "linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)",
  color: "#fff", border: "none",
  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15,
  boxShadow: "0 0 30px var(--accent-glow-strong), 0 4px 16px rgba(0,0,0,0.3)",
  transition: "all 0.2s",
};

const heroSecondaryStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center",
  padding: "14px 28px", borderRadius: "var(--radius)",
  background: "transparent", color: "var(--text-secondary)",
  border: "1px solid var(--border-bright)",
  fontWeight: 600, fontSize: 15,
  transition: "all 0.2s",
};

const statsRowStyle: React.CSSProperties = {
  display: "flex", justifyContent: "center", gap: 48, marginTop: 64,
  paddingTop: 48, borderTop: "1px solid var(--border)",
};

const statStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
};

const pipelineSectionStyle: React.CSSProperties = {
  padding: "100px 32px", borderTop: "1px solid var(--border)",
};

const pipelineGridStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12,
  position: "relative",
};

const pipelineCardStyle: React.CSSProperties = {
  background: "var(--bg-card)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", padding: 20,
  transition: "all 0.4s ease", position: "relative",
  animation: "fadeInUp 0.5s ease-out both",
};

const connectorStyle: React.CSSProperties = {
  position: "absolute", right: -16, top: "50%", transform: "translateY(-50%)",
  zIndex: 2,
};

const showcaseSectionStyle: React.CSSProperties = {
  padding: "120px 32px", borderTop: "1px solid var(--border)",
  position: "relative",
};

const showcaseGridStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 28,
};

const partnersSectionStyle: React.CSSProperties = {
  padding: "100px 32px", borderTop: "1px solid var(--border)",
};

const partnerCardStyle: React.CSSProperties = {
  background: "var(--bg-card)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", padding: 20,
  textAlign: "center",
};

const ctaSectionStyle: React.CSSProperties = {
  padding: "100px 32px", borderTop: "1px solid var(--border)",
};

const footerStyle: React.CSSProperties = {
  borderTop: "1px solid var(--border)", padding: "20px 32px",
  display: "flex", justifyContent: "space-between", alignItems: "center",
  maxWidth: 1200, margin: "0 auto",
};
