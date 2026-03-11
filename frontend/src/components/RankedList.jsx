import React from 'react'
import { msToHM } from '../utils/dataProcessing'

export default function RankedList({ title, items, getName, getSub, maxMs, dotColor }) {
  if (!items || items.length === 0) {
    return (
      <div className="card fade-up">
        <div className="card-title">
          <div className="dot" style={dotColor ? { background: dotColor } : {}} />
          {title}
        </div>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: 'var(--muted)', padding: '1rem 0' }}>
          No data for this period
        </p>
      </div>
    )
  }

  return (
    <div className="card fade-up">
      <div className="card-title">
        <div className="dot" style={dotColor ? { background: dotColor } : {}} />
        {title}
      </div>
      <ul style={{ listStyle: 'none' }}>
        {items.map((item, i) => (
          <li key={item.key || i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 0',
            borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.1rem',
              color: i < 3 ? 'var(--accent)' : 'var(--muted)',
              width: '1.5rem',
              flexShrink: 0,
              textAlign: 'right',
            }}>{i + 1}</span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {getName(item)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace", marginTop: '0.15rem' }}>
                {getSub(item)}
              </div>
            </div>

            <div style={{ width: 80, height: 3, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
              <div style={{
                height: '100%',
                background: 'var(--green)',
                borderRadius: 2,
                width: `${maxMs ? Math.round(item.ms / maxMs * 100) : 0}%`,
              }} />
            </div>

            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.7rem',
              color: 'var(--green)',
              flexShrink: 0,
              textAlign: 'right',
              minWidth: '4rem',
            }}>
              {msToHM(item.ms)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
