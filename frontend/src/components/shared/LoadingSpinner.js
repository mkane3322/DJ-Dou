import React from 'react';

export default function LoadingSpinner({ fullPage = false, message = '' }) {
  const wrapper = fullPage ? styles.fullPage : styles.inline;

  return (
    <div style={wrapper}>
      <div style={styles.spinner} />
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  fullPage: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' },
  inline: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)' },
  spinner: {
    width: '40px', height: '40px',
    borderRadius: '50%',
    border: '3px solid var(--bg-overlay)',
    borderTop: '3px solid var(--accent-primary)',
    animation: 'spin 0.8s linear infinite',
    boxShadow: '0 0 15px rgba(168,85,247,0.3)',
  },
  message: { color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.05em' },
};
