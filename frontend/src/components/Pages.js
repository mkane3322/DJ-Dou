import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthCtx, usePlayerCtx, useDNA, useRecommendations } from '../lib';
import { Spinner, EmptyState } from './UI';
import { RadarChart, DNASummary, DNABreakdown, SeedsManager } from './DNA';
import { RecommendationCard, MoodSearch } from './Recs';
import api from '../lib';

// ══════════════════════════════════════════════════════════════════════════════
// HOME
// ══════════════════════════════════════════════════════════════════════════════
export function HomePage() {
  const { user, login } = useAuthCtx();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight:'100vh', position:'relative', overflow:'hidden', padding:'2rem 1.5rem' }}>
      {/* Background orbs */}
      <div style={{ position:'fixed', width:500, height:500, borderRadius:'50%', background:'rgba(168,85,247,0.08)', top:'-15%', right:'-10%', filter:'blur(100px)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', width:400, height:400, borderRadius:'50%', background:'rgba(244,114,182,0.06)', bottom:'-10%', left:'-8%', filter:'blur(100px)', pointerEvents:'none' }} />

      <section style={{ maxWidth:860, margin:'0 auto', paddingTop:'12vh', textAlign:'center', position:'relative', zIndex:1 }}>
        <span className="fu" style={{ display:'inline-block', padding:'0.35rem 1rem', background:'rgba(168,85,247,0.12)', border:'1px solid var(--border-bright)', borderRadius:'var(--radius-full)', color:'var(--accent)', fontFamily:'var(--mono)', fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'1.5rem' }}>
          ✦ SoundDNA Technology
        </span>

        <h1 className="fu1" style={{ fontFamily:'var(--font)', fontSize:'clamp(2.5rem,7vw,5rem)', fontWeight:800, lineHeight:1.1, letterSpacing:'-0.03em', marginBottom:'1.5rem' }}>
          Your music has<br />
          <span className="grad">a fingerprint.</span>
        </h1>

        <p className="fu2" style={{ maxWidth:520, margin:'0 auto 2.5rem', color:'var(--text-secondary)', fontSize:'1.05rem', lineHeight:1.7 }}>
          DJ Dou analyzes 13 audio dimensions from your Spotify history to generate a unique SoundDNA — powering recommendations that actually sound like you.
        </p>

        <button className="fu3" onClick={() => user ? navigate('/dashboard') : login()} style={{ padding:'1rem 2.5rem', background:'linear-gradient(135deg,var(--accent),var(--accent-hot))', color:'#fff', border:'none', borderRadius:'var(--radius-full)', fontFamily:'var(--font)', fontWeight:700, fontSize:'1.05rem', cursor:'pointer', boxShadow:'0 0 40px rgba(168,85,247,0.4)', marginBottom:'4rem' }}>
          {user ? 'Go to Dashboard' : 'Discover Your SoundDNA'}
        </button>

        <div className="fu4" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:'1rem', textAlign:'left' }}>
          {[
            { icon:'🧬', title:'SoundDNA Profile',   desc:'13-dimension fingerprint from your top Spotify tracks across all time ranges.' },
            { icon:'🤖', title:'AI Summary',          desc:'Claude writes a plain-English portrait of your musical identity.' },
            { icon:'🎯', title:'Smart Recs',          desc:'Cosine similarity finds tracks that genuinely match your audio fingerprint.' },
            { icon:'🌙', title:'Mood Search',         desc:'Type a vibe — AI parses it into audio feature ranges to find the perfect track.' },
          ].map((f) => (
            <div key={f.title} className="glass" style={{ padding:'1.25rem' }}>
              <div style={{ fontSize:'1.4rem', marginBottom:'0.5rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:'0.4rem' }}>{f.title}</h3>
              <p style={{ color:'var(--text-secondary)', fontSize:'0.825rem', lineHeight:1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════
export function LoginPage() {
  const { login } = useAuthCtx();
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'rgba(168,85,247,0.12)', top:'-10%', right:'-10%', filter:'blur(80px)', pointerEvents:'none' }} />
      <div className="glass fu" style={{ width:'100%', maxWidth:420, padding:'3.5rem 2.5rem', textAlign:'center', position:'relative', zIndex:1 }}>
        <div style={{ fontSize:'3rem', marginBottom:'1rem', filter:'drop-shadow(0 0 20px rgba(168,85,247,0.8))' }}>🎵</div>
        <h1 style={{ fontFamily:'var(--font)', fontSize:'2.2rem', fontWeight:800, letterSpacing:'-0.02em', marginBottom:'0.5rem' }} className="grad">DJ Dou</h1>
        <p style={{ color:'var(--text-secondary)', fontFamily:'var(--mono)', fontSize:'0.78rem', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'1.5rem' }}>Your music has a fingerprint</p>
        <p style={{ color:'var(--text-secondary)', lineHeight:1.7, marginBottom:'2rem', fontSize:'0.9rem' }}>
          Connect your Spotify to generate your <strong style={{ color:'var(--accent)' }}>SoundDNA</strong> — a 13-dimension audio fingerprint powering hyper-accurate recommendations.
        </p>

        <button onClick={login} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', width:'100%', padding:'14px 24px', background:'#1DB954', color:'#000', borderRadius:'var(--radius-full)', fontFamily:'var(--font)', fontWeight:700, fontSize:'1rem', cursor:'pointer', boxShadow:'0 4px 20px rgba(29,185,84,0.3)', marginBottom:'2rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          Continue with Spotify
        </button>

        <div style={{ display:'flex', flexDirection:'column', gap:'10px', textAlign:'left' }}>
          {['13-dimension audio fingerprint','AI-powered music summary','Mood-based search'].map((f) => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:'10px', color:'var(--text-secondary)', fontSize:'0.875rem' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 8px var(--accent)', flexShrink:0 }} />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH SUCCESS — picks up token from URL
// ══════════════════════════════════════════════════════════════════════════════
export function AuthSuccessPage() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { refetch } = useAuthCtx();

  useEffect(() => {
    const token = params.get('token');
    if (!token) { navigate('/login?error=no_token'); return; }
    localStorage.setItem('djdou_token', token);
    refetch().then(() => navigate('/dashboard'));
  }, [params, navigate, refetch]);

  return <Spinner fullPage />;
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export function DashboardPage() {
  const { user } = useAuthCtx();
  const { dna, loading: dnaLoading, computing, computeDNA } = useDNA();
  const { recommendations, loading: recsLoading, fetchRecommendations } = useRecommendations();

  useEffect(() => { if (dna) fetchRecommendations(); }, [dna]); // eslint-disable-line

  return (
    <div style={{ paddingTop:'2rem', paddingBottom:'5rem' }}>
      <div className="container">
        <header className="fu" style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontFamily:'var(--font)', fontSize:'2rem', fontWeight:800, letterSpacing:'-0.02em' }}>
            Welcome back, <span className="grad">{user?.displayName?.split(' ')[0] || 'listener'}</span>
          </h1>
          <p style={{ color:'var(--text-secondary)', fontFamily:'var(--mono)', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:'4px' }}>Your musical fingerprint, decoded.</p>
        </header>

        {dnaLoading ? <Spinner /> : !dna ? (
          /* No DNA yet */
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', alignItems:'start' }}>
            <div className="glass fu1" style={{ padding:'3rem 2rem', textAlign:'center' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🧬</div>
              <h2 style={{ fontWeight:800, fontSize:'1.4rem', letterSpacing:'-0.02em', marginBottom:'0.75rem' }}>Generate Your SoundDNA</h2>
              <p style={{ color:'var(--text-secondary)', lineHeight:1.7, marginBottom:'2rem', fontSize:'0.9rem' }}>
                Analyze your Spotify history across 13 audio dimensions to build your unique musical fingerprint.
              </p>
              <button onClick={computeDNA} disabled={computing} style={{ padding:'0.75rem 2rem', background:'linear-gradient(135deg,var(--accent),var(--accent-hot))', color:'#fff', border:'none', borderRadius:'var(--radius-full)', fontFamily:'var(--font)', fontWeight:700, cursor:'pointer', opacity: computing ? 0.7 : 1 }}>
                {computing ? 'Analyzing your music…' : 'Generate My SoundDNA'}
              </button>
            </div>
            <div className="glass fu2" style={{ padding:'1.5rem' }}><SeedsManager /></div>
          </div>
        ) : (
          <>
            {/* DNA row */}
            <div className="fu1" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1rem', alignItems:'start' }}>
              <div className="glass" style={{ padding:'1.5rem' }}>
                <h2 style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:'1rem' }}>SoundDNA Radar</h2>
                <RadarChart data={dna.chartData} size={290} />
              </div>
              <DNASummary summary={dna.dnaSummary} computedAt={dna.dnaComputedAt} onRecompute={computeDNA} computing={computing} />
            </div>

            {/* Breakdown */}
            <div className="glass fu2" style={{ padding:'1.5rem', marginBottom:'1rem' }}>
              <DNABreakdown dnaVector={dna.dnaVector} />
            </div>

            {/* Seeds */}
            <div className="glass fu3" style={{ padding:'1.5rem', marginBottom:'2rem' }}>
              <SeedsManager />
            </div>

            {/* Recs */}
            <section className="fu4">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                <h2 style={{ fontWeight:700, fontSize:'1.1rem' }}>Recommended For You</h2>
                <button onClick={() => fetchRecommendations(true)} disabled={recsLoading} style={{ fontFamily:'var(--mono)', fontSize:'0.72rem', color:'var(--accent)', background:'none', border:'1px solid var(--border)', padding:'0.35rem 1rem', borderRadius:'var(--radius-full)', cursor:'pointer' }}>
                  {recsLoading ? '…' : '↻ Refresh'}
                </button>
              </div>
              {recsLoading ? <Spinner /> : recommendations.length === 0 ? (
                <EmptyState icon="🎯" title="No recommendations yet" desc="Your catalog is still indexing. Give it a few minutes." action={{ label:'Try again', onClick: () => fetchRecommendations(true) }} />
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
                  {recommendations.map((rec) => <RecommendationCard key={rec.id} recommendation={rec} />)}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DISCOVER
// ══════════════════════════════════════════════════════════════════════════════
export function DiscoverPage() {
  const { moodResults, moodLoading, searchByMood } = useRecommendations();

  return (
    <div style={{ paddingTop:'2rem', paddingBottom:'5rem' }}>
      <div className="container">
        <header className="fu" style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontFamily:'var(--font)', fontSize:'2rem', fontWeight:800, letterSpacing:'-0.02em', marginBottom:'0.5rem' }}>Discover</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem', lineHeight:1.7, maxWidth:500 }}>
            Describe how you want to feel. Claude parses your mood into audio feature filters, then matches tracks to your SoundDNA.
          </p>
        </header>

        <div className="glass fu1" style={{ padding:'1.5rem', marginBottom:'2rem' }}>
          <MoodSearch onSearch={searchByMood} loading={moodLoading} />
        </div>

        {moodLoading && <Spinner />}

        {moodResults && !moodLoading && (
          <div className="fu">
            {moodResults.parsedFilters && Object.keys(moodResults.parsedFilters).length > 0 && (
              <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'8px', marginBottom:'1.5rem' }}>
                <span style={{ color:'var(--text-muted)', fontFamily:'var(--mono)', fontSize:'0.68rem' }}>✦ Filters applied:</span>
                {Object.entries(moodResults.parsedFilters).map(([k,[mn,mx]]) => (
                  <span key={k} style={{ padding:'0.18rem 0.55rem', background:'rgba(34,211,238,0.1)', border:'1px solid rgba(34,211,238,0.3)', borderRadius:'var(--radius-full)', color:'var(--accent-cyan)', fontFamily:'var(--mono)', fontSize:'0.68rem' }}>
                    {k} {Math.round(mn*100)}–{Math.round(mx*100)}%
                  </span>
                ))}
              </div>
            )}

            {moodResults.message
              ? <EmptyState icon="🔍" title="No matches" desc={moodResults.message} />
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
                  {(moodResults.results || []).map((rec) => <RecommendationCard key={rec.id} recommendation={rec} />)}
                </div>
            }
          </div>
        )}

        {!moodResults && !moodLoading && (
          <EmptyState icon="🌙" title="What's your mood?" desc="Type a description or pick a preset above to find tracks that match your vibe and your SoundDNA." />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════════════════════════
export function ProfilePage() {
  const { user, refetch } = useAuthCtx();
  const { dna, computing, computeDNA } = useDNA();
  const fileRef = React.useRef();

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('avatar', file);
    await api.post('/user/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    await refetch();
  };

  const Row = ({ label, value }) => (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'0.75rem 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ color:'var(--text-muted)', fontFamily:'var(--mono)', fontSize:'0.8rem' }}>{label}</span>
      <span style={{ fontFamily:'var(--mono)', fontSize:'0.8rem' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ paddingTop:'2rem', paddingBottom:'5rem' }}>
      <div className="container" style={{ maxWidth:680 }}>
        <h1 className="fu" style={{ fontFamily:'var(--font)', fontSize:'2rem', fontWeight:800, letterSpacing:'-0.02em', marginBottom:'2rem' }}>Profile</h1>

        {/* Avatar + Name */}
        <div className="glass fu1" style={{ padding:'1.5rem', marginBottom:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
            <div style={{ position:'relative', cursor:'pointer' }} onClick={() => fileRef.current?.click()}>
              <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,var(--accent),var(--accent-hot))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.5rem', border:'2px solid var(--border-bright)' }}>
                {user?.avatar ? <img src={user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : user?.displayName?.[0]}
              </div>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:600, opacity:0, transition:'opacity 150ms' }}>Edit</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatar} />
            <div>
              <h2 style={{ fontWeight:700, fontSize:'1.25rem' }}>{user?.displayName}</h2>
              <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', margin:'4px 0 8px' }}>{user?.email}</p>
              <span style={{ padding:'0.2rem 0.65rem', background:'rgba(29,185,84,0.12)', border:'1px solid rgba(29,185,84,0.35)', borderRadius:'var(--radius-full)', color:'#1DB954', fontSize:'0.72rem', fontWeight:600 }}>✓ Spotify Connected</span>
            </div>
          </div>
        </div>

        {/* DNA */}
        <div className="glass fu2" style={{ padding:'1.5rem', marginBottom:'1rem' }}>
          <h3 style={{ fontWeight:700, marginBottom:'1rem' }}>SoundDNA Status</h3>
          {dna ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'var(--text-secondary)', fontSize:'0.875rem', marginBottom:'0.75rem' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent-lime)', boxShadow:'0 0 8px var(--accent-lime)' }} />
                Computed {new Date(dna.dnaComputedAt).toLocaleDateString()}
              </div>
              <p style={{ color:'var(--text-secondary)', lineHeight:1.7, fontStyle:'italic', fontSize:'0.875rem', marginBottom:'1rem' }}>{dna.dnaSummary}</p>
            </>
          ) : (
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginBottom:'1rem' }}>DNA not generated yet.</p>
          )}
          <button onClick={computeDNA} disabled={computing} style={{ padding:'0.5rem 1.25rem', background:'var(--bg-overlay)', border:'1px solid var(--border-bright)', borderRadius:'var(--radius-full)', color:'var(--accent)', fontFamily:'var(--font)', fontWeight:600, cursor:'pointer', fontSize:'0.875rem' }}>
            {computing ? 'Computing…' : dna ? 'Recompute DNA' : 'Generate DNA'}
          </button>
        </div>

        {/* Account */}
        <div className="glass fu3" style={{ padding:'1.5rem' }}>
          <h3 style={{ fontWeight:700, marginBottom:'1rem' }}>Account</h3>
          <Row label="Spotify ID" value={user?.spotifyId} />
          <Row label="Member since" value={new Date(user?.createdAt || Date.now()).toLocaleDateString()} />
        </div>
      </div>
    </div>
  );
}
