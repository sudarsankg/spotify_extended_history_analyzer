import React from 'react'
import { msToHM } from '../utils/dataProcessing'

export default function HeroStats({ stats }) {
  const items = [
    { num: msToHM(stats.totalMs), label: 'Total Time Listened' },
    { num: stats.totalPlays.toLocaleString(), label: 'Total Plays' },
    { num: stats.uniqueTracks.toLocaleString(), label: 'Unique Tracks' },
    { num: stats.uniqueArtists.toLocaleString(), label: 'Unique Artists' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 1,
      background: 'var(--border)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: '2rem',
    }}>
      {items.map(({ num, label }) => (
        <div key={label} style={{
          background: 'var(--surface)',
          padding: '1.5rem',
          position: 'relative',
        }}
          onMouseEnter={e => e.currentTarget.querySelector('.top-line').style.opacity = 1}
          onMouseLeave={e => e.currentTarget.querySelector('.top-line').style.opacity = 0}
        >
          <div className="top-line" style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'var(--green)', opacity: 0, transition: 'opacity 0.2s',
          }} />
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '2.8rem',
            letterSpacing: '0.02em',
            color: 'var(--green)',
            lineHeight: 1,
          }}>{num}</div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            marginTop: '0.4rem',
          }}>{label}</div>
        </div>
      ))}
    </div>
  )
}
