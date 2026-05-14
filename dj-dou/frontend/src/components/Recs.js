import React, { useState } from "react";
import api, { usePlayerCtx, matchColor } from "../lib";
const MOOD_PRESETS = [
  { label: "Late night drive", query: "slow melancholic late night drive" },
  { label: "Workout fuel", query: "high energy aggressive workout beats" },
  { label: "Rainy Sunday", query: "soft acoustic rainy Sunday morning" },
  { label: "Deep focus", query: "instrumental minimal focus work" },
  { label: "Summer happiness", query: "happy danceable bright summer vibes" },
  { label: "Cinematic feels", query: "cinematic orchestral emotional" },
];
export function RecommendationCard({ recommendation }) {
  const { track, matchPercent, whyText, similarityScore } = recommendation;
  const { play, currentTrack, isPlaying } = usePlayerCtx();
  const thisPlaying = isPlaying && currentTrack?.spotifyId === track.spotifyId;
  const color = matchColor(similarityScore);
  const log = (action) =>
    api.post("/interactions", { trackId: track.id, action }).catch(() => {});
  return (
    <div
      className="glass"
      style={{ display: "flex", gap: "12px", padding: "14px" }}
    >
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          cursor: track.previewUrl ? "pointer" : "default",
        }}
        onClick={() => track.previewUrl && play(track)}
      >
        {track.albumArt ? (
          <img
            src={track.albumArt}
            alt={track.title}
            style={{
              width: 80,
              height: 80,
              borderRadius: "var(--radius-sm)",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-overlay)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
            }}
          >
            🎵
          </div>
        )}
        {track.previewUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "var(--radius-sm)",
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              color: "#fff",
              opacity: thisPlaying ? 1 : 0,
              transition: "opacity 150ms",
            }}
          >
            {thisPlaying ? "⏸" : "▶"}
          </div>
        )}
        {thisPlaying && (
          <div
            style={{
              position: "absolute",
              bottom: 5,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "2px",
              alignItems: "flex-end",
            }}
          >
            {[0, 0.15, 0.3].map((d) => (
              <span
                key={d}
                style={{
                  width: 3,
                  height: 12,
                  background: "var(--accent)",
                  borderRadius: "2px",
                  display: "inline-block",
                  transformOrigin: "bottom",
                  animation: `waveBar 0.5s ${d}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "3px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              padding: "0.12rem 0.5rem",
              fontSize: "0.68rem",
              fontFamily: "var(--mono)",
              fontWeight: 600,
              background: `${color}22`,
              border: `1px solid ${color}55`,
              borderRadius: "var(--radius-full)",
              color,
            }}
          >
            {matchPercent}% match
          </span>
          {!track.previewUrl && (
            <span
              style={{
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                fontFamily: "var(--mono)",
              }}
            >
              no preview
            </span>
          )}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.95rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.title}
        </div>
        <div
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.8rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.artist}
        </div>
        {whyText && (
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.78rem",
              fontStyle: "italic",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {whyText}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginTop: "auto",
            paddingTop: "4px",
          }}
        >
          {[
            ["♥", "liked"],
            ["✕", "skipped"],
            ["＋", "saved"],
          ].map(([icon, action]) => (
            <button
              key={action}
              onClick={() => log(action)}
              title={action}
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-overlay)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                fontSize: "0.8rem",
              }}
            >
              {icon}
            </button>
          ))}
          <a
            href={`https://open.spotify.com/track/${track.spotifyId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-overlay)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
            }}
          >
            ↗
          </a>
        </div>
      </div>
    </div>
  );
}
export function MoodSearch({ onSearch, loading }) {
  const [query, setQuery] = useState("");
  const submit = (q) => {
    const f = (q || query).trim();
    if (f) onSearch(f);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "10px" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "var(--bg-base)",
            border: "1px solid var(--border-bright)",
            borderRadius: "var(--radius)",
            padding: "0 14px",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
              flexShrink: 0,
            }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Describe how you want to feel… e.g. melancholic and slow for a rainy day"
            style={{
              flex: 1,
              border: "none",
              background: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontFamily: "var(--font)",
              fontSize: "0.9rem",
              padding: "0.75rem 0",
            }}
          />
        </div>
        <button
          onClick={() => submit()}
          disabled={loading || !query.trim()}
          style={{
            padding: "0 1.5rem",
            background:
              "linear-gradient(135deg,var(--accent),var(--accent-hot))",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius)",
            fontFamily: "var(--font)",
            fontWeight: 700,
            cursor: "pointer",
            opacity: loading || !query.trim() ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "…" : "Search"}
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {MOOD_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setQuery(p.query);
              submit(p.query);
            }}
            style={{
              padding: "0.3rem 0.85rem",
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-full)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font)",
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p
        style={{
          fontFamily: "var(--mono)",
          fontSize: "0.68rem",
          color: "var(--text-muted)",
        }}
      >
        ✦ Powered by Claude AI — translates your mood into audio feature filters
      </p>
    </div>
  );
}
