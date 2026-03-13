import React from 'react'
import HeroStats from './HeroStats'
import Heatmap from './Heatmap'
import ListeningInsights from './ListeningInsights'
import { Platforms } from './PlatformStats'
import { msToReadable } from '../utils/dataProcessing'

export default function CompareView({ userStats, sharedStats, sharedName }) {
  // --- DEFENSIVE DATA PREP ---
  const u = userStats || {}
  const s = sharedStats || {}

  const userArtists = u.topArtists || []
  const sharedArtists = s.topArtists || []
  const userTracks = u.topTracks || []
  const sharedTracks = s.topTracks || []

  // 1. MUTUAL LOVE CALCULATION
  const mutualArtists = userArtists
    .map(ua => {
      const sa = sharedArtists.find(a => a.key === ua.key)
      if (sa) {
        return {
          name: ua.key,
          userMs: ua.ms,
          sharedMs: sa.ms,
          mutualScore: Math.min(ua.ms, sa.ms)
        }
      }
      return null
    })
    .filter(Boolean)
    .sort((a, b) => b.mutualScore - a.mutualScore)
    .slice(0, 5)

  const mutualTracks = userTracks
    .map(ut => {
      const st = sharedTracks.find(t => t.key === ut.key)
      if (st) {
        return {
          name: ut.name,
          artist: ut.artist,
          userMs: ut.ms,
          sharedMs: st.ms,
          mutualScore: Math.min(ut.ms, st.ms)
        }
      }
      return null
    })
    .filter(Boolean)
    .sort((a, b) => b.mutualScore - a.mutualScore)
    .slice(0, 5)

  // 2. VECTOR SIMILARITY (9D TASTE DNA)
  const dna1 = u.taste_dna 
  const dna2 = s.taste_dna

  const calculateCosineSim = (v1, v2) => {
    if (!v1 || !v2 || !Array.isArray(v1) || !Array.isArray(v2) || v1.length === 0 || v2.length === 0) return 0
    const len = Math.min(v1.length, v2.length)
    let dot = 0, m1 = 0, m2 = 0
    for(let i=0; i<len; i++) {
      dot += v1[i] * v2[i]
      m1 += v1[i] * v1[i]
      m2 += v2[i] * v2[i]
    }
    if (m1 === 0 || m2 === 0) return 0
    return dot / (Math.sqrt(m1) * Math.sqrt(m2))
  }

  const vecSim = calculateCosineSim(dna1, dna2)
  
  // 3. HYBRID MATCH SCORE
  const contentScore = ((mutualArtists.length / 5) * 30) + ((mutualTracks.length / 3) * 20)
  const dnaScore = vecSim * 50 
  const matchScore = Math.min(100, Math.round(dnaScore + contentScore))

  const FEATURES = ['Danceability', 'Energy', 'Loudness', 'Speechiness', 'Acoustic', 'Instrumental', 'Liveness', 'Valence', 'Tempo']

  // 4. YEARLY TIMELINE COMPARISON
  const timeline1 = u.yearly_timeline?.buckets || []
  const timeline2 = s.yearly_timeline?.buckets || []
  const allYears = Array.from(new Set([...timeline1.map(b => b[0]), ...timeline2.map(b => b[0])])).sort()
  const maxTimelineMs = Math.max(...(timeline1.map(b => b[1])), ...(timeline2.map(b => b[1])), 1)

  // 5. COMPONENT SAFETY WRAPPERS
  // Create dummy stats for empty cases to prevent child crashes
  const dummyStats = {
    totalMs: 0, totalPlays: 0, topArtists: [], topTracks: [], topAlbums: [],
    skipPct: 0, skipped: 0, nightPlays: 0, morningPlays: 0, longestStreak: 0, incognitoPlays: 0,
    heatmap: Array(7).fill(0).map(() => Array(24).fill(0)),
    topPlatforms: []
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3.5rem', fontFamily: "'Bebas Neue', sans-serif", color: 'var(--green)', margin: 0 }}>
          TASTE COMPARISON
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', letterSpacing: '0.2em' }}>
          <span style={{ color: 'var(--text)' }}>YOU</span>
          <span style={{ color: 'var(--muted)' }}>VS</span>
          <span style={{ color: 'var(--green)' }}>{(sharedName || 'FRIEND').toUpperCase()}</span>
        </div>
      </div>

      {/* MATCH SCORE CARD */}
      <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: 4, border: '1px solid var(--border)', textAlign: 'center', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, transparent, var(--green), transparent)' }} />
        <div style={{ fontSize: '7rem', fontFamily: "'Bebas Neue', sans-serif", color: 'var(--green)', lineHeight: 0.9 }}>{matchScore}%</div>
        <div style={{ color: 'var(--muted)', letterSpacing: '0.3em', textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '1rem', fontFamily: "'Space Mono', monospace" }}>Compatibility Score</div>
        <div style={{ marginTop: '2rem', color: 'var(--text)', maxWidth: '600px', margin: '2.5rem auto 0', fontSize: '1.1rem', lineHeight: 1.6 }}>
          {matchScore > 85 ? "Basically the same person. Musical soulmates." : 
           matchScore > 65 ? "Incredible overlap! You definitely share the same 'Frequency'." :
           matchScore > 40 ? "Great harmony. You have a lot of common ground to talk about." :
           matchScore > 20 ? "Different tastes, but you definitely have a few shared anthems." :
           "Two different worlds. The perfect chance to expand your horizons!"}
        </div>
      </div>

      {/* DNA BREAKDOWN */}
      {dna1 && dna2 && (
        <>
          <div className="section-label">Deep Audio Profile</div>
          <div className="card" style={{ marginBottom: '3rem' }}>
            <div className="card-title"><div className="dot" /> Audio DNA Comparison</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              {FEATURES.map((feat, i) => {
                const val1 = dna1[i] || 0
                const val2 = dna2[i] || 0
                const norm1 = Math.min(100, Math.max(5, (val1 + 1) * 45))
                const norm2 = Math.min(100, Math.max(5, (val2 + 1) * 45))
                return (
                  <div key={feat} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                      <span>{feat}</span>
                      <span>{Math.abs(val1 - val2).toFixed(2)} delta</span>
                    </div>
                    <div style={{ height: 12, background: 'var(--surface3)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', height: '100%', left: 0, width: `${norm1}%`, background: 'var(--accent)', opacity: 0.8, transition: 'width 1s ease' }} />
                      <div style={{ position: 'absolute', height: '100%', left: 0, width: `${norm2}%`, background: 'var(--green)', opacity: 0.7, transition: 'width 1s 0.2s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6rem', color: 'var(--accent)', fontFamily: 'monospace' }}>
                <div style={{ width: 10, height: 10, background: 'var(--accent)', opacity: 0.8, borderRadius: 2 }} /> YOU
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6rem', color: 'var(--green)', fontFamily: 'monospace' }}>
                <div style={{ width: 10, height: 10, background: 'var(--green)', borderRadius: 2 }} /> {(sharedName || 'FRIEND').toUpperCase()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* HERO STATS SIDE BY SIDE */}
      <div className="section-label">Volume Comparison</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.6rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>YOUR ACTIVITY</div>
          <HeroStats stats={userStats || dummyStats} />
        </div>
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.6rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>{(sharedName || 'FRIEND').toUpperCase()}'S ACTIVITY</div>
          <HeroStats stats={sharedStats || dummyStats} />
        </div>
      </div>

      {/* YEARLY LISTENING */}
      <div className="card fade-up" style={{ marginBottom: '3rem' }}>
        <div className="card-title"><div className="dot" /> Listening Volume By Year</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '1rem' }}>
          {allYears.map(yr => {
            const ms1 = timeline1.find(b => b[0] === yr)?.[1] || 0
            const ms2 = timeline2.find(b => b[0] === yr)?.[1] || 0
            return (
              <div key={yr} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '3rem', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', color: 'var(--muted)' }}>{yr}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1, height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--accent)', opacity: 0.8, width: `${(ms1 / maxTimelineMs) * 100}%`, transition: 'width 1s ease' }} />
                    </div>
                    <div style={{ width: '4rem', fontSize: '0.6rem', fontFamily: 'monospace', textAlign: 'right', color: 'var(--accent)' }}>{msToReadable(ms1)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1, height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--green)', width: `${(ms2 / maxTimelineMs) * 100}%`, transition: 'width 1s 0.2s ease' }} />
                    </div>
                    <div style={{ width: '4rem', fontSize: '0.6rem', fontFamily: 'monospace', textAlign: 'right', color: 'var(--green)' }}>{msToReadable(ms2)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MUTUAL LOVE */}
      <div className="section-label">What You Both Love</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 4, border: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--green)', fontSize: '1.8rem', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>TOP 5 SHARED ARTISTS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mutualArtists.length > 0 ? mutualArtists.map((a, i) => (
              <div key={a.name} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--surface3)', paddingBottom: '1rem' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: 'rgba(255,255,255,0.15)', minWidth: '1.5rem' }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontFamily: "'Space Mono', monospace", marginBottom: '0.5rem', fontWeight: 'bold' }}>{a.name}</div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                    <div style={{ color: 'var(--accent)' }}>YOU: {msToReadable(a.userMs)}</div>
                    <div style={{ color: 'var(--green)' }}>{(sharedName || 'FRIEND').toUpperCase()}: {msToReadable(a.sharedMs)}</div>
                  </div>
                </div>
              </div>
            )) : <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: "'Space Mono', monospace" }}>No shared artists.</span>}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 4, border: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", color: 'var(--green)', fontSize: '1.8rem', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>TOP 5 SHARED TRACKS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mutualTracks.length > 0 ? mutualTracks.map((t, i) => (
              <div key={t.name} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--surface3)', paddingBottom: '1rem' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: 'rgba(255,255,255,0.15)', minWidth: '1.5rem' }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontFamily: "'Space Mono', monospace", fontWeight: 'bold' }}>{t.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace", marginBottom: '0.5rem' }}>{t.artist}</div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                    <div style={{ color: 'var(--accent)' }}>YOU: {msToReadable(t.userMs)}</div>
                    <div style={{ color: 'var(--green)' }}>{(sharedName || 'FRIEND').toUpperCase()}: {msToReadable(t.sharedMs)}</div>
                  </div>
                </div>
              </div>
            )) : <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: "'Space Mono', monospace" }}>No shared tracks.</span>}
          </div>
        </div>
      </div>

      {/* HEATMAP COMPARISON */}
      <div className="section-label">Vibe & Schedule</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.6rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>YOUR HEATMAP</div>
          <Heatmap heatmap={u.heatmap || dummyStats.heatmap} />
        </div>
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.6rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>{(sharedName || 'FRIEND').toUpperCase()}'S HEATMAP</div>
          <Heatmap heatmap={s.heatmap || dummyStats.heatmap} />
        </div>
      </div>

      {/* INSIGHTS COMPARISON */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.6rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>YOUR INSIGHTS</div>
          <ListeningInsights stats={userStats || dummyStats} />
        </div>
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.6rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>{(sharedName || 'FRIEND').toUpperCase()}'S INSIGHTS</div>
          <ListeningInsights stats={sharedStats || dummyStats} />
        </div>
      </div>

      {/* PLATFORMS COMPARISON */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.6rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>YOUR PLATFORMS</div>
          <Platforms topPlatforms={u.topPlatforms || []} />
        </div>
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.6rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>{(sharedName || 'FRIEND').toUpperCase()}'S PLATFORMS</div>
          <Platforms topPlatforms={s.topPlatforms || []} />
        </div>
      </div>
    </div>
  )
}
