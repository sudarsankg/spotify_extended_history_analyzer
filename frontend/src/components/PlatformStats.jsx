import React from 'react'

export function Platforms({ topPlatforms }) {
  if (!topPlatforms.length) return null
  const total = topPlatforms.reduce((s, [, c]) => s + c, 0)
  const max = topPlatforms[0][1]

  return (
    <div className="card fade-up">
      <div className="card-title">
        <div className="dot" style={{ background: 'var(--accent)' }} />
        Platforms Used
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {topPlatforms.map(([name, count]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ flex: 2, height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${Math.round(count / max * 100)}%` }} />
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: 'var(--muted)', minWidth: '3rem', textAlign: 'right' }}>
              {Math.round(count / total * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkipGauge({ skipPct, skipped, totalPlays }) {
  const circ = 2 * Math.PI * 42
  const dashLen = (skipPct / 100) * circ * 0.75

  return (
    <div className="card fade-up">
      <div className="card-title">
        <div className="dot" style={{ background: '#e74c3c' }} />
        Skip Rate
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
        <svg width="110" height="80" viewBox="0 0 110 90" style={{ overflow: 'visible' }}>
          <path d="M 13 77 A 42 42 0 1 1 97 77" fill="none" stroke="#222" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M 13 77 A 42 42 0 1 1 97 77"
            fill="none"
            stroke="#e74c3c"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dashLen} ${circ}`}
            strokeDashoffset={-circ * 0.125}
          />
          <text x="55" y="68" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', fill: 'var(--text)', textAnchor: 'middle' }}>
            {skipPct}%
          </text>
          <text x="55" y="82" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.45rem', fill: 'var(--muted)', textAnchor: 'middle', letterSpacing: '0.15em' }}>
            SKIP RATE
          </text>
        </svg>
        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace", textAlign: 'center' }}>
          {skipped.toLocaleString()} skipped / {totalPlays.toLocaleString()} plays
        </div>
      </div>
    </div>
  )
}
