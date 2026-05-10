import React, { useState, useCallback, useRef } from 'react';
import { tracksAPI } from '../../utils/api';
import { formatDuration, truncate } from '../../utils/spotifyHelpers';
import { usePlayerContext } from '../../App';

/**
 * A full-featured track search input with live results.
 *
 * Props:
 *   onAddSeed   {function}  — called with a track object when user hits "Add"
 *   seedIds     {string[]}  — array of spotifyIds already seeded (to show "Added" state)
 *   placeholder {string}
 */
export default function TrackSearch({ onAddSeed, seedIds = [], placeholder = 'Search for a track…' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef(null);
  const { play, currentTrack, isPlaying } = usePlayerContext();

  const search = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await tracksAPI.search(q, 8);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const handleChange = (e) => {
    setQuery(e.target.value);
    search(e.target.value);
  };

  const handleSelect = (track) => {
    if (onAddSeed) onAddSeed(track);
  };

  const handlePreview = (e, track) => {
    e.stopPropagation();
    if (track.previewUrl) play(track);
  };

  const clear = () => { setQuery(''); setResults([]); };

  const isThisPlaying = (track) =>
    isPlaying && currentTrack?.spotifyId === track.spotifyId;

  return (
    <div style={styles.wrapper}>
      {/* Input */}
      <div style={{ ...styles.inputWrapper, borderColor: focused ? 'var(--border-bright)' : 'var(--border)' }}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          style={styles.input}
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
        />
        {query && (
          <button style={styles.clearBtn} onClick={clear}>✕</button>
        )}
        {loading && <span style={styles.spinner} />}
      </div>

      {/* Results dropdown */}
      {focused && results.length > 0 && (
        <div style={styles.dropdown}>
          {results.map((track) => {
            const isSeeded = seedIds.includes(track.spotifyId);
            const playing = isThisPlaying(track);
            return (
              <div key={track.spotifyId} style={styles.result}>
                {/* Album art + preview toggle */}
                <div
                  style={styles.artWrapper}
                  onClick={(e) => handlePreview(e, track)}
                  title={track.previewUrl ? 'Preview 30s' : 'No preview available'}
                >
                  {track.albumArt
                    ? <img src={track.albumArt} alt="" style={styles.art} />
                    : <div style={styles.artPlaceholder}>🎵</div>
                  }
                  {track.previewUrl && (
                    <div style={styles.playOverlay}>
                      {playing ? '⏸' : '▶'}
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div style={styles.info} onClick={() => handleSelect(track)}>
                  <span style={styles.trackName}>{truncate(track.title, 36)}</span>
                  <span style={styles.artistName}>{truncate(track.artist, 32)}</span>
                </div>

                {/* Add / Added button */}
                <button
                  style={{
                    ...styles.addBtn,
                    background: isSeeded ? 'rgba(163,230,53,0.15)' : 'rgba(168,85,247,0.15)',
                    color: isSeeded ? 'var(--accent-lime)' : 'var(--accent-primary)',
                    borderColor: isSeeded ? 'rgba(163,230,53,0.4)' : 'var(--border-bright)',
                    cursor: isSeeded ? 'default' : 'pointer',
                  }}
                  onClick={() => !isSeeded && handleSelect(track)}
                  disabled={isSeeded}
                >
                  {isSeeded ? '✓ Added' : '+ Add'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {focused && query && !loading && results.length === 0 && (
        <div style={styles.empty}>No results for "{query}"</div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', width: '100%' },
  inputWrapper: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    background: 'var(--bg-base)', border: '1px solid', borderRadius: 'var(--radius-md)',
    padding: '0 var(--space-3)', transition: 'border-color var(--transition-fast)',
  },
  searchIcon: { fontSize: '0.9rem', flexShrink: 0 },
  input: {
    flex: 1, padding: 'var(--space-3) 0',
    background: 'none', border: 'none', outline: 'none',
    color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '0.9rem',
  },
  clearBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', padding: '4px' },
  spinner: {
    width: '14px', height: '14px', borderRadius: '50%',
    border: '2px solid var(--bg-overlay)', borderTop: '2px solid var(--accent-primary)',
    animation: 'spin 0.7s linear infinite', flexShrink: 0,
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
  },
  result: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--border)',
    transition: 'background var(--transition-fast)',
  },
  artWrapper: { position: 'relative', flexShrink: 0, cursor: 'pointer' },
  art: { width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' },
  artPlaceholder: { width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' },
  playOverlay: {
    position: 'absolute', inset: 0, borderRadius: 'var(--radius-sm)',
    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', opacity: 0, transition: 'opacity var(--transition-fast)', color: '#fff',
  },
  info: { flex: 1, minWidth: 0, cursor: 'pointer' },
  trackName: { display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  artistName: { display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  addBtn: {
    flexShrink: 0, padding: '0.25rem 0.75rem', border: '1px solid', borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 600,
    transition: 'all var(--transition-fast)',
  },
  empty: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, padding: 'var(--space-4)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textAlign: 'center' },
};
