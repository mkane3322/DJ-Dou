import React from 'react';
import { useRecommendations } from '../hooks/useRecommendations';
import MoodSearch from '../components/recommendations/MoodSearch';
import RecommendationCard from '../components/recommendations/RecommendationCard';
import EmptyState from '../components/shared/EmptyState';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function DiscoverPage() {
  const { moodResults, moodLoading, searchByMood } = useRecommendations();

  return (
    <div style={styles.page}>
      <div className="container">
        <header style={styles.header} className="animate-fade-up">
          <h1 style={styles.title}>Discover</h1>
          <p style={styles.sub}>
            Describe how you want to feel. Claude parses your mood into audio feature filters,
            then matches tracks to your SoundDNA.
          </p>
        </header>

        <div style={styles.searchCard} className="glass animate-fade-up-1">
          <MoodSearch onSearch={searchByMood} loading={moodLoading} />
        </div>

        {moodLoading && <LoadingSpinner message="Claude is parsing your mood…" />}

        {moodResults && !moodLoading && (
          <div className="animate-fade-up">
            {moodResults.parsedFilters && Object.keys(moodResults.parsedFilters).length > 0 && (
              <div style={styles.filterRow}>
                <span style={styles.filterLabel}>✦ Audio filters applied:</span>
                {Object.entries(moodResults.parsedFilters).map(([k, [min, max]]) => (
                  <span key={k} style={styles.filterBadge}>
                    {k} {Math.round(min * 100)}–{Math.round(max * 100)}%
                  </span>
                ))}
              </div>
            )}

            {moodResults.message ? (
              <EmptyState icon="🔍" title="No matches found" desc={moodResults.message} />
            ) : (
              <>
                <h2 style={styles.resultsHeading}>
                  {(moodResults.results || []).length} tracks found
                </h2>
                <div style={styles.grid}>
                  {(moodResults.results || []).map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!moodResults && !moodLoading && (
          <EmptyState
            icon="🌙"
            title="What's your mood?"
            desc="Type a description above — or pick a preset — and we'll find tracks that match both your vibe and your SoundDNA."
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' },
  header: { marginBottom: 'var(--space-8)' },
  title: { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' },
  sub: { color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.7, fontSize: '0.9rem' },
  searchCard: { padding: 'var(--space-6)', marginBottom: 'var(--space-8)' },
  filterRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' },
  filterLabel: { color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.05em' },
  filterBadge: {
    padding: '0.2rem 0.6rem',
    background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)',
    borderRadius: 'var(--radius-full)', color: 'var(--accent-cyan)',
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
  },
  resultsHeading: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' },
};
