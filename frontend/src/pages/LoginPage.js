import React from 'react';
import { useAuthContext } from '../App';

export default function LoginPage() {
  const { login } = useAuthContext();

  return (
    <div style={styles.page}>
      <div style={styles.card} className="glass animate-fade-up">
        <div style={styles.logo}>🎵</div>
        <h1 style={styles.title}>DJ Dou</h1>
        <p style={styles.tagline}>Your music has a fingerprint.</p>
        <p style={styles.sub}>
          Connect your Spotify to generate your <strong style={{ color: 'var(--accent-primary)' }}>SoundDNA</strong> —
          a 13-dimension audio fingerprint that powers hyper-accurate recommendations.
        </p>

        <button style={styles.spotifyBtn} onClick={login}>
          <SpotifyIcon />
          Continue with Spotify
        </button>

        <div style={styles.features}>
          {['13-dimension audio fingerprint', 'AI-powered music summary', 'Mood-based search'].map((f) => (
            <div key={f} style={styles.feature}>
              <span style={styles.dot} />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Background orbs */}
      <div style={{ ...styles.orb, ...styles.orb1 }} />
      <div style={{ ...styles.orb, ...styles.orb2 }} />
    </div>
  );
}

function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-6)',
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: 'var(--space-12) var(--space-8)',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
  },
  logo: {
    fontSize: '3rem',
    marginBottom: 'var(--space-4)',
    filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.8))',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.5rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: 'var(--space-2)',
    background: 'linear-gradient(135deg, #f1eeff 0%, var(--accent-primary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  tagline: {
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 'var(--space-6)',
  },
  sub: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.7,
    marginBottom: 'var(--space-8)',
  },
  spotifyBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-3)',
    width: '100%',
    padding: 'var(--space-4) var(--space-6)',
    background: '#1DB954',
    color: '#000',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
    border: 'none',
    marginBottom: 'var(--space-8)',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    textAlign: 'left',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    flexShrink: 0,
    boxShadow: '0 0 8px var(--accent-primary)',
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  orb1: {
    width: '400px', height: '400px',
    background: 'rgba(168,85,247,0.15)',
    top: '-10%', right: '-10%',
  },
  orb2: {
    width: '300px', height: '300px',
    background: 'rgba(244,114,182,0.1)',
    bottom: '-5%', left: '-5%',
  },
};
