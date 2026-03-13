import React from 'react'
import { MONTH_NAMES } from '../utils/dataProcessing'

export default function GlobalFilter({ years, year, month, onYearChange, onMonthChange, periodLabel, onReset, onShare, isSharing }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1rem',
    }}>
    <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="reset-btn" onClick={onReset}>Load New Files</button>
        <button 
          className="reset-btn" 
          onClick={() => onShare(false)} 
          disabled={isSharing !== null}
          style={{ 
            borderColor: 'var(--green)', 
            color: 'var(--green)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {isSharing === 'share' ? 'GENERATING...' : 'SHARE MY STATS'}
        </button>
        <button 
          className="reset-btn" 
          onClick={() => onShare(true)} 
          disabled={isSharing !== null}
          style={{ 
            borderColor: 'var(--accent)', 
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {isSharing === 'compare' ? 'GENERATING...' : 'COMPARE WITH OTHERS'}
        </button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: '0.6rem 1rem',
      }}>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.6rem',
          letterSpacing: '0.2em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          marginRight: '0.2rem',
        }}>PERIOD</span>

        <select
          className="filter-select"
          value={year}
          onChange={e => onYearChange(e.target.value)}
        >
          <option value="all">All time</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {year !== 'all' && (
          <select
            className="filter-select"
            value={month}
            onChange={e => onMonthChange(e.target.value)}
          >
            <option value="all">All months</option>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
            ))}
          </select>
        )}

        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1rem',
          letterSpacing: '0.08em',
          color: 'var(--green)',
          minWidth: '4rem',
        }}>
          {periodLabel}
        </div>
      </div>
    </div>
  )
}
