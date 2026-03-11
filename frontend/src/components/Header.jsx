import React from 'react'

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, fill: 'black' }}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.4c-.2.3-.62.4-.92.2-2.52-1.54-5.7-1.9-9.44-1.04-.36.08-.72-.15-.8-.51-.08-.36.15-.72.51-.8 4.1-.94 7.62-.54 10.45 1.2.3.2.4.62.2.95zm1.24-2.76c-.25.37-.75.49-1.12.24-2.88-1.77-7.27-2.28-10.68-1.25-.42.13-.87-.11-1-.53-.12-.42.11-.87.53-1 3.87-1.18 8.67-.6 11.96 1.42.37.25.49.75.31 1.12zm.11-2.87C14.5 8.82 9.17 8.63 6 9.57c-.5.15-1.03-.13-1.18-.64-.15-.5.13-1.03.64-1.18 3.63-1.1 9.64-.89 13.44 1.47.44.26.58.82.32 1.26-.26.43-.82.57-1.22.29z"/>
  </svg>
)

export default function Header() {
  return (
    <header style={{
      padding: '3rem 4rem 2rem',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: 48, height: 48,
          background: 'var(--green)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <SpotifyIcon />
        </div>
        <div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '2.8rem',
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}>
            <span style={{ color: 'var(--green)' }}>Spotify</span> Wrapped+
          </h1>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.7rem',
            color: 'var(--muted)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: '0.3rem',
          }}>Extended History Analyzer</div>
        </div>
      </div>
    </header>
  )
}
