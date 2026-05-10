import React from 'react';
import { useSeeds } from '../../hooks/useSeeds';
import TrackSearch from '../shared/TrackSearch';

/**
 * Full seed track manager — search + add + remove.
 * Used on the Dashboard and Profile pages.
 */
export default function SeedsManager() {
  const { seeds, seedSpotifyIds, loading, adding, error, addSeed, removeSeed } = useSeeds();

  const handleAdd = async (track) => {
    try {
      await addSeed(track.spotifyId);
    } catch {
      // error is set in hook
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Seed Tracks</h3>
          <p style={styles.sub}>
            Tracks that anchor your SoundDNA. Add up to 10.
          </p>
        </div>
        <span style={styles.count}>{seeds.length} / 10</span>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <TrackSearch
        onAddSeed={handleAdd}
        seedIds={seedSpotifyIds}
        placeholder="Search to add a seed track…"
      />

      {loading ? (
        <div style={styles.loadingRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={styles.skeleton} />
          ))}
        </div>
      ) : seeds.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>🌱</span>
          <p>No seed tracks yet. Search above to add some.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {seeds.map((seed) => (
            <SeedItem
              key={seed.id}
              seed={seed}
              onRemove={() => removeSeed(seed.track?._id || seed.track?.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SeedItem({ seed, onRemove }) {
  const track = seed.track;
  if (!track) return null;

  return (
    <div style={styles.item}>
      {track.albumArt
        ? <img src={track.albumArt} alt="" style={styles.art} />
        : <div style={styles.artPlaceholder}>🎵</div>
      }
      <div style={styles.info}>
        <span style={styles.trackName}>{track.title}</span>
        <span style={styles.artistName}>{track.artist}</span>
      </div>
      <button style={styles.removeBtn} onClick={onRemove} title="Remove seed">✕</button>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' },
  sub: { color: 'var(--text-secondary)', fontSize: '0.8rem' },
  count: {
    fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-primary)',
    background: 'rgba(168,85,247,0.1)', border: '1px solid var(--border-bright)',
    padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
  },
  error: { color: '#f87171', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' },
  loadingRow: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  skeleton: { height: '52px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)', animation: 'pulse 1.5s ease-in-out infinite' },
  empty: { textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' },
  emptyIcon: { fontSize: '2rem' },
  list: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  item: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-raised)', border: '1px solid var(--border)',
    transition: 'border-color var(--transition-fast)',
  },
  art: { width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 },
  artPlaceholder: { width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  trackName: { display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  artistName: { display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  removeBtn: { flexShrink: 0, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'color var(--transition-fast)' },
};
