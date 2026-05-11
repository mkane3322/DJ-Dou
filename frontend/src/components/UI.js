import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthCtx, usePlayerCtx, useTrackSearch } from '../lib';

// ══════════════════════════════════════════════════════════════════════════════
// SPINNER
// ══════════════════════════════════════════════════════════════════════════════
export function Spinner({ size = 36, fullPage = false }) {
  const el = (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '3px solid var(--bg-overlay)',
      borderTop: '3px solid var(--accent)',
      animation: 'spin 0.8s linear infinite',
      boxShadow: '0 0 12px rgba(168,85,247,0.3)',
    }} />
  );
  if (!fullPage) return <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>{el}</div>;
  return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>{el}</div>;
}

// ══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════
export function EmptyState({ icon='🎵', title, desc, action }) {
  return (
    <div style={{ textAlign:'center', padding:'4rem 1.5rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem' }}>
      <div style={{ fontSize:'2.5rem', filter:'drop-shadow(0 0 12px rgba(168,85,247,0.5))' }}>{icon}</div>
      {title && <h3 style={{ fontWeight:700, fontSize:'1.2rem' }}>{title}</h3>}
      {desc  && <p style={{ color:'var(--text-secondary)', maxWidth:'340px', lineHeight:1.6, fontSize:'0.9rem' }}>{desc}</p>}
      {action && (
        <button onClick={action.onClick} style={{ marginTop:'0.5rem', padding:'0.6rem 1.5rem', background:'linear-gradient(135deg,var(--accent),var(--accent-hot))', color:'#fff', borderRadius:'var(--radius-full)', fontFamily:'var(--font)', fontWeight:700, fontSize:'0.9rem', boxShadow:'0 0 20px rgba(168,85,247,0.3)' }}>
          {action.label}
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE BAR — single audio dimension progress bar
// ══════════════════════════════════════════════════════════════════════════════
export function FeatureBar({ meta, value = 0 }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.82rem' }}>
        <span>{meta.icon}</span>
        <span style={{ fontWeight:600 }}>{meta.label}</span>
        <span style={{ flex:1 }} />
        <span style={{ fontFamily:'var(--mono)', color:meta.color, fontWeight:600 }}>{Math.round(value*100)}%</span>
      </div>
      <div style={{ height:'5px', background:'var(--bg-overlay)', borderRadius:'99px', overflow:'hidden' }}>
        <div style={{
          height:'100%', width:`${value*100}%`,
          background:`linear-gradient(90deg,${meta.color}88,${meta.color})`,
          boxShadow:`0 0 8px ${meta.color}55`,
          borderRadius:'99px',
          transition:'width 0.8s var(--ease)',
        }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRACK SEARCH INPUT + DROPDOWN
// ══════════════════════════════════════════════════════════════════════════════
export function TrackSearchInput({ onSelect, seedIds = [], placeholder = 'Search for a track…' }) {
  const { query, results, loading, search, clear } = useTrackSearch();
  const { play, currentTrack, isPlaying } = usePlayerCtx();
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={{ position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'var(--bg-base)', border:'1px solid var(--border-bright)', borderRadius:'var(--radius)', padding:'0 12px' }}>
        <span style={{ color:'var(--text-muted)' }}>🔍</span>
        <input
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          style={{ flex:1, border:'none', background:'none', outline:'none', color:'var(--text-primary)', fontFamily:'var(--font)', fontSize:'0.9rem', padding:'0.75rem 0' }}
        />
        {query && <button onClick={clear} style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>✕</button>}
        {loading && <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid var(--bg-overlay)', borderTop:'2px solid var(--accent)', animation:'spin 0.7s linear infinite', flexShrink:0 }} />}
      </div>

      {focused && results.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:200, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', boxShadow:'0 20px 40px rgba(0,0,0,0.5)' }}>
          {results.map((track) => {
            const seeded  = seedIds.includes(track.spotifyId);
            const playing = isPlaying && currentTrack?.spotifyId === track.spotifyId;
            return (
              <div key={track.spotifyId} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ position:'relative', cursor:'pointer', flexShrink:0 }} onClick={() => track.previewUrl && play(track)}>
                  {track.albumArt
                    ? <img src={track.albumArt} alt="" style={{ width:40, height:40, borderRadius:'var(--radius-sm)', objectFit:'cover' }} />
                    : <div style={{ width:40, height:40, borderRadius:'var(--radius-sm)', background:'var(--bg-overlay)', display:'flex', alignItems:'center', justifyContent:'center' }}>🎵</div>
                  }
                  {track.previewUrl && (
                    <div style={{ position:'absolute', inset:0, borderRadius:'var(--radius-sm)', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', color:'#fff' }}>
                      {playing ? '⏸' : '▶'}
                    </div>
                  )}
                </div>
                <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => onSelect && onSelect(track)}>
                  <div style={{ fontWeight:600, fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track.title}</div>
                  <div style={{ color:'var(--text-secondary)', fontSize:'0.75rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track.artist}</div>
                </div>
                <button
                  onClick={() => !seeded && onSelect && onSelect(track)}
                  disabled={seeded}
                  style={{ padding:'0.2rem 0.7rem', border:'1px solid', borderRadius:'var(--radius-full)', fontSize:'0.72rem', fontFamily:'var(--mono)', fontWeight:600, cursor: seeded ? 'default' : 'pointer', background: seeded ? 'rgba(163,230,53,0.15)' : 'rgba(168,85,247,0.15)', color: seeded ? 'var(--accent-lime)' : 'var(--accent)', borderColor: seeded ? 'rgba(163,230,53,0.4)' : 'var(--border-bright)' }}
                >
                  {seeded ? '✓ Added' : '+ Add'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NAVBAR
// ══════════════════════════════════════════════════════════════════════════════
export function Navbar() {
  const { user, logout } = useAuthCtx();
  const navigate = useNavigate();

  return (
    <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(8,7,15,0.9)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', gap:'2rem' }}>
        <NavLink to="/" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'1.3rem', filter:'drop-shadow(0 0 8px rgba(168,85,247,0.8))' }}>🎵</span>
          <span style={{ fontWeight:800, fontSize:'1.1rem', letterSpacing:'-0.01em' }}>DJ Dou</span>
        </NavLink>

        <div style={{ display:'flex', gap:'1.5rem', flex:1 }}>
          {[['Dashboard','/dashboard'],['Discover','/discover']].map(([label, to]) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({ fontWeight:600, fontSize:'0.875rem', color: isActive ? 'var(--accent)' : 'var(--text-secondary)', transition:'color 150ms' })}>
              {label}
            </NavLink>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginLeft:'auto' }}>
          <div
            onClick={() => navigate('/profile')}
            style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent-hot))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.875rem', cursor:'pointer', overflow:'hidden' }}
          >
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : user?.displayName?.[0] || '?'
            }
          </div>
          <button onClick={logout} style={{ border:'1px solid var(--border)', color:'var(--text-muted)', fontFamily:'var(--mono)', fontSize:'0.7rem', padding:'0.3rem 0.75rem', borderRadius:'var(--radius-full)', cursor:'pointer' }}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MINI PLAYER — fixed bottom bar
// ══════════════════════════════════════════════════════════════════════════════
export function MiniPlayer() {
  const { currentTrack, isPlaying, progress, play, pause, seek } = usePlayerCtx();
  if (!currentTrack) return null;

  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, height:70, background:'rgba(8,7,15,0.95)', backdropFilter:'blur(20px)', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'1rem', padding:'0 1.5rem', zIndex:100 }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0 }}>
        {currentTrack.albumArt && <img src={currentTrack.albumArt} alt="" style={{ width:44, height:44, borderRadius:'var(--radius-sm)', objectFit:'cover', flexShrink:0 }} />}
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{currentTrack.title}</div>
          <div style={{ color:'var(--text-secondary)', fontSize:'0.75rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{currentTrack.artist}</div>
        </div>
      </div>

      <button onClick={() => isPlaying ? pause() : play(currentTrack)} style={{ width:40, height:40, borderRadius:'50%', background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', boxShadow:'0 0 16px rgba(168,85,247,0.4)', flexShrink:0 }}>
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div style={{ flex:1, display:'flex', alignItems:'center', gap:'10px' }}>
        <div
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width); }}
          style={{ flex:1, height:4, background:'var(--bg-overlay)', borderRadius:'2px', cursor:'pointer', position:'relative' }}
        >
          <div style={{ height:'100%', width:`${progress*100}%`, background:'var(--accent)', borderRadius:'2px', boxShadow:'0 0 6px var(--accent)', transition:'width 0.1s linear' }} />
        </div>
        <span style={{ fontFamily:'var(--mono)', fontSize:'0.65rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>30s preview</span>
      </div>

      {isPlaying && (
        <div style={{ display:'flex', alignItems:'center', gap:'2px', height:20, flexShrink:0 }}>
          {[0,0.15,0.3].map((d) => (
            <span key={d} style={{ width:3, height:16, background:'var(--accent)', borderRadius:'2px', display:'inline-block', transformOrigin:'center', animation:`waveBar 0.5s ${d}s ease-in-out infinite` }} />
          ))}
        </div>
      )}
    </div>
  );
}
