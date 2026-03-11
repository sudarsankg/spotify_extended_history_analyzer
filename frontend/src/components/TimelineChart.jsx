import React, { useState } from 'react'
import { msToHM } from '../utils/dataProcessing'

export default function TimelineChart({ timeline }) {
  const [tooltip, setTooltip] = useState(null)

  if (!timeline || !timeline.buckets.length) return null

  const maxVal = Math.max(...timeline.buckets.map(b => b[1]))
  const n = timeline.buckets.length
  const labelEvery = n <= 6 ? 1 : n <= 12 ? 2 : n <= 24 ? 3 : 4

  return (
    <div className="card fade-up">
      <div className="card-title">
        <div className="dot" />
        {timeline.title}
      </div>

      <div style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Tooltip line */}
          <div style={{
            height: '1rem',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.65rem',
            color: 'var(--green)',
            textAlign: 'center',
            marginBottom: '0.4rem',
            opacity: tooltip ? 1 : 0
          }}>
            {tooltip ? `${tooltip.key}: ${msToHM(tooltip.ms)}` : '\u00a0'}
          </div>

          {/* Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60, padding: '0 2px' }}>
            {timeline.buckets.map(([key, ms]) => (
              <div
                key={key}
                style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%' }}
              >
                <div
                  style={{
                    width: '100%',
                    height: Math.max(3, Math.round(ms / maxVal * 56)),
                    background: 'var(--green)',
                    borderRadius: '2px 2px 0 0',
                    opacity: tooltip?.key === key ? 1 : 0.45,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={() => setTooltip({ key, ms })}
                  onMouseLeave={() => setTooltip(null)}
                />
              </div>
            ))}
          </div>

          {/* Labels */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, padding: '4px 2px 0', borderTop: '1px solid var(--border)', marginTop: '2px' }}>
            {timeline.buckets.map(([key], i) => (
              <div key={key} style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                {i % labelEvery === 0 && (
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.5rem',
                    color: 'var(--muted)',
                    whiteSpace: 'nowrap',
                  }}>{key}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
