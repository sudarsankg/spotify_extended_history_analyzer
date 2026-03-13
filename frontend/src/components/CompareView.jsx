import React from 'react'
import HeroStats from './HeroStats'

export default function CompareView({ userStats, sharedStats, sharedName }) {
  // 1. CONTENT INTERSECTION (ARTISTS/TRACKS)
  const userArtists = userStats?.topArtists || []
  const sharedArtists = sharedStats?.topArtists || []
  const userTracks = userStats?.topTracks || []
  const sharedTracks = sharedStats?.topTracks || []

  const commonArtists = userArtists.filter(ua => 
    sharedArtists.some(sa => sa.key === ua.key)
  ).map(a => a.key)

  const commonTracks = userTracks.filter(ut => 
    sharedTracks.some(st => st.key === ut.key)
  ).map(t => t.name)

  // 2. VECTOR SIMILARITY (9D TASTE DNA)
  const dna1 = userStats?.taste_dna // [danc, ener, loud, spee, acou, inst, live, vale, temp]
  const dna2 = sharedStats?.taste_dna

  const calculateCosineSim = (v1, v2) => {
    if (!v1 || !v2) return 0
    const dot = v1.reduce((acc, val, i) => acc + val * v2[i], 0)
    const mag1 = Math.sqrt(v1.reduce((acc, val) => acc + val * val, 0))
    const mag2 = Math.sqrt(v2.reduce((acc, val) => acc + val * val, 0))
    return dot / (mag1 * mag2)
  }

  const vecSim = (dna1 && dna2) ? calculateCosineSim(dna1, dna2) : 0
  
  // 3. HYBRID MATCH SCORE
  // We combine the vector similarity (DNA) with the concrete list overlap
  const contentScore = ((commonArtists.length / 5) * 30) + ((commonTracks.length / 3) * 20)
  const dnaScore = vecSim * 50 // 50% weight to DNA
  const matchScore = Math.min(100, Math.round(dnaScore + contentScore))

  const FEATURES = ['Danceability', 'Energy', 'Loudness', 'Speechiness', 'Acoustic', 'Instrumental', 'Liveness', 'Valence', 'Tempo']

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3.5rem', fontFamily: "'Bebas Neue', sans-serif", color: 'var(--green)', margin: 0 }}>
          TASTE COMPARISON
        </h2>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '1rem',
          marginTop: '0.5rem',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.8rem',
          letterSpacing: '0.2em'
        }}>
          <span style={{ color: 'var(--text)' }}>YOU</span>
          <span style={{ color: 'var(--muted)' }}>VS</span>
          <span style={{ color: 'var(--green)' }}>{(sharedName || 'FRIEND').toUpperCase()}</span>
        </div>
      </div>

      {/* MATCH SCORE CARD */}
      <div style={{
        background: 'var(--surface)',
        padding: '4rem 2rem',
        borderRadius: 4,
        border: '1px solid var(--border)',
        textAlign: 'center',
        marginBottom: '3rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: 2,
          background: 'linear-gradient(90deg, transparent, var(--green), transparent)'
        }} />
        
        <div style={{ fontSize: '7rem', fontFamily: "'Bebas Neue', sans-serif", color: 'var(--green)', lineHeight: 0.9 }}>
          {matchScore}%
        </div>
        <div style={{ color: 'var(--muted)', letterSpacing: '0.3em', textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '1rem', fontFamily: "'Space Mono', monospace" }}>
          Compatibility Score
        </div>
        
        <div style={{ 
          marginTop: '2rem', 
          color: 'var(--text)', 
          maxWidth: '600px', 
          margin: '2.5rem auto 0',
          fontSize: '1.1rem',
          lineHeight: 1.6
        }}>
          {matchScore > 85 ? "Basically the same person. Musical soulmates." : 
           matchScore > 65 ? "Incredible overlap! You definitely share the same 'Frequency'." :
           matchScore > 40 ? "Great harmony. You have a lot of common ground to talk about." :
           matchScore > 20 ? "Different tastes, but you definitely have a few shared anthems." :
           "Two different worlds. The perfect chance to expand your horizons!"}
        </div>
      </div>

      {/* DNA BREAKDOWN */}
      {dna1 && dna2 && (
        <div className="card" style={{ marginBottom: '3rem' }}>
          <div className="card-title">
            <div className="dot" /> Audio DNA Comparison
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {FEATURES.map((feat, i) => {
              const val1 = dna1[i]
              const val2 = dna2[i]
              // Normalize for display
              const norm1 = Math.min(100, Math.max(5, (val1 + 1) * 45))
              const norm2 = Math.min(100, Math.max(5, (val2 + 1) * 45))
              
              return (
                <div key={feat} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    <span>{feat}</span>
                    <span>{Math.abs(val1 - val2).toFixed(2)} delta</span>
                  </div>
                  <div style={{ height: 12, background: 'var(--surface3)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', height: '100%', left: 0, width: `${norm1}%`, background: 'var(--text)', opacity: 0.3, transition: 'width 1s ease' }} />
                    <div style={{ position: 'absolute', height: '100%', left: 0, width: `${norm2}%`, background: 'var(--green)', opacity: 0.7, transition: 'width 1s 0.2s ease' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.55rem', fontFamily: 'monospace' }}>
                    <span style={{ color: 'var(--muted)' }}>● YOU</span>
                    <span style={{ color: 'var(--green)' }}>● {(sharedName || 'FRIEND').toUpperCase()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* HERO STATS SIDE BY SIDE */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '0.65rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.15em' }}>YOUR STATS</h3>
          <HeroStats stats={userStats} />
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '0.65rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.15em' }}>{(sharedName || 'FRIEND').toUpperCase()}'S STATS</h3>
          <HeroStats stats={sharedStats || {}} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 4, border: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--green)', fontSize: '1.8rem', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
            COMMON ARTISTS ({commonArtists.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {commonArtists.length > 0 ? commonArtists.map(a => (
              <span key={a} style={{ border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text)', padding: '0.4rem 0.8rem', borderRadius: 2, fontSize: '0.75rem', fontFamily: "'Space Mono', monospace" }}>
                {a}
              </span>
            )) : <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: "'Space Mono', monospace" }}>No shared artists in top 15.</span>}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 4, border: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--green)', fontSize: '1.8rem', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
            COMMON TRACKS ({commonTracks.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {commonTracks.length > 0 ? commonTracks.map(t => (
              <div key={t} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text)', fontFamily: "'Space Mono', monospace" }}>
                {t}
              </div>
            )) : <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: "'Space Mono', monospace" }}>No shared tracks in top 15.</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
