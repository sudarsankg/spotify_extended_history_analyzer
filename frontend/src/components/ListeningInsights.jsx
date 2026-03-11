import React from 'react'

export default function ListeningInsights({ stats }) {
  const { skipPct, skipped, totalPlays, nightPlays, morningPlays, longestStreak, incognitoPlays } = stats

  const totalClassified = nightPlays + morningPlays
  const nightPct = totalClassified > 0 ? Math.round(nightPlays / totalClassified * 100) : 50
  const isNightOwl = nightPct >= 50
  const owlPct = isNightOwl ? nightPct : (100 - nightPct)
  const incognitoPct = totalPlays > 0 ? Math.round(incognitoPlays / totalPlays * 100) : 0
  const owlTitle = isNightOwl ? 'Night Owl' : 'Early Bird'
  const owlColor = isNightOwl ? '#6c63ff' : 'var(--accent)'

  const makeCell = (label, value, subtext, color, borderRight, borderBottom) => (
    <div style={{
      padding: '0.75rem 0.5rem',
      borderRight: borderRight ? '1px solid var(--border)' : 'none',
      borderBottom: borderBottom ? '1px solid var(--border)' : 'none',
    }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', letterSpacing: '0.04em', color: color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: 'var(--muted)', marginTop: '0.2rem', lineHeight: 1.3 }}>{subtext}</div>
    </div>
  )

  return (
    <div className="card fade-up" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-title">
        <div className="dot" style={{ background: '#e74c3c' }} />
        Listening Insights
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
        {makeCell('Skip Rate', `${skipPct}%`, `${skipped.toLocaleString()} of ${totalPlays.toLocaleString()} plays`, '#e74c3c', true, true)}
        {makeCell('Longest Streak', `${longestStreak} days`, 'consecutive active days', 'var(--accent)', false, true)}
        {makeCell('Incognito Plays', incognitoPlays.toLocaleString(), `${incognitoPct}% of all plays`, 'var(--green)', true, false)}
        
        <div style={{ padding: '0.75rem 0.5rem' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.2rem' }}>{owlTitle}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', letterSpacing: '0.04em', color: owlColor, lineHeight: 1 }}>{owlPct}%</div>
            <span className="chip" style={{ background: isNightOwl ? 'rgba(108,99,255,0.15)' : 'rgba(245,155,0,0.15)', color: owlColor, fontSize: '0.5rem' }}>
              {isNightOwl ? 'NIGHT MODE' : 'MORNING'}
            </span>
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: 'var(--muted)', marginTop: '0.2rem', lineHeight: 1.5 }}>
            {nightPlays.toLocaleString()} late-night · {morningPlays.toLocaleString()} morning
          </div>
        </div>
      </div>
    </div>
  )
}
