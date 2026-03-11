import React, { useState } from 'react'
import { msToHM } from '../utils/dataProcessing'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Heatmap({ heatmap }) {
  const [tooltip, setTooltip] = useState(null)
  const maxHeat = Math.max(...Object.values(heatmap))

  return (
    <div className="card fade-up">
      <div className="card-title">
        <div className="dot" />
        Listening Heatmap
        <span className="chip">Hour × Day</span>
      </div>

      {/* PRE-ALLOCATED TOOLTIP SPACE TO PREVENT JUMPING */}
      <div style={{
        height: '1.2rem',
        marginBottom: '0.5rem',
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.7rem',
        color: 'var(--green)',
      }}>
        {tooltip || ' '}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2rem repeat(24, 1fr)',
        gap: 2,
        fontSize: '0.55rem',
        fontFamily: "'Space Mono', monospace",
        color: 'var(--muted)',
      }}>
        {/* Hour headers */}
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} style={{ textAlign: 'center', paddingBottom: 2 }}>{h % 6 === 0 ? h : ''}</div>
        ))}

        {/* Day rows */}
        {DAYS.map((day, d) => (
          <React.Fragment key={day}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4, fontSize: '0.55rem' }}>
              {day}
            </div>
            {Array.from({ length: 24 }, (_, h) => {
              const val = heatmap[`${d}_${h}`] || 0
              const intensity = maxHeat > 0 ? val / maxHeat : 0
              const alpha = Math.round(intensity * 255).toString(16).padStart(2, '0')
              return (
                <div
                  key={h}
                  style={{
                    aspectRatio: 1,
                    borderRadius: 2,
                    background: `#1DB954${alpha}`,
                    cursor: 'default',
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.3)'
                    setTooltip(`${day} ${h}:00 — ${msToHM(val)}`)
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = ''
                    setTooltip(null)
                  }}
                />
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
