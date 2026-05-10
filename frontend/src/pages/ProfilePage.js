import React, { useRef } from 'react';
import { useAuthContext } from '../App';
import { useDNA } from '../hooks/useDNA';
import { userAPI } from '../utils/api';

export default function ProfilePage() {
  const { user, refetch } = useAuthContext();
  const { dna, computing, computeDNA } = useDNA();
  const fileRef = useRef();

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await userAPI.uploadAvatar(file);
      await refetch();
    } catch (err) {
      console.error('Avatar upload failed:', err);
    }
  };

  return (
    <div style={styles.page}>
      <div className="container" style={{ maxWidth: '700px' }}>
        <h1 style={styles.title} className="animate-fade-up">Profile</h1>

        {/* Avatar + Info */}
        <div style={styles.card} className="glass animate-fade-up-1">
          <div style={styles.avatarSection}>
            <div style={styles.avatarWrapper} onClick={() => fileRef.current?.click()}>
              {user?.avatar
                ? <img src={user.avatar} alt="Avatar" style={styles.avatar} />
                : <div style={styles.avatarPlaceholder}>{user?.displayName?.[0] || '?'}</div>
              }
              <div style={styles.avatarOverlay}>Edit</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            <div>
              <h2 style={styles.name}>{user?.displayName}</h2>
              <p style={styles.email}>{user?.email}</p>
              <span style={styles.spotifyBadge}>✓ Spotify Connected</span>
            </div>
          </div>
        </div>

        {/* DNA Status */}
        <div style={styles.card} className="glass animate-fade-up-2">
          <h3 style={styles.cardTitle}>SoundDNA Status</h3>
          {dna ? (
            <>
              <p style={styles.dnaStatus}>
                <span style={styles.dot} />
                DNA computed on {new Date(dna.dnaComputedAt).toLocaleDateString()}
              </p>
              <p style={styles.dnaSummaryText}>{dna.dnaSummary}</p>
              <button style={styles.recomputeBtn} onClick={computeDNA} disabled={computing}>
                {computing ? 'Recomputing...' : 'Recompute My DNA'}
              </button>
            </>
          ) : (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                Your SoundDNA hasn't been generated yet.
              </p>
              <button style={styles.recomputeBtn} onClick={computeDNA} disabled={computing}>
                {computing ? 'Computing...' : 'Generate My SoundDNA'}
              </button>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div style={styles.card} className="glass animate-fade-up-3">
          <h3 style={styles.cardTitle}>Account</h3>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Spotify ID</span>
            <span style={styles.infoValue}>{user?.spotifyId}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Member since</span>
            <span style={styles.infoValue}>{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' },
  title: { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-8)' },
  card: { padding: 'var(--space-6)', marginBottom: 'var(--space-4)' },
  cardTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--space-4)' },
  avatarSection: { display: 'flex', alignItems: 'center', gap: 'var(--space-6)' },
  avatarWrapper: { position: 'relative', cursor: 'pointer', flexShrink: 0 },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-bright)' },
  avatarPlaceholder: {
    width: '80px', height: '80px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hot))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2rem', fontWeight: 700, color: '#fff',
  },
  avatarOverlay: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 600, opacity: 0, transition: 'opacity var(--transition-fast)',
  },
  name: { fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 },
  email: { color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 'var(--space-1) 0 var(--space-2)' },
  spotifyBadge: { display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(29,185,84,0.15)', border: '1px solid rgba(29,185,84,0.4)', borderRadius: 'var(--radius-full)', color: '#1DB954', fontSize: '0.75rem', fontWeight: 600 },
  dnaStatus: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-lime)', boxShadow: '0 0 8px var(--accent-lime)', display: 'inline-block', flexShrink: 0 },
  dnaSummaryText: { color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-6)', fontSize: '0.9rem', fontStyle: 'italic' },
  recomputeBtn: { padding: 'var(--space-2) var(--space-6)', background: 'var(--bg-overlay)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius-full)', color: 'var(--accent-primary)', fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border)' },
  infoLabel: { color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' },
  infoValue: { color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' },
};
