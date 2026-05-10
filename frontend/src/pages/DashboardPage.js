import React, { useEffect } from 'react';
import { useAuthContext } from '../App';
import { useDNA } from '../hooks/useDNA';
import { useRecommendations } from '../hooks/useRecommendations';
import DNASummary from '../components/dna/DNASummary';
import DNABreakdown from '../components/dna/DNABreakdown';
import SeedsManager from '../components/dna/SeedsManager';
import RadarChart from '../components/dna/RadarChart';
import RecommendationCard from '../components/recommendations/RecommendationCard';
import EmptyState from '../components/shared/EmptyState';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { dna, loading: dnaLoading, computing, computeDNA } = useDNA();
  const { recommendations, loading: recsLoading, fetchRecommendations } = useRecommendations();

  useEffect(() => {
    if (dna) fetchRecommendations();
  }, [dna, fetchRecommendations]);

  return (
    <div style={styles.page}>
      <div className="container">
        <header style={styles.header} className="animate-fade-up">
          <div>
            <h1 style={styles.title}>
              Welcome back,{' '}
              <span style={styles.nameAccent}>
                {user?.displayName?.split(' ')[0] || 'listener'}
              </span>
            </h1>
            <p style={styles.sub}>Your musical fingerprint, decoded.</p>
          </div>
        </header>

        {dnaLoading ? (
          <LoadingSpinner />
        ) : !dna ? (
          <div style={styles.noDNAGrid}>
            <div style={styles.noDNACard} className="glass animate-fade-up-1">
              <div style={styles.noDNAIcon}>🧬</div>
              <h2 style={styles.noDNATitle}>Generate Your SoundDNA</h2>
              <p style={styles.noDNASub}>
                DJ Dou analyzes your Spotify listening history across 13 audio dimensions —
                energy, valence, tempo, acousticness, and 9 more — to build a unique fingerprint
                that powers all recommendations.
              </p>
              <button
                style={{ ...styles.computeBtn, opacity: computing ? 0.7 : 1 }}
                onClick={computeDNA}
                disabled={computing}
              >
                {computing ? 'Analyzing your music…' : 'Generate My SoundDNA'}
              </button>
            </div>
            <div className="glass animate-fade-up-2" style={styles.seedsPanel}>
              <p style={styles.seedsHint}>Add seed tracks to help shape your DNA.</p>
              <SeedsManager />
            </div>
          </div>
        ) : (
          <>
            <div style={styles.dnaGrid} className="animate-fade-up-1">
              <div style={styles.chartCard} className="glass">
                <h2 style={styles.sectionTitle}>SoundDNA Radar</h2>
                <RadarChart data={dna.chartData} size={300} />
              </div>
              <DNASummary
                summary={dna.dnaSummary}
                computedAt={dna.dnaComputedAt}
                onRecompute={computeDNA}
                computing={computing}
              />
            </div>

            <div style={styles.breakdownCard} className="glass animate-fade-up-2">
              <DNABreakdown dnaVector={dna.dnaVector} title="All 13 Dimensions" />
            </div>

            <div style={styles.seedsCard} className="glass animate-fade-up-3">
              <SeedsManager />
            </div>

            <section style={styles.recsSection} className="animate-fade-up-4">
              <div style={styles.recHeader}>
                <h2 style={styles.sectionTitle}>Recommended For You</h2>
                <button
                  style={styles.refreshBtn}
                  onClick={() => fetchRecommendations(true)}
                  disabled={recsLoading}
                >
                  {recsLoading ? '…' : '↻ Refresh'}
                </button>
              </div>
              {recsLoading ? (
                <LoadingSpinner />
              ) : recommendations.length === 0 ? (
                <EmptyState
                  icon="🎯"
                  title="No recommendations yet"
                  desc="Your catalog is still being indexed. Check back in a few minutes."
                  action={{ label: 'Try again', onClick: () => fetchRecommendations(true) }}
                />
              ) : (
                <div style={styles.recsGrid}>
                  {recommendations.map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' },
  header: { marginBottom: 'var(--space-8)' },
  title: { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' },
  nameAccent: { background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hot))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sub: { color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 'var(--space-1)' },
  noDNAGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'start' },
  noDNACard: { padding: 'var(--space-10) var(--space-8)', textAlign: 'center' },
  noDNAIcon: { fontSize: '3rem', marginBottom: 'var(--space-4)' },
  noDNATitle: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' },
  noDNASub: { color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-8)', fontSize: '0.9rem' },
  computeBtn: {
    padding: 'var(--space-3) var(--space-8)',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hot))',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
    cursor: 'pointer', boxShadow: '0 0 30px rgba(168,85,247,0.35)',
  },
  seedsPanel: { padding: 'var(--space-6)' },
  seedsHint: { color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-4)' },
  dnaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-4)', alignItems: 'start' },
  chartCard: { padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-4)' },
  breakdownCard: { padding: 'var(--space-6)', marginBottom: 'var(--space-4)' },
  seedsCard: { padding: 'var(--space-6)', marginBottom: 'var(--space-8)' },
  recsSection: { marginTop: 'var(--space-4)' },
  recHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' },
  refreshBtn: { fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-primary)', cursor: 'pointer', background: 'none', border: '1px solid var(--border)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)' },
  recsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' },
};
