import React from 'react';

/**
 * User avatar — shows image if available, falls back to initials.
 *
 * Props:
 *   src      {string}   — image URL
 *   name     {string}   — display name (used for initials fallback)
 *   size     {number}   — diameter in px (default 40)
 *   onClick  {function}
 *   border   {boolean}  — show accent border (default false)
 */
export default function Avatar({ src, name = '?', size = 40, onClick, border = false }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const fontSize = Math.round(size * 0.38);

  const base = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    flexShrink: 0,
    cursor: onClick ? 'pointer' : 'default',
    border: border ? '2px solid var(--accent-primary)' : '2px solid transparent',
    boxShadow: border ? '0 0 0 1px var(--border)' : 'none',
    transition: 'border-color 150ms ease',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ ...base, objectFit: 'cover' }}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      style={{
        ...base,
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hot))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: `${fontSize}px`,
        userSelect: 'none',
      }}
      onClick={onClick}
    >
      {initial}
    </div>
  );
}
