import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

/**
 * Wrap your app (or a section) with <ToastProvider> to enable toasts.
 * Then call const { toast } = useToast() anywhere inside.
 *
 * toast('Message')
 * toast('Message', 'error')
 * toast('Message', 'success')
 * toast('Message', 'info')
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={styles.container}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ ...styles.toast, ...typeStyles[t.type] }}
            onClick={() => dismiss(t.id)}
          >
            <span style={styles.icon}>{typeIcons[t.type]}</span>
            <span style={styles.message}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const typeIcons = { info: 'ℹ', success: '✓', error: '✕', warning: '⚠' };

const typeStyles = {
  info:    { borderColor: 'rgba(168,85,247,0.5)',  background: 'rgba(168,85,247,0.1)' },
  success: { borderColor: 'rgba(163,230,53,0.5)',  background: 'rgba(163,230,53,0.1)' },
  error:   { borderColor: 'rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.1)' },
  warning: { borderColor: 'rgba(251,191,36,0.5)',  background: 'rgba(251,191,36,0.1)' },
};

const styles = {
  container: {
    position: 'fixed', bottom: '90px', right: '24px',
    display: 'flex', flexDirection: 'column', gap: '8px',
    zIndex: 999, maxWidth: '320px',
  },
  toast: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 16px', borderRadius: '10px', border: '1px solid',
    backdropFilter: 'blur(20px)',
    fontFamily: "'Syne', sans-serif", fontSize: '0.875rem',
    color: 'var(--text-primary)', cursor: 'pointer',
    animation: 'fadeUp 0.3s ease both',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  },
  icon: { fontSize: '0.9rem', flexShrink: 0 },
  message: { flex: 1 },
};
