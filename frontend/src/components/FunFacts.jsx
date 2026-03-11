import React from 'react'
import { msToHM, formatHour } from '../utils/dataProcessing'

export default function FunFacts({ stats }) {
  const { bestDay, topHour, topYear, shufflePlays, totalPlays, offlinePlays, totalDays, avgPerDay, skipPct, skipped } = stats

  const facts = [
    { icon: '🔥', val: bestDay ? `${msToHM(bestDay[1])} on ${bestDay[0]}` : '—', desc: 'Most intense listening day' },
    { icon: '🕐', val: topHour ? formatHour(topHour[0]) : '—', desc: 'Most active hour of the day' },
    { icon: '📅', val: topYear ? topYear[0] : '—', desc: 'Your biggest listening year' },
    { icon: '🔀', val: `${totalPlays > 0 ? Math.round(shufflePlays / totalPlays * 100) : 0}%`, desc: 'Played on shuffle' },
    { icon: '📴', val: offlinePlays.toLocaleString(), desc: 'Plays while offline' },
    { icon: '📆', val: `${avgPerDay} tracks/day`, desc: `Across ${totalDays} active days` },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1rem',
      marginBottom: '2rem',
    }}>
      {facts.map(({ icon, val, desc }) => (
        <div key={desc} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--green), transparent)' }} />
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: 'var(--green)', letterSpacing: '0.05em', lineHeight: 1.1 }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem', fontFamily: "'Space Mono', monospace" }}>{desc}</div>
        </div>
      ))}
    </div>
  )
}
