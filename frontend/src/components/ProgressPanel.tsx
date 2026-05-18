import type { JobStatus } from "../types";

interface Props {
  job: JobStatus;
  downloadUrl: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  queued: "QUEUED",
  generating_audio: "GENERATING AUDIO",
  recording: "RECORDING BROWSER",
  composing: "COMPOSING VIDEO",
  done: "COMPLETE",
  error: "FAILED",
};

export function ProgressPanel({ job, downloadUrl }: Props) {
  const label = STATUS_LABELS[job.status] || job.status;
  const isError = job.status === "error";
  const isDone = job.status === "done";

  return (
    <div style={container}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
          color: isDone ? "var(--emerald)" : isError ? "var(--rose)" : "var(--accent-bright)",
        }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
          {job.progress}%
        </span>
      </div>

      {/* Progress track */}
      <div style={track}>
        <div style={{
          height: "100%", borderRadius: 3,
          background: isError
            ? "var(--rose)"
            : isDone
              ? "var(--emerald)"
              : "linear-gradient(90deg, var(--accent), var(--accent-bright))",
          width: `${job.progress}%`,
          transition: "width 0.5s ease",
          boxShadow: isDone ? "0 0 12px var(--emerald-glow)" : isError ? "none" : "0 0 12px var(--accent-glow)",
        }} />
      </div>

      {/* Message */}
      <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
        {job.message}
      </p>

      {/* Download */}
      {isDone && downloadUrl && (
        <a href={downloadUrl} download style={downloadBtn}>
          Download MP4
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
        </a>
      )}

      {isError && (
        <div style={errorBox}>{job.message}</div>
      )}
    </div>
  );
}

const container: React.CSSProperties = {
  background: "var(--bg-card)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)", padding: 20,
};

const track: React.CSSProperties = {
  width: "100%", height: 6, background: "var(--bg-input)",
  borderRadius: 3, overflow: "hidden",
};

const downloadBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  marginTop: 16, padding: "12px 24px", width: "100%",
  background: "var(--emerald)", color: "#fff", borderRadius: "var(--radius)",
  fontWeight: 700, fontSize: 14, textDecoration: "none",
  boxShadow: "0 0 20px var(--emerald-glow)",
  transition: "all 0.2s",
};

const errorBox: React.CSSProperties = {
  marginTop: 12, padding: 10, background: "var(--rose-glow)",
  borderRadius: "var(--radius)", fontSize: 12, color: "var(--rose)",
  border: "1px solid rgba(251,113,133,0.15)",
};
