import React from 'react';
import { usePlayerContext } from '../../App';

export default function MiniPlayer() {
  const { currentTrack, isPlaying, progress, play, pause, seek } = usePlayerContext();

  if (!currentTrack) return null;

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio);
  };

  return (
    <div style={styles.bar}>
      <div style={styles.trackInfo}>
        {currentTrack.albumArt && (
          <img src={currentTrack.albumArt} alt="" style={styles.thumb} />
        )}
        <div style={styles.meta}>
          <span style={styles.title}>{currentTrack.title}</span>
          <span style={styles.artist}>{currentTrack.artist}</span>
        </div>
      </div>

      <div style={styles.controls}>
        <button
          style={styles.playBtn}
          onClick={() => isPlaying ? pause() : play(currentTrack)}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>

      <div style={styles.progressWrapper}>
        <div style={styles.progressBar} onClick={handleProgressClick}>
          <div style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
        </div>
        <span style={styles.badge}>30s preview</span>
      </div>

      {/* Waveform animation when playing */}
      {isPlaying && (
        <div style={styles.wave}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ ...styles.waveBar, animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes waveBar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  bar: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    height: '72px',
    background: 'rgba(8,7,15,0.95)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
    padding: '0 var(--space-6)',
    zIndex: 100,
  },
  trackInfo: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 },
  thumb: { width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 },
  meta: { minWidth: 0 },
  title: { display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  artist: { display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  controls: { flexShrink: 0 },
  playBtn: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'var(--accent-primary)', color: '#fff', border: 'none',
    fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 20px rgba(168,85,247,0.4)',
  },
  progressWrapper: { flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-3)' },
  progressBar: { flex: 1, height: '4px', background: 'var(--bg-overlay)', borderRadius: '2px', cursor: 'pointer', position: 'relative' },
  progressFill: { height: '100%', background: 'var(--accent-primary)', borderRadius: '2px', transition: 'width 0.1s linear', boxShadow: '0 0 8px var(--accent-primary)' },
  badge: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  wave: { display: 'flex', alignItems: 'center', gap: '2px', height: '20px', flexShrink: 0 },
  waveBar: {
    width: '3px', height: '16px', background: 'var(--accent-primary)', borderRadius: '2px',
    display: 'inline-block', transformOrigin: 'center',
    animation: 'waveBar 0.5s ease-in-out infinite',
  },
};
