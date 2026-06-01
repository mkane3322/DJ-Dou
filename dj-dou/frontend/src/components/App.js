import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation, useSearchParams,
} from 'react-router-dom';
import {
  AuthCtx, PlayerCtx, useAuth, usePlayer,
  useAuthState, usePlayerState, useDNA, useRecs, useSearch,
  FEATURES, matchColor, BASE,
} from '../lib';
import api from '../lib';
import '../styles/global.css';

// ══════════════════════════════════════════════════════════════════════════════
// SMALL SHARED UI
// ══════════════════════════════════════════════════════════════════════════════
function Spinner({ full }) {
  const el = <div style={{ width:36,height:36,borderRadius:'50%',border:'3px solid var(--overlay)',borderTop:'3px solid var(--accent)',animation:'spin .8s linear infinite',boxShadow:'0 0 12px rgba(168,85,247,.3)' }} />;
  if (!full) return <div style={{ display:'flex',justifyContent:'center',padding:'3rem' }}>{el}</div>;
  return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center' }}>{el}</div>;
}

function Empty({ icon='🎵', title, desc, action }) {
  return (
    <div style={{ textAlign:'center',padding:'4rem 1.5rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'.75rem' }}>
      <div style={{ fontSize:'2.5rem',filter:'drop-shadow(0 0 12px rgba(168,85,247,.5))' }}>{icon}</div>
      {title && <h3 style={{ fontWeight:700,fontSize:'1.2rem' }}>{title}</h3>}
      {desc  && <p style={{ color:'var(--muted)',maxWidth:'340px',lineHeight:1.6,fontSize:'.9rem' }}>{desc}</p>}
      {action && <button onClick={action.fn} style={{ marginTop:'.5rem',padding:'.6rem 1.5rem',background:'linear-gradient(135deg,var(--accent),var(--hot))',color:'#fff',borderRadius:'var(--rfull)',fontFamily:'var(--font)',fontWeight:700,fontSize:'.9rem',boxShadow:'0 0 20px rgba(168,85,247,.3)' }}>{action.label}</button>}
    </div>
  );
}

function Bar({ meta, value=0 }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
      <div style={{ display:'flex',alignItems:'center',gap:6,fontSize:'.82rem' }}>
        <span>{meta.icon}</span>
        <span style={{ fontWeight:600 }}>{meta.label}</span>
        <span style={{ flex:1 }} />
        <span style={{ fontFamily:'var(--mono)',color:meta.color,fontWeight:600 }}>{Math.round(value*100)}%</span>
      </div>
      <div style={{ height:5,background:'var(--overlay)',borderRadius:99,overflow:'hidden' }}>
        <div style={{ height:'100%',width:`${value*100}%`,background:`linear-gradient(90deg,${meta.color}88,${meta.color})`,boxShadow:`0 0 8px ${meta.color}55`,borderRadius:99,transition:'width .8s var(--ease)' }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RADAR CHART (D3)
// ══════════════════════════════════════════════════════════════════════════════
function RadarChart({ data=[], size=290 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!data.length || !ref.current) return;
    const svg   = d3.select(ref.current);
    svg.selectAll('*').remove();
    const m = 46, r = size/2 - m, cx = size/2;
    const total = data.length, slice = (Math.PI*2)/total;
    const rs = d3.scaleLinear().range([0,r]).domain([0,1]);
    const g  = svg.attr('width',size).attr('height',size).append('g').attr('transform',`translate(${cx},${cx})`);
    const defs = svg.append('defs');
    const flt  = defs.append('filter').attr('id','glow');
    flt.append('feGaussianBlur').attr('stdDeviation','4').attr('result','cb');
    const fm = flt.append('feMerge');
    fm.append('feMergeNode').attr('in','cb');
    fm.append('feMergeNode').attr('in','SourceGraphic');
    for (let l=1;l<=5;l++) g.append('circle').attr('r',(r/5)*l).attr('fill','none').attr('stroke','rgba(168,85,247,.1)').attr('stroke-width',1);
    data.forEach((d,i) => {
      const a = slice*i - Math.PI/2;
      g.append('line').attr('x1',0).attr('y1',0).attr('x2',rs(1)*Math.cos(a)).attr('y2',rs(1)*Math.sin(a)).attr('stroke','rgba(168,85,247,.2)').attr('stroke-width',1);
      g.append('text').attr('x',(r+22)*Math.cos(a)).attr('y',(r+22)*Math.sin(a)).attr('text-anchor','middle').attr('dominant-baseline','middle').attr('fill','#9d8fc4').attr('font-size','11px').attr('font-family',"'Syne',sans-serif").attr('font-weight','600').text(d.axis);
    });
    const line = d3.lineRadial().radius(d=>rs(d.value)).angle((_,i)=>i*slice).curve(d3.curveLinearClosed);
    const blob = g.append('g');
    blob.append('path').datum(data).attr('d',line).attr('fill','rgba(168,85,247,.18)').attr('stroke','none');
    blob.append('path').datum(data).attr('d',line).attr('fill','none').attr('stroke','#a855f7').attr('stroke-width',2).attr('filter','url(#glow)');
    data.forEach((d,i) => {
      const a = slice*i - Math.PI/2;
      g.append('circle').attr('cx',rs(d.value)*Math.cos(a)).attr('cy',rs(d.value)*Math.sin(a)).attr('r',4).attr('fill','#a855f7').attr('stroke','#f1eeff').attr('stroke-width',1.5).attr('filter','url(#glow)');
    });
  }, [data, size]);
  return <div style={{ display:'flex',justifyContent:'center' }}><svg ref={ref} /></div>;
}

// ══════════════════════════════════════════════════════════════════════════════
// TRACK SEARCH INPUT
// ══════════════════════════════════════════════════════════════════════════════
function TrackSearch({ onSelect, placeholder='Search tracks…' }) {
  const { query, results, loading, search, clear } = useSearch();
  const { play, track: ct, playing } = usePlayer();
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position:'relative' }}>
      <div style={{ display:'flex',alignItems:'center',gap:8,background:'var(--bg)',border:'1px solid var(--borderbr)',borderRadius:'var(--r)',padding:'0 12px' }}>
        <span style={{ color:'var(--dim)' }}>🔍</span>
        <input value={query} onChange={e=>search(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setTimeout(()=>setFocused(false),200)} placeholder={placeholder}
          style={{ flex:1,border:'none',background:'none',outline:'none',color:'var(--text)',fontFamily:'var(--font)',fontSize:'.9rem',padding:'.75rem 0' }} />
        {query && <button onClick={clear} style={{ color:'var(--dim)',fontSize:'.75rem' }}>✕</button>}
        {loading && <div style={{ width:14,height:14,borderRadius:'50%',border:'2px solid var(--overlay)',borderTop:'2px solid var(--accent)',animation:'spin .7s linear infinite',flexShrink:0 }} />}
      </div>
      {focused && results.length>0 && (
        <div style={{ position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:200,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden',boxShadow:'0 20px 40px rgba(0,0,0,.5)' }}>
          {results.map(t => {
            const isPlaying = playing && ct?.spotifyId===t.spotifyId;
            return (
              <div key={t.spotifyId} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:'1px solid var(--border)' }}>
                <div style={{ position:'relative',cursor:'pointer',flexShrink:0 }} onClick={()=>t.previewUrl&&play(t)}>
                  {t.albumArt ? <img src={t.albumArt} alt="" style={{ width:40,height:40,borderRadius:'var(--rsm)',objectFit:'cover' }} />
                    : <div style={{ width:40,height:40,borderRadius:'var(--rsm)',background:'var(--overlay)',display:'flex',alignItems:'center',justifyContent:'center' }}>🎵</div>}
                  {t.previewUrl && <div style={{ position:'absolute',inset:0,borderRadius:'var(--rsm)',background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',color:'#fff' }}>{isPlaying?'⏸':'▶'}</div>}
                </div>
                <div style={{ flex:1,minWidth:0,cursor:'pointer' }} onClick={()=>onSelect&&onSelect(t)}>
                  <div style={{ fontWeight:600,fontSize:'.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.title}</div>
                  <div style={{ color:'var(--muted)',fontSize:'.75rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.artist}</div>
                </div>
                {onSelect && <button onClick={()=>onSelect(t)} style={{ padding:'.2rem .7rem',border:'1px solid var(--borderbr)',borderRadius:'var(--rfull)',fontSize:'.72rem',fontFamily:'var(--mono)',fontWeight:600,color:'var(--accent)',background:'rgba(168,85,247,.15)',cursor:'pointer' }}>+ Add</button>}
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
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <nav style={{ position:'sticky',top:0,zIndex:50,background:'rgba(8,7,15,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'0 1.5rem',height:60,display:'flex',alignItems:'center',gap:'2rem' }}>
        <NavLink to="/" style={{ display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ fontSize:'1.3rem',filter:'drop-shadow(0 0 8px rgba(168,85,247,.8))' }}>🎵</span>
          <span style={{ fontWeight:800,fontSize:'1.1rem',letterSpacing:'-.01em' }}>DJ Dou</span>
        </NavLink>
        <div style={{ display:'flex',gap:'1.5rem',flex:1 }}>
          {[['Dashboard','/dashboard'],['Discover','/discover']].map(([l,to])=>(
            <NavLink key={to} to={to} style={({isActive})=>({ fontWeight:600,fontSize:'.875rem',color:isActive?'var(--accent)':'var(--muted)',transition:'color 150ms' })}>{l}</NavLink>
          ))}
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:12,marginLeft:'auto' }}>
          <div onClick={()=>navigate('/profile')} style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),var(--hot))',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'.875rem',cursor:'pointer',overflow:'hidden' }}>
            {user?.avatar?<img src={user.avatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />:user?.displayName?.[0]||'?'}
          </div>
          <button onClick={logout} style={{ border:'1px solid var(--border)',color:'var(--dim)',fontFamily:'var(--mono)',fontSize:'.7rem',padding:'.3rem .75rem',borderRadius:'var(--rfull)',cursor:'pointer' }}>Sign out</button>
        </div>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MINI PLAYER
// ══════════════════════════════════════════════════════════════════════════════
function MiniPlayer() {
  const { track, playing, progress, play, pause, seek } = usePlayer();
  if (!track) return null;
  return (
    <div style={{ position:'fixed',bottom:0,left:0,right:0,height:70,background:'rgba(8,7,15,.97)',backdropFilter:'blur(20px)',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'1rem',padding:'0 1.5rem',zIndex:100 }}>
      <div style={{ display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0 }}>
        {track.albumArt && <img src={track.albumArt} alt="" style={{ width:44,height:44,borderRadius:'var(--rsm)',objectFit:'cover',flexShrink:0 }} />}
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:700,fontSize:'.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{track.title}</div>
          <div style={{ color:'var(--muted)',fontSize:'.75rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{track.artist}</div>
        </div>
      </div>
      <button onClick={()=>playing?pause():play(track)} style={{ width:40,height:40,borderRadius:'50%',background:'var(--accent)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',boxShadow:'0 0 16px rgba(168,85,247,.4)',flexShrink:0 }}>{playing?'⏸':'▶'}</button>
      <div style={{ flex:1,display:'flex',alignItems:'center',gap:10 }}>
        <div onClick={e=>{const r=e.currentTarget.getBoundingClientRect();seek((e.clientX-r.left)/r.width);}} style={{ flex:1,height:4,background:'var(--overlay)',borderRadius:2,cursor:'pointer' }}>
          <div style={{ height:'100%',width:`${progress*100}%`,background:'var(--accent)',borderRadius:2,boxShadow:'0 0 6px var(--accent)',transition:'width .1s linear' }} />
        </div>
        <span style={{ fontFamily:'var(--mono)',fontSize:'.65rem',color:'var(--dim)',whiteSpace:'nowrap' }}>30s preview</span>
      </div>
      {playing && (
        <div style={{ display:'flex',alignItems:'center',gap:2,height:20,flexShrink:0 }}>
          {[0,.15,.3].map(d=><span key={d} style={{ width:3,height:16,background:'var(--accent)',borderRadius:2,display:'inline-block',transformOrigin:'center',animation:`wave .5s ${d}s ease-in-out infinite` }} />)}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATION CARD
// ══════════════════════════════════════════════════════════════════════════════
function RecCard({ rec }) {
  const { track, matchPercent, similarityScore } = rec;
  const { play, track: ct, playing } = usePlayer();
  const isPlaying = playing && ct?.spotifyId===track.spotifyId;
  const color = matchColor(similarityScore);
  const log = (action) => api.post('/interactions', { trackId: track.id, action }).catch(()=>{});
  return (
    <div className="glass" style={{ display:'flex',gap:12,padding:14 }}>
      <div style={{ position:'relative',flexShrink:0,cursor:track.previewUrl?'pointer':'default' }} onClick={()=>track.previewUrl&&play(track)}>
        {track.albumArt
          ? <img src={track.albumArt} alt={track.title} style={{ width:80,height:80,borderRadius:'var(--rsm)',objectFit:'cover' }} />
          : <div style={{ width:80,height:80,borderRadius:'var(--rsm)',background:'var(--overlay)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem' }}>🎵</div>}
        {track.previewUrl && <div style={{ position:'absolute',inset:0,borderRadius:'var(--rsm)',background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',color:'#fff',opacity:isPlaying?1:0,transition:'opacity 150ms' }}>{isPlaying?'⏸':'▶'}</div>}
        {isPlaying && <div style={{ position:'absolute',bottom:5,left:'50%',transform:'translateX(-50%)',display:'flex',gap:2,alignItems:'flex-end' }}>
          {[0,.15,.3].map(d=><span key={d} style={{ width:3,height:12,background:'var(--accent)',borderRadius:2,display:'inline-block',transformOrigin:'bottom',animation:`wave .5s ${d}s ease-in-out infinite` }} />)}
        </div>}
      </div>
      <div style={{ flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:3 }}>
        <span style={{ padding:'.12rem .5rem',fontSize:'.68rem',fontFamily:'var(--mono)',fontWeight:600,background:`${color}22`,border:`1px solid ${color}55`,borderRadius:'var(--rfull)',color,alignSelf:'flex-start' }}>{matchPercent}% match</span>
        <div style={{ fontWeight:700,fontSize:'.95rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{track.title}</div>
        <div style={{ color:'var(--muted)',fontSize:'.8rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{track.artist}</div>
        <div style={{ display:'flex',gap:6,marginTop:'auto',paddingTop:4 }}>
          {[['♥','liked'],['✕','skipped'],['＋','saved']].map(([icon,action])=>(
            <button key={action} onClick={()=>log(action)} title={action} style={{ width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--overlay)',border:'1px solid var(--border)',borderRadius:'var(--rsm)',color:'var(--muted)',fontSize:'.8rem' }}>{icon}</button>
          ))}
          <a href={`https://open.spotify.com/track/${track.spotifyId}`} target="_blank" rel="noopener noreferrer" style={{ width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--overlay)',border:'1px solid var(--border)',borderRadius:'var(--rsm)',color:'var(--muted)',fontSize:'.8rem' }}>↗</a>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGES
// ══════════════════════════════════════════════════════════════════════════════
function HomePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh',position:'relative',overflow:'hidden',padding:'2rem 1.5rem' }}>
      <div style={{ position:'fixed',width:500,height:500,borderRadius:'50%',background:'rgba(168,85,247,.08)',top:'-15%',right:'-10%',filter:'blur(100px)',pointerEvents:'none' }} />
      <div style={{ position:'fixed',width:400,height:400,borderRadius:'50%',background:'rgba(244,114,182,.06)',bottom:'-10%',left:'-8%',filter:'blur(100px)',pointerEvents:'none' }} />
      <section style={{ maxWidth:860,margin:'0 auto',paddingTop:'12vh',textAlign:'center',position:'relative',zIndex:1 }}>
        <span className="fu" style={{ display:'inline-block',padding:'.35rem 1rem',background:'rgba(168,85,247,.12)',border:'1px solid var(--borderbr)',borderRadius:'var(--rfull)',color:'var(--accent)',fontFamily:'var(--mono)',fontSize:'.72rem',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:'1.5rem' }}>✦ SoundDNA Technology</span>
        <h1 className="fu1" style={{ fontFamily:'var(--font)',fontSize:'clamp(2.5rem,7vw,5rem)',fontWeight:800,lineHeight:1.1,letterSpacing:'-.03em',marginBottom:'1.5rem' }}>
          Your music has<br /><span className="grad">a fingerprint.</span>
        </h1>
        <p className="fu2" style={{ maxWidth:520,margin:'0 auto 2.5rem',color:'var(--muted)',fontSize:'1.05rem',lineHeight:1.7 }}>
          DJ Dou analyzes your Spotify listening history to build a unique SoundDNA — powering personalized recommendations that actually sound like you.
        </p>
        <button className="fu3" onClick={()=>user?navigate('/dashboard'):login()} style={{ padding:'1rem 2.5rem',background:'linear-gradient(135deg,var(--accent),var(--hot))',color:'#fff',border:'none',borderRadius:'var(--rfull)',fontFamily:'var(--font)',fontWeight:700,fontSize:'1.05rem',cursor:'pointer',boxShadow:'0 0 40px rgba(168,85,247,.4)',marginBottom:'4rem' }}>
          {user?'Go to Dashboard':'Discover Your SoundDNA'}
        </button>
        <div className="fu4" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:'1rem',textAlign:'left' }}>
          {[
            { icon:'🧬', title:'SoundDNA Profile',  desc:'13-dimension audio fingerprint computed from your top Spotify tracks.' },
            { icon:'📊', title:'Radar Visualization',desc:'D3-powered radar chart showing your unique musical dimensions.' },
            { icon:'🎯', title:'Smart Recs',          desc:'Cosine similarity matching finds tracks that fit your audio fingerprint.' },
            { icon:'🎵', title:'30s Previews',        desc:'Listen to track previews directly in the app before adding to Spotify.' },
          ].map(f=>(
            <div key={f.title} className="glass" style={{ padding:'1.25rem' }}>
              <div style={{ fontSize:'1.4rem',marginBottom:'.5rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight:700,fontSize:'.95rem',marginBottom:'.4rem' }}>{f.title}</h3>
              <p style={{ color:'var(--muted)',fontSize:'.825rem',lineHeight:1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LoginPage() {
  const { login } = useAuth();
  return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',position:'relative',overflow:'hidden' }}>
      <div style={{ position:'absolute',width:400,height:400,borderRadius:'50%',background:'rgba(168,85,247,.12)',top:'-10%',right:'-10%',filter:'blur(80px)',pointerEvents:'none' }} />
      <div className="glass fu" style={{ width:'100%',maxWidth:420,padding:'3.5rem 2.5rem',textAlign:'center',position:'relative',zIndex:1 }}>
        <div style={{ fontSize:'3rem',marginBottom:'1rem',filter:'drop-shadow(0 0 20px rgba(168,85,247,.8))' }}>🎵</div>
        <h1 style={{ fontFamily:'var(--font)',fontSize:'2.2rem',fontWeight:800,letterSpacing:'-.02em',marginBottom:'.5rem' }} className="grad">DJ Dou</h1>
        <p style={{ color:'var(--muted)',fontFamily:'var(--mono)',fontSize:'.78rem',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:'1.5rem' }}>Your music has a fingerprint</p>
        <p style={{ color:'var(--muted)',lineHeight:1.7,marginBottom:'2rem',fontSize:'.9rem' }}>
          Connect your Spotify to generate your <strong style={{ color:'var(--accent)' }}>SoundDNA</strong> — a 13-dimension audio fingerprint powering personalized recommendations.
        </p>
        <button onClick={login} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,width:'100%',padding:'14px 24px',background:'#1DB954',color:'#000',borderRadius:'var(--rfull)',fontFamily:'var(--font)',fontWeight:700,fontSize:'1rem',cursor:'pointer',boxShadow:'0 4px 20px rgba(29,185,84,.3)',marginBottom:'2rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          Continue with Spotify
        </button>
        {['13-dimension audio fingerprint','No AI APIs required','Live 30s track previews'].map(f=>(
          <div key={f} style={{ display:'flex',alignItems:'center',gap:10,color:'var(--muted)',fontSize:'.875rem',marginBottom:8,textAlign:'left' }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--accent)',boxShadow:'0 0 8px var(--accent)',flexShrink:0 }} />{f}
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refetch } = useAuth();
  useEffect(() => {
    const token = params.get('token');
    if (!token) { navigate('/login?error=no_token'); return; }
    localStorage.setItem('djdou_token', token);
    refetch().then(() => navigate('/dashboard'));
  }, [params, navigate, refetch]);
  return <Spinner full />;
}

function DashboardPage() {
  const { user } = useAuth();
  const { dna, loading: dnaLoading, computing, compute } = useDNA();
  const { recs, loading: recsLoading, fetch: fetchRecs } = useRecs();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { if (dna) fetchRecs(); }, [dna]); // eslint-disable-line

  return (
    <div style={{ paddingTop:'2rem',paddingBottom:'5rem' }}>
      <div className="wrap">
        <header className="fu" style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontFamily:'var(--font)',fontSize:'2rem',fontWeight:800,letterSpacing:'-.02em' }}>
            Welcome back, <span className="grad">{user?.displayName?.split(' ')[0]||'listener'}</span>
          </h1>
          <p style={{ color:'var(--muted)',fontFamily:'var(--mono)',fontSize:'.75rem',textTransform:'uppercase',letterSpacing:'.1em',marginTop:4 }}>Your musical fingerprint, decoded.</p>
        </header>

        {dnaLoading ? <Spinner /> : !dna ? (
          /* ── No DNA yet ── */
          <div className="glass fu1" style={{ padding:'3rem 2rem',textAlign:'center',maxWidth:500,margin:'0 auto' }}>
            <div style={{ fontSize:'3rem',marginBottom:'1rem' }}>🧬</div>
            <h2 style={{ fontWeight:800,fontSize:'1.4rem',letterSpacing:'-.02em',marginBottom:'.75rem' }}>Generate Your SoundDNA</h2>
            <p style={{ color:'var(--muted)',lineHeight:1.7,marginBottom:'2rem',fontSize:'.9rem' }}>
              Analyze your Spotify listening history across 13 audio dimensions to build your unique musical fingerprint.
            </p>
            <button onClick={compute} disabled={computing} style={{ padding:'.75rem 2rem',background:'linear-gradient(135deg,var(--accent),var(--hot))',color:'#fff',border:'none',borderRadius:'var(--rfull)',fontFamily:'var(--font)',fontWeight:700,cursor:'pointer',opacity:computing?.7:1,fontSize:'1rem' }}>
              {computing?'Analyzing your music…':'Generate My SoundDNA'}
            </button>
          </div>
        ) : (
          <>
            {/* DNA Row */}
            <div className="fu1" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',marginBottom:'1rem',alignItems:'start' }}>
              {/* Radar */}
              <div className="glass" style={{ padding:'1.5rem' }}>
                <h2 style={{ fontWeight:700,fontSize:'1.1rem',marginBottom:'1rem' }}>SoundDNA Radar</h2>
                <RadarChart data={dna.chartData} size={290} />
              </div>

              {/* Summary + breakdown */}
              <div style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
                <div className="glass" style={{ padding:'1.5rem' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,color:'var(--accent)',fontFamily:'var(--mono)',fontSize:'.72rem',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'1rem' }}>
                    <span style={{ width:8,height:8,borderRadius:'50%',background:'var(--accent)',boxShadow:'0 0 8px var(--accent)',display:'inline-block' }} />
                    SoundDNA Summary
                    {!dna.hasAudioFeatures && <span style={{ marginLeft:'auto',padding:'.15rem .5rem',background:'rgba(251,191,36,.1)',border:'1px solid rgba(251,191,36,.3)',borderRadius:'var(--rfull)',color:'#fbbf24',fontSize:'.65rem' }}>Estimated</span>}
                  </div>
                  <p style={{ fontStyle:'italic',lineHeight:1.8,borderLeft:'3px solid var(--accent)',paddingLeft:'1rem',fontSize:'.95rem' }}>{dna.dnaSummary}</p>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'1rem' }}>
                    <span style={{ fontFamily:'var(--mono)',fontSize:'.68rem',color:'var(--dim)' }}>{new Date(dna.dnaComputedAt).toLocaleDateString()}</span>
                    <button onClick={compute} disabled={computing} style={{ border:'1px solid var(--border)',color:'var(--accent)',fontFamily:'var(--mono)',fontSize:'.72rem',padding:'.3rem .8rem',borderRadius:'var(--rfull)',cursor:'pointer' }}>{computing?'Recomputing…':'↻ Refresh'}</button>
                  </div>
                </div>

                {/* Feature bars */}
                <div className="glass" style={{ padding:'1.5rem' }}>
                  <h3 style={{ fontWeight:700,fontSize:'1rem',marginBottom:'1rem' }}>All 13 Dimensions</h3>
                  <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                    {(showAll?FEATURES:FEATURES.slice(0,6)).map((m,i)=>(
                      <Bar key={m.key} meta={m} value={dna.dnaVector[i]??0} />
                    ))}
                  </div>
                  <button onClick={()=>setShowAll(e=>!e)} style={{ marginTop:12,color:'var(--accent)',fontFamily:'var(--mono)',fontSize:'.72rem',cursor:'pointer',padding:0 }}>
                    {showAll?'↑ Show less':`↓ Show all ${FEATURES.length} dimensions`}
                  </button>
                </div>
              </div>
            </div>

            {/* Search to find more tracks */}
            <div className="glass fu2" style={{ padding:'1.5rem',marginBottom:'1rem' }}>
              <h3 style={{ fontWeight:700,fontSize:'1rem',marginBottom:'1rem' }}>Search Spotify</h3>
              <TrackSearch placeholder="Search any track or artist…" />
            </div>

            {/* Recommendations */}
            <section className="fu3">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:700,fontSize:'1.1rem' }}>Recommended For You</h2>
                <button onClick={()=>fetchRecs(true)} disabled={recsLoading} style={{ fontFamily:'var(--mono)',fontSize:'.72rem',color:'var(--accent)',background:'none',border:'1px solid var(--border)',padding:'.35rem 1rem',borderRadius:'var(--rfull)',cursor:'pointer' }}>
                  {recsLoading?'…':'↻ Refresh'}
                </button>
              </div>
              {recsLoading ? <Spinner /> : recs.length===0
                ? <Empty icon="🎯" title="No recommendations yet" desc="Your catalog is still being indexed. Wait a minute and try refreshing." action={{ label:'Refresh', fn:()=>fetchRecs(true) }} />
                : <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1rem' }}>
                    {recs.map(r=><RecCard key={r.id} rec={r} />)}
                  </div>
              }
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function DiscoverPage() {
  const { user } = useAuth();
  const { dna } = useDNA();
  const { recs, loading, fetch } = useRecs();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (dna && !loaded) { fetch(true); setLoaded(true); }
  }, [dna, loaded, fetch]);

  if (!dna) return (
    <div style={{ paddingTop:'4rem' }}>
      <div className="wrap">
        <Empty icon="🧬" title="Generate Your SoundDNA First" desc="Go to the Dashboard and click Generate My SoundDNA before discovering recommendations." action={{ label:'Go to Dashboard', fn:()=>window.location.href='/dashboard' }} />
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop:'2rem',paddingBottom:'5rem' }}>
      <div className="wrap">
        <header className="fu" style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontFamily:'var(--font)',fontSize:'2rem',fontWeight:800,letterSpacing:'-.02em',marginBottom:'.5rem' }}>Discover</h1>
          <p style={{ color:'var(--muted)',fontSize:'.9rem',lineHeight:1.7,maxWidth:500 }}>Tracks matched to your SoundDNA from our indexed catalog. The closer the match, the more it fits your listening fingerprint.</p>
        </header>

        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem' }}>
          <span style={{ color:'var(--muted)',fontFamily:'var(--mono)',fontSize:'.78rem' }}>{recs.length} tracks found</span>
          <button onClick={()=>fetch(true)} disabled={loading} style={{ fontFamily:'var(--mono)',fontSize:'.72rem',color:'var(--accent)',background:'none',border:'1px solid var(--border)',padding:'.35rem 1rem',borderRadius:'var(--rfull)',cursor:'pointer' }}>
            {loading?'…':'↻ Refresh'}
          </button>
        </div>

        {loading ? <Spinner /> : recs.length===0
          ? <Empty icon="🔍" title="No tracks found" desc="The catalog may still be indexing. Try again in a minute." action={{ label:'Try again', fn:()=>fetch(true) }} />
          : <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1rem' }}>
              {recs.map(r=><RecCard key={r.id} rec={r} />)}
            </div>
        }
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user, refetch } = useAuth();
  const { dna, computing, compute } = useDNA();
  const Row = ({label,value}) => (
    <div style={{ display:'flex',justifyContent:'space-between',padding:'.75rem 0',borderBottom:'1px solid var(--border)' }}>
      <span style={{ color:'var(--dim)',fontFamily:'var(--mono)',fontSize:'.8rem' }}>{label}</span>
      <span style={{ fontFamily:'var(--mono)',fontSize:'.8rem' }}>{value}</span>
    </div>
  );
  return (
    <div style={{ paddingTop:'2rem',paddingBottom:'5rem' }}>
      <div className="wrap" style={{ maxWidth:680 }}>
        <h1 className="fu" style={{ fontFamily:'var(--font)',fontSize:'2rem',fontWeight:800,letterSpacing:'-.02em',marginBottom:'2rem' }}>Profile</h1>

        <div className="glass fu1" style={{ padding:'1.5rem',marginBottom:'1rem' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'1.5rem' }}>
            <div style={{ width:72,height:72,borderRadius:'50%',overflow:'hidden',background:'linear-gradient(135deg,var(--accent),var(--hot))',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'1.5rem',border:'2px solid var(--borderbr)',flexShrink:0 }}>
              {user?.avatar?<img src={user.avatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />:user?.displayName?.[0]}
            </div>
            <div>
              <h2 style={{ fontWeight:700,fontSize:'1.25rem' }}>{user?.displayName}</h2>
              <p style={{ color:'var(--muted)',fontSize:'.875rem',margin:'4px 0 8px' }}>{user?.email}</p>
              <span style={{ padding:'.2rem .65rem',background:'rgba(29,185,84,.12)',border:'1px solid rgba(29,185,84,.35)',borderRadius:'var(--rfull)',color:'#1DB954',fontSize:'.72rem',fontWeight:600 }}>✓ Spotify Connected</span>
            </div>
          </div>
        </div>

        <div className="glass fu2" style={{ padding:'1.5rem',marginBottom:'1rem' }}>
          <h3 style={{ fontWeight:700,marginBottom:'1rem' }}>SoundDNA Status</h3>
          {dna ? (
            <>
              <div style={{ display:'flex',alignItems:'center',gap:8,color:'var(--muted)',fontSize:'.875rem',marginBottom:'.75rem' }}>
                <span style={{ width:8,height:8,borderRadius:'50%',background:'var(--lime)',boxShadow:'0 0 8px var(--lime)',display:'inline-block' }} />
                Computed {new Date(dna.dnaComputedAt).toLocaleDateString()}
                {!dna.hasAudioFeatures && <span style={{ marginLeft:8,padding:'.15rem .5rem',background:'rgba(251,191,36,.1)',border:'1px solid rgba(251,191,36,.3)',borderRadius:'var(--rfull)',color:'#fbbf24',fontSize:'.65rem' }}>Estimated — audio features unavailable</span>}
              </div>
              <p style={{ color:'var(--muted)',lineHeight:1.7,fontStyle:'italic',fontSize:'.875rem',marginBottom:'1rem' }}>{dna.dnaSummary}</p>
            </>
          ) : <p style={{ color:'var(--muted)',fontSize:'.875rem',marginBottom:'1rem' }}>DNA not generated yet.</p>}
          <button onClick={compute} disabled={computing} style={{ padding:'.5rem 1.25rem',background:'var(--overlay)',border:'1px solid var(--borderbr)',borderRadius:'var(--rfull)',color:'var(--accent)',fontFamily:'var(--font)',fontWeight:600,cursor:'pointer',fontSize:'.875rem' }}>
            {computing?'Computing…':dna?'Recompute DNA':'Generate DNA'}
          </button>
        </div>

        <div className="glass fu3" style={{ padding:'1.5rem' }}>
          <h3 style={{ fontWeight:700,marginBottom:'1rem' }}>Account</h3>
          <Row label="Spotify ID" value={user?.spotifyId} />
          <Row label="Member since" value={new Date(user?.createdAt||Date.now()).toLocaleDateString()} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════════════════
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner full />;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}

function Layout({ children }) {
  const { user }  = useAuth();
  const { track } = usePlayer();
  return (
    <div style={{ minHeight:'100vh',position:'relative',zIndex:1 }}>
      {user && <Navbar />}
      <main style={{ paddingBottom: track?'80px':0 }}>{children}</main>
      {track && <MiniPlayer />}
    </div>
  );
}

export default function App() {
  const auth   = useAuthState();
  const player = usePlayerState();
  return (
    <AuthCtx.Provider value={auth}>
      <PlayerCtx.Provider value={player}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/"             element={<HomePage />} />
              <Route path="/login"        element={<LoginPage />} />
              <Route path="/auth/success" element={<AuthSuccessPage />} />
              <Route path="/dashboard"    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/discover"     element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
              <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="*"             element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </PlayerCtx.Provider>
    </AuthCtx.Provider>
  );
}
