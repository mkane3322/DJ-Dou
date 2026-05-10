import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../App';

export default function HomePage() {
  const { user, login } = useAuthContext();
  const navigate = useNavigate();

  const handleCTA = () => user ? navigate('/dashboard') : login();

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <span style={styles.badge} className="animate-fade-up">✦ SoundDNA Technology</span>
        <h1 style={styles.headline} className="animate-fade-up-1">
          Your music has<br />
          <span style={styles.gradient}>a fingerprint.</span>
        </h1>
        <p style={styles.sub} className="animate-fade-up-2">
          DJ Dou analyzes 13 audio dimensions from your Spotify history to generate
          a unique SoundDNA — powering recommendations that actually sound like you.
        </p>
        <button style={styles.cta} className="animate-fade-up-3" onClick={handleCTA}>
          {user ? 'Go to Dashboard' : 'Discover Your SoundDNA'}
        </button>

        <div style={styles.featureGrid} className="animate-fade-up-4">
          {FEATURES.map((f) => (
            <div key={f.title} style={styles.featureCard} className="glass">
              <div style={styles.featureIcon}>{f.icon}</div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={styles.orb1} />
      <div style={styles.orb2} />
    </div>
  );
}

const FEATURES = [
  { icon: '🧬', title: 'SoundDNA Profile', desc: '13-dimension audio fingerprint built from your top Spotify tracks across all time ranges.' },
  { icon: '🤖', title: 'AI Summary', desc: 'Claude writes a plain-English portrait of your musical identity — like a horoscope for your taste.' },
  { icon: '🎯', title: 'Smart Recs', desc: 'Cosine similarity matching finds tracks that genuinely align with your audio fingerprint.' },
  { icon: '🌙', title: 'Mood Search', desc: 'Type "melancholic and slow" and AI parses it into audio feature ranges to find the perfect track.' },
];

const styles = {
  page: { minHeight: '100vh', position: 'relative', overflow: 'hidden', padding: 'var(--space-8) var(--space-6)' },
  hero: { maxWidth: '900px', margin: '0 auto', paddingTop: '10vh', textAlign: 'center', position: 'relative', zIndex: 1 },
  badge: {
    display: 'inline-block',
    padding: '0.35rem 1rem',
    background: 'rgba(168,85,247,0.15)',
    border: '1px solid var(--border-bright)',
    borderRadius: 'var(--radius-full)',
    color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 'var(--space-6)',
  },
  headline: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.5rem, 7vw, 5rem)',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    marginBottom: 'var(--space-6)',
  },
  gradient: {
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hot))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  sub: {
    maxWidth: '560px',
    margin: '0 auto var(--space-8)',
    color: 'var(--text-secondary)',
    fontSize: '1.1rem',
    lineHeight: 1.7,
  },
  cta: {
    padding: 'var(--space-4) var(--space-8)',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hot))',
    color: '#fff',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '1.05rem',
    cursor: 'pointer',
    border: 'none',
    marginBottom: 'var(--space-16)',
    boxShadow: '0 0 40px rgba(168,85,247,0.4)',
    transition: 'transform var(--transition-fast)',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--space-4)',
    textAlign: 'left',
  },
  featureCard: { padding: 'var(--space-6)' },
  featureIcon: { fontSize: '1.5rem', marginBottom: 'var(--space-3)' },
  featureTitle: { fontWeight: 700, marginBottom: 'var(--space-2)', fontSize: '1rem' },
  featureDesc: { color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 },
  orb1: { position: 'fixed', width: '600px', height: '600px', borderRadius: '50%', background: 'rgba(168,85,247,0.08)', top: '-20%', right: '-15%', filter: 'blur(100px)', pointerEvents: 'none' },
  orb2: { position: 'fixed', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(244,114,182,0.06)', bottom: '-15%', left: '-10%', filter: 'blur(100px)', pointerEvents: 'none' },
};
