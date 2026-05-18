import { useState, useRef, useCallback } from "react";

interface Props {
  onRecorded: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus" : "audio/webm",
      });
      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecorded(blob);
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setDuration(0);
      };
      mediaRecorder.start(100);
      setRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [onRecorded]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (recording) {
    return (
      <div style={recordingBar}>
        <div style={pulseDot} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--rose)" }}>
          REC {fmt(duration)}
        </span>
        <button onClick={stopRecording} style={stopBtn}>Stop & Transcribe</button>
      </div>
    );
  }

  return (
    <button onClick={startRecording} disabled={disabled} style={micBtn}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
      Describe with voice
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-tertiary)", marginLeft: 4 }}>SPEECHMATICS</span>
    </button>
  );
}

const micBtn: React.CSSProperties = {
  width: "100%", padding: "10px 20px",
  background: "var(--rose-glow)", border: "1px solid rgba(251,113,133,0.2)",
  borderRadius: "var(--radius)", color: "var(--rose)",
  fontWeight: 600, fontSize: 13, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  transition: "all 0.2s",
};

const recordingBar: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "10px 16px", background: "var(--rose-glow)",
  border: "1px solid rgba(251,113,133,0.25)", borderRadius: "var(--radius)",
};

const pulseDot: React.CSSProperties = {
  width: 8, height: 8, borderRadius: "50%",
  background: "var(--rose)", animation: "pulse 1s ease-in-out infinite",
};

const stopBtn: React.CSSProperties = {
  marginLeft: "auto", padding: "6px 14px",
  background: "var(--rose)", color: "#fff", border: "none",
  borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: 12, cursor: "pointer",
};
