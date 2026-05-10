import React from 'react';
import { usePlayerContext } from '../../App';
import { interactionsAPI } from '../../utils/api';

export default function RecommendationCard({ recommendation }) {
  const { track, matchPercent, whyText } = recommendation;
  const { play, currentTrack, isPlaying } = usePlayerContext();

  const isThisPlaying = isPlaying && currentTrack?.spotifyId === track.spotifyId;

  const handlePlay = () => {
    if (track.previewUrl) {
      play(track);
    } else {
      window.open(`https://open.spotify.com/track/${track.spotifyId}`, '_blank');
    }
  };

  const handleLike = () => interactionsAPI.log(track.id, 'liked').catch(console.error);
  const handleSkip = () => interactionsAPI.log(track.id, 'skipped').catch(console.error);
  const handleSave = () => interactionsAPI.log(track.id, 'saved').catch(console.error);

  return (
    <div style={styles.card} className="glass">
      {/* Album Art + Play */}
      <div style={styles.artWrapper} onClick={handlePlay}>
        {track.albumArt
          ? <img src={track.albumArt} alt={track.title} style={styles.art} />
          : <div style={styles.artPlaceholder}>🎵</div>
        }
        <div style={styles.playOverlay}>
          {isThisPlaying ? '⏸' : (track.previewUrl ? '▶' : '↗')}
        </div>
        {isThisPlaying && (
          <div style={styles.playingBars}>
            {[0, 0.2, 0.4].map((d) => (
              <span key={d} style={{ ...styles.bar, animationDelay: `${d}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={styles.info}>
        <div style={styles.meta}>
          <span style={styles.matchBadge}>{matchPercent}% match</span>
          {!track.previewUrl && (
            <span style={styles.noPreview}>No preview</span>
          )}
        </div>
        <h3 style={styles.trackTitle}>{track.title}</h3>
        <p style={styles.artist}>{track.artist}</p>
        {whyText && <p style={styles.why}>{whyText}</p>}

        {/* Actions */}
        <div style={styles.actions}>
          <button style={styles.actionBtn} onClick={handleLike} title="Like">♥</button>
          <button style={styles.actionBtn} onClick={handleSkip} title="Skip">✕</button>
          <button style={styles.actionBtn} onClick={handleSave} title="Save">＋</button>
          <a
            href={`https://open.spotify.com/track/${track.spotifyId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.actionBtn, display: 'flex', alignItems: 'center' }}
            title="Open in Spotify"
          >
            ↗
          </a>
        </div>
      </div>

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
  card: { display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)', transition: 'border-color var(--transition-base)' },
  artWrapper: { position: 'relative', cursor: 'pointer', flexShrink: 0 },
  art: { width: '80px', height: '80px', borderRadius: 'var(--radius-md)', objectFit: 'cover' },
  artPlaceholder: { width: '80px', height: '80px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' },
  playOverlay: {
    position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.2rem', opacity: 0, transition: 'opacity var(--transition-fast)',
    color: '#fff',
  },
  playingBars: { position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2px', alignItems: 'flex-end', height: '14px' },
  bar: {
    width: '3px', height: '14px', background: 'var(--accent-primary)', borderRadius: '2px',
    display: 'inline-block', transformOrigin: 'bottom',
    animation: 'waveBar 0.6s ease-in-out infinite',
  },
  info: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
  meta: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
  matchBadge: {
    padding: '0.15rem 0.5rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
    background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)',
    borderRadius: 'var(--radius-full)', color: 'var(--accent-primary)',
  },
  noPreview: { fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  trackTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  artist: { color: 'var(--text-secondary)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  why: { color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.5, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  actions: { display: 'flex', gap: 'var(--space-2)', marginTop: 'auto' },
  actionBtn: {
    width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer',
    transition: 'color var(--transition-fast), border-color var(--transition-fast)',
  },
};
