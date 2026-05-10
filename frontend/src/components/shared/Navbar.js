import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../App';

export default function Navbar() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <NavLink to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🎵</span>
          <span style={styles.logoText}>DJ Dou</span>
        </NavLink>

        <div style={styles.links}>
          {[
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/discover', label: 'Discover' },
            { to: '/profile', label: 'Profile' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                ...styles.link,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div style={styles.right}>
          {user?.avatar
            ? <img src={user.avatar} alt="" style={styles.avatar} onClick={() => navigate('/profile')} />
            : <div style={styles.avatarInitial} onClick={() => navigate('/profile')}>{user?.displayName?.[0]}</div>
          }
          <button style={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 50,
    background: 'rgba(8,7,15,0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
  },
  inner: {
    maxWidth: '1200px', margin: '0 auto',
    padding: '0 var(--space-6)',
    height: '60px',
    display: 'flex', alignItems: 'center', gap: 'var(--space-8)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none' },
  logoIcon: { fontSize: '1.3rem', filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.8))' },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em', color: 'var(--text-primary)' },
  links: { display: 'flex', gap: 'var(--space-6)', flex: 1 },
  link: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', transition: 'color var(--transition-fast)', textDecoration: 'none' },
  right: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginLeft: 'auto' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid var(--border-bright)' },
  avatarInitial: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hot))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' },
  logoutBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)', cursor: 'pointer', transition: 'color var(--transition-fast)' },
};
