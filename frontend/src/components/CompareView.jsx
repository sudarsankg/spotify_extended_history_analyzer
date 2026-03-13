import React from 'react'
import HeroStats from './HeroStats'

export default function CompareView({ userStats, sharedStats, sharedName }) {
  // Defensive checks for stats arrays
  const userArtists = userStats?.topArtists || []
  const sharedArtists = sharedStats?.topArtists || []
  const userTracks = userStats?.topTracks || []
  const sharedTracks = sharedStats?.topTracks || []

  // Intersection logic - comparing keys (artist names / track keys)
  const commonArtists = userArtists.filter(ua => 
    sharedArtists.some(sa => sa.key === ua.key)
  ).map(a => a.key)

  const commonTracks = userTracks.filter(ut => 
    sharedTracks.some(st => st.key === ut.key)
  ).map(t => t.name)

  // Match score calculation (rough heuristic based on top 100 overlap)
  const artistScore = (commonArtists.length / 25) * 50 
  const trackScore = (commonTracks.length / 15) * 50 
  const matchScore = Math.min(100, Math.round(artistScore + trackScore))

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

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '2rem',
        marginBottom: '4rem'
      }}>
        <div>
          <h3 style={{ 
            marginBottom: '1rem', 
            fontSize: '0.65rem', 
            color: 'var(--muted)', 
            fontFamily: "'Space Mono', monospace",
            letterSpacing: '0.15em'
          }}>YOUR STATS</h3>
          <HeroStats stats={userStats} />
        </div>
        <div>
          <h3 style={{ 
            marginBottom: '1rem', 
            fontSize: '0.65rem', 
            color: 'var(--muted)', 
            fontFamily: "'Space Mono', monospace",
            letterSpacing: '0.15em'
          }}>{(sharedName || 'FRIEND').toUpperCase()}'S STATS</h3>
          <HeroStats stats={sharedStats || {}} />
        </div>
      </div>

      <div style={{
        background: 'var(--surface)',
        padding: '4rem 2rem',
        borderRadius: 4,
        border: '1px solid var(--border)',
        textAlign: 'center',
        marginBottom: '4rem',
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
          {matchScore > 80 ? "You're basically the same person. Musical soulmates." : 
           matchScore > 50 ? "Serious overlap here! You'd definitely pass the aux to each other." :
           matchScore > 20 ? "Some shared interests, but you both have your own distinct vibes." :
           "Two different worlds. A perfect opportunity to expand each other's horizons!"}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 4, border: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--green)', fontSize: '1.8rem', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
            COMMON ARTISTS ({commonArtists.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {commonArtists.length > 0 ? commonArtists.map(a => (
              <span key={a} style={{ 
                border: '1px solid var(--border)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text)', 
                padding: '0.4rem 0.8rem', 
                borderRadius: 2, 
                fontSize: '0.75rem',
                fontFamily: "'Space Mono', monospace"
              }}>
                {a}
              </span>
            )) : <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: "'Space Mono', monospace" }}>No shared artists in top 100.</span>}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 4, border: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--green)', fontSize: '1.8rem', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
            COMMON TRACKS ({commonTracks.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {commonTracks.length > 0 ? commonTracks.map(t => (
              <div key={t} style={{ 
                borderBottom: '1px solid var(--border)', 
                paddingBottom: '0.5rem', 
                fontSize: '0.85rem',
                color: 'var(--text)',
                fontFamily: "'Space Mono', monospace"
              }}>
                {t}
              </div>
            )) : <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: "'Space Mono', monospace" }}>No shared tracks in top 100.</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
