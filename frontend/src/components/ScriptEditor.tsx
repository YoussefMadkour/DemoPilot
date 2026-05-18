import { useState } from "react";
import type { ScriptSegment, ScriptAction } from "../types";

const ACTION_TYPES = ["navigate", "click", "type", "scroll", "wait", "hover", "screenshot"] as const;

interface Props {
  segments: ScriptSegment[];
  onChange: (segments: ScriptSegment[]) => void;
}

export function ScriptEditor({ segments, onChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);

  const updateSegment = (idx: number, patch: Partial<ScriptSegment>) => {
    const next = [...segments];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const addSegment = () => {
    onChange([...segments, { narration: "", actions: [{ type: "wait", duration: 2000 }] }]);
    setExpanded(segments.length);
  };

  const removeSegment = (idx: number) => {
    onChange(segments.filter((_, i) => i !== idx));
  };

  const updateAction = (segIdx: number, actIdx: number, patch: Partial<ScriptAction>) => {
    const next = [...segments];
    const actions = [...next[segIdx].actions];
    actions[actIdx] = { ...actions[actIdx], ...patch };
    next[segIdx] = { ...next[segIdx], actions };
    onChange(next);
  };

  const addAction = (segIdx: number) => {
    const next = [...segments];
    next[segIdx] = {
      ...next[segIdx],
      actions: [...next[segIdx].actions, { type: "wait", duration: 2000 }],
    };
    onChange(next);
  };

  const removeAction = (segIdx: number, actIdx: number) => {
    const next = [...segments];
    next[segIdx] = {
      ...next[segIdx],
      actions: next[segIdx].actions.filter((_, i) => i !== actIdx),
    };
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Script Segments</h3>
        <button onClick={addSegment} style={addBtnStyle}>+ Add Segment</button>
      </div>

      {segments.map((seg, segIdx) => (
        <div key={segIdx} style={segmentCardStyle}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => setExpanded(expanded === segIdx ? null : segIdx)}
          >
            <span style={{ fontWeight: 500 }}>
              Segment {segIdx + 1}
              <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
                {seg.narration.slice(0, 60)}{seg.narration.length > 60 ? "..." : ""}
              </span>
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {segments.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); removeSegment(segIdx); }} style={removeBtnStyle}>
                  Remove
                </button>
              )}
              <span style={{ color: "var(--text-muted)" }}>{expanded === segIdx ? "▲" : "▼"}</span>
            </div>
          </div>

          {expanded === segIdx && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>Narration</label>
                <textarea
                  value={seg.narration}
                  onChange={(e) => updateSegment(segIdx, { narration: e.target.value })}
                  rows={3}
                  style={textareaStyle}
                  placeholder="What the voiceover says during this segment..."
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={labelStyle}>Actions</label>
                  <button onClick={() => addAction(segIdx)} style={{ ...addBtnStyle, fontSize: 12, padding: "4px 10px" }}>
                    + Action
                  </button>
                </div>

                {seg.actions.map((act, actIdx) => (
                  <div key={actIdx} style={actionRowStyle}>
                    <select
                      value={act.type}
                      onChange={(e) => updateAction(segIdx, actIdx, { type: e.target.value as any })}
                      style={{ ...inputStyle, width: 120, flexShrink: 0 }}
                    >
                      {ACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {(act.type === "click" || act.type === "hover" || act.type === "type") && (
                      <input
                        placeholder="CSS selector"
                        value={act.selector || ""}
                        onChange={(e) => updateAction(segIdx, actIdx, { selector: e.target.value })}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    )}

                    {act.type === "type" && (
                      <input
                        placeholder="Text to type"
                        value={act.value || ""}
                        onChange={(e) => updateAction(segIdx, actIdx, { value: e.target.value })}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    )}

                    {act.type === "navigate" && (
                      <input
                        placeholder="URL"
                        value={act.url || ""}
                        onChange={(e) => updateAction(segIdx, actIdx, { url: e.target.value })}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    )}

                    {act.type === "scroll" && (
                      <>
                        <select
                          value={act.direction || "down"}
                          onChange={(e) => updateAction(segIdx, actIdx, { direction: e.target.value as any })}
                          style={{ ...inputStyle, width: 90 }}
                        >
                          <option value="down">Down</option>
                          <option value="up">Up</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Pixels"
                          value={act.pixels ?? 400}
                          onChange={(e) => updateAction(segIdx, actIdx, { pixels: parseInt(e.target.value) || 400 })}
                          style={{ ...inputStyle, width: 80 }}
                        />
                      </>
                    )}

                    {(act.type === "wait" || act.type === "screenshot") && (
                      <input
                        type="number"
                        placeholder="Duration (ms)"
                        value={act.duration ?? 2000}
                        onChange={(e) => updateAction(segIdx, actIdx, { duration: parseInt(e.target.value) || 2000 })}
                        style={{ ...inputStyle, width: 120 }}
                      />
                    )}

                    {seg.actions.length > 1 && (
                      <button onClick={() => removeAction(segIdx, actIdx)} style={xBtnStyle}>x</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const segmentCardStyle: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: 16,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  fontWeight: 500,
  color: "var(--text-tertiary)",
  letterSpacing: 1,
  textTransform: "uppercase",
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "8px 10px",
  color: "var(--text)",
  fontSize: 13,
  outline: "none",
  fontFamily: "var(--font-body)",
  transition: "border-color 0.2s",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  width: "100%",
  resize: "vertical",
  minHeight: 60,
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginBottom: 8,
};

const addBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px dashed var(--border-bright)",
  color: "var(--accent-bright)",
  borderRadius: "var(--radius-sm)",
  padding: "6px 14px",
  fontSize: 12,
  fontWeight: 600,
};

const removeBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--rose)",
  fontSize: 11,
  fontWeight: 600,
  padding: "2px 6px",
};

const xBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--rose)",
  fontSize: 14,
  padding: "4px 8px",
  flexShrink: 0,
};
