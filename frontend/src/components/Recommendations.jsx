import React, { useState, useEffect, useRef } from 'react'
import { MONTH_NAMES } from '../utils/dataProcessing'

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"></path>
    <path d="M1 20v-6h6"></path>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
)

export default function Recommendations({ 
  allTracks, years = [], monthsByYear = {}, recYear, recMonth, setRecYear, setRecMonth,
  hitsRecs = [], diverseRecs = [], deepRecs = [], onRefresh, isDeepLoading,
  recMethod, setRecMethod, clusterViz, isSharedView = false
}) {
  const [viewMode, setViewType] = useState('hits')
  const [hoveredCluster, setHoveredCluster] = useState(null)
  
  // COLORS FOR CLUSTERS
  const CLUSTER_COLORS = [
    '#1DB954', '#1ED760', '#19E68C', '#16F5B8', 
    '#F59B00', '#FFB74D', '#FFD54F', '#FFE082'
  ]
  const [similarTarget, setSimilarTarget] = useState(null)
  const [similarRecs, setSimilarRecs] = useState([])
  const [similarMode, setSimilarMode] = useState('diverse')
  const [isSimilarLoading, setIsSimilarLoading] = useState(false)
  const [isTasteLoading, setIsTasteLoading] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [tasteMatch, setTasteMatch] = useState(null) // { name, score }
  
  // Independent period for Link Discovery
  const [checkYear, setCheckYear] = useState('all')
  const [checkMonth, setCheckMonth] = useState('all')
  
  const similarSectionRef = useRef(null)
  const displayRecs = viewMode === 'hits' ? hitsRecs : (viewMode === 'diverse' ? diverseRecs : deepRecs)

  const extractId = (url) => {
    try {
      const parts = url.split('/track/')
      if (parts.length < 2) return null
      return parts[1].split('?')[0]
    } catch (e) { return null }
  }

  useEffect(() => {
    if (similarTarget && similarSectionRef.current) {
      similarSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [similarTarget])

  const findSimilar = async (trackId, trackName, mode = 'diverse') => {
    const API_URL = import.meta.env.VITE_API_URL || ''
    setSimilarTarget({ id: trackId, name: trackName || "Your Song" })
    setSimilarMode(mode)
    setIsSimilarLoading(true)
    setTasteMatch(null)
    try {
      const res = await fetch(`${API_URL}/similar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: trackId, mode: mode })
      })
      const data = await res.json()
      if (data.status === 'success') {
        setSimilarRecs(data.recommendations || [])
        if (!trackName) setSimilarTarget(prev => ({ ...prev, name: data.source_name }))
      }
    } catch (e) { console.error(e) } finally { setIsSimilarLoading(false) }
  }

  const checkTaste = async () => {
    const id = extractId(linkInput)
    if (!id) { alert("Invalid Spotify Link!"); return; }
    
    setIsTasteLoading(true)
    setTasteMatch(null)
    setSimilarTarget(null)
    
    const trackStats = {}
    allTracks.forEach(song => {
      const ts = song.ts || song.endTime
      if (!ts) return
      if (checkYear !== 'all' && ts.slice(0, 4) !== checkYear) return
      if (checkMonth !== 'all' && ts.slice(5, 7) !== checkMonth) return
      const name = song.master_metadata_track_name || song.trackName
      if (name) {
        if (!trackStats[name]) trackStats[name] = { totalMs: 0, count: 0 }
        trackStats[name].totalMs += (song.ms_played || song.msPlayed || 0)
        trackStats[name].count += 1
      }
    })
    const weighted = Object.entries(trackStats)
      .sort((a,b) => b[1].totalMs - a[1].totalMs)
      .slice(0, 2000)
      .map(([n, s]) => ({ name: n, count: s.count }))

    if (weighted.length === 0) {
      alert("No history found for the selected period.");
      setIsTasteLoading(false);
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || ''
    try {
      const res = await fetch(`${API_URL}/check_taste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: id, top_tracks: weighted, seed: 42 })
      })
      const data = await res.json()
      if (data.status === 'success') {
        setTasteMatch({ name: data.name, score: data.match_score })
      } else { alert(data.message) }
    } catch (e) { console.error(e) } finally { setIsTasteLoading(false) }
  }

  const handleLinkSubmit = () => {
    const id = extractId(linkInput)
    if (id) { findSimilar(id, null, 'diverse'); setLinkInput('') }
    else { alert("Invalid Spotify Link!") }
  }

  return (
    <div style={{ padding: isSharedView ? '2rem 0 4rem' : '0 4rem 4rem' }}>
      
      {/* LINK SEARCH BOX */}
      <div style={{ marginBottom: '2.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>LINK DISCOVERY</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>Paste a song link to find similar music OR check your taste match for a specific period.</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface3)', padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid var(--border)' }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: 'var(--muted)', marginRight: '0.2rem' }}>TASTE PERIOD:</span>
            <select className="filter-select" value={checkYear} onChange={e => { setCheckYear(e.target.value); setCheckMonth('all'); }}>
              <option value="all">Overall</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {checkYear !== 'all' && monthsByYear[checkYear] && (
              <select className="filter-select" value={checkMonth} onChange={e => setCheckMonth(e.target.value)}>
                <option value="all">All months</option>
                {monthsByYear[checkYear].map(m => (
                  <option key={m} value={m}>{MONTH_NAMES[parseInt(m) - 1]}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="https://open.spotify.com/track/..." style={{ flex: 1, background: 'var(--surface3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.6rem 1rem', borderRadius: 4, fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', outline: 'none' }} />
          <button onClick={handleLinkSubmit} style={{ background: 'var(--green)', color: 'black', border: 'none', borderRadius: 4, padding: '0 1.2rem', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', cursor: 'pointer' }}>FIND SIMILAR</button>
          <button onClick={checkTaste} disabled={isTasteLoading} style={{ background: 'var(--accent)', color: 'black', border: 'none', borderRadius: 4, padding: '0 1.2rem', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', cursor: isTasteLoading ? 'not-allowed' : 'pointer' }}>
            {isTasteLoading ? 'ANALYZING...' : 'CHECK TASTE'}
          </button>
        </div>
      </div>

      {/* TASTE MATCH RESULT OR LOADING */}
      {isTasteLoading && (
        <div style={{ marginBottom: '2.5rem', background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 8, padding: '1.5rem', animation: 'fadeUp 0.4s ease' }}>
           <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Neural Network Training</div>
           <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'var(--text)', marginBottom: '1rem' }}>Analyzing your "{checkYear === 'all' ? 'Overall' : checkYear}" taste footprint...</div>
           <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent)', width: '100%', animation: 'load 2s infinite ease-in-out' }} />
           </div>
        </div>
      )}

      {tasteMatch && !isTasteLoading && (
        <div style={{ marginBottom: '2.5rem', background: 'rgba(245,155,0,0.1)', border: '1px solid var(--accent)', borderRadius: 8, padding: '1.5rem', animation: 'fadeUp 0.4s ease' }}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--accent)', textTransform: 'uppercase' }}>
                  Taste Match Analysis ({checkYear === 'all' ? 'Overall' : `${checkYear}${checkMonth !== 'all' ? ' ' + MONTH_NAMES[parseInt(checkMonth)-1] : ''}`})
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: 'var(--text)' }}>"{tasteMatch.name}" is a {Math.round(tasteMatch.score * 100)}% match!</div>
              </div>
              <button onClick={()=>setTasteMatch(null)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕ CLOSE</button>
           </div>
           <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 4, marginTop: '1rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent)', width: `${Math.max(5, tasteMatch.score * 100)}%`, transition: 'width 1s ease' }} />
           </div>
        </div>
      )}

      {/* AI RECOMMENDATIONS GRID - Hidden in shared view */}
      {!isSharedView && (
        <>
          <div className="section-label">AI Recommendations</div>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--green)',
            borderRadius: 4, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface3)', padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: 'var(--muted)', marginRight: '0.2rem' }}>AI TASTE PERIOD:</span>
                <select className="filter-select" value={recYear} onChange={e => { setRecYear(e.target.value); setRecMonth('all'); }}>
                  <option value="all">All time</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {recYear !== 'all' && monthsByYear[recYear] && (
                  <select className="filter-select" value={recMonth} onChange={e => setRecMonth(e.target.value)}>
                    <option value="all">All months</option>
                    {monthsByYear[recYear].map(m => (
                      <option key={m} value={m}>{MONTH_NAMES[parseInt(m) - 1]}</option>
                    ))}
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', background: 'var(--surface3)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <button onClick={() => setRecMethod('autoencoder')} style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', fontSize: '0.6rem', fontFamily: "'Space Mono', monospace", cursor: 'pointer', background: recMethod === 'autoencoder' ? 'var(--green)' : 'transparent', color: recMethod === 'autoencoder' ? 'black' : 'var(--muted)', transition: 'all 0.2s' }}>AUTOENCODER</button>
                <button onClick={() => setRecMethod('clustering')} style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', fontSize: '0.6rem', fontFamily: "'Space Mono', monospace", cursor: 'pointer', background: recMethod === 'clustering' ? 'var(--green)' : 'transparent', color: recMethod === 'clustering' ? 'black' : 'var(--muted)', transition: 'all 0.2s' }}>COSINE SIMILARITY</button>
              </div>
              <div style={{ display: 'flex', background: 'var(--surface3)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <button onClick={() => setViewType('hits')} style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', fontSize: '0.6rem', fontFamily: "'Space Mono', monospace", cursor: 'pointer', background: viewMode === 'hits' ? 'var(--green)' : 'transparent', color: viewMode === 'hits' ? 'black' : 'var(--muted)', transition: 'all 0.2s' }}>POPULAR HITS</button>
                <button onClick={() => setViewType('diverse')} style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', fontSize: '0.6rem', fontFamily: "'Space Mono', monospace", cursor: 'pointer', background: viewMode === 'diverse' ? 'var(--green)' : 'transparent', color: viewMode === 'diverse' ? 'black' : 'var(--muted)', transition: 'all 0.2s' }}>DIVERSE 100K</button>
                <button onClick={() => setViewType('deep')} style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', fontSize: '0.6rem', fontFamily: "'Space Mono', monospace", cursor: 'pointer', background: viewMode === 'deep' ? 'var(--accent)' : 'transparent', color: viewMode === 'deep' ? 'black' : 'var(--muted)', transition: 'all 0.2s' }}>FULL 5M</button>
              </div>
            </div>
            <button onClick={onRefresh} disabled={isDeepLoading} className="refresh-circle-btn" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.3s ease', outline: 'none', padding: 0 }}>
              <span style={{ display: 'flex', transform: isDeepLoading ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s ease' }}><RefreshIcon /></span>
            </button>
          </div>

          <div style={{ background: 'rgba(29,185,84,0.05)', border: '1px solid var(--green)', borderRadius: '4px', padding: '1rem', marginBottom: '1.5rem', fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: 'var(--green)' }}>
            {recYear === 'all' ? "Currently analyzing your overall taste. " : `Currently analyzing your taste from ${recYear}${recMonth !== 'all' ? '-' + recMonth : ''}. `}
            {viewMode === 'hits' && "Scanning Top 10,000 popular songs."}
            {viewMode === 'diverse' && "Scanning Top 100,000 popular songs."}
            {viewMode === 'deep' && (deepRecs.length > 0 ? "Scanned all 4.7 million songs." : "⏳ Deep scan running...")}
          </div>

          {displayRecs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
              {displayRecs.map((t, i) => (
                <div key={`${viewMode}-${t.id}-${i}`} style={{ background: 'linear-gradient(145deg, var(--surface), #151515)', border: '1px solid var(--green)', borderRadius: 12, padding: '1rem', animation: `fadeUp 0.3s ease ${i * 0.04}s both`, position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--green)', color: 'black', fontSize: '0.6rem', fontWeight: 'bold', padding: '4px 10px', fontFamily: 'monospace', borderRadius: '0 12px 0 12px', zIndex: 10 }}>{viewMode.toUpperCase()} MATCH</div>
                  <iframe style={{ borderRadius: 12 }} title={`spotify-${t.id}`} src={`https://open.spotify.com/embed/track/${t.id}?utm_source=generator`} width="100%" height="152" frameBorder="0" allowFullScreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>
                         MATCH CONFIDENCE: {recMethod === 'clustering' ? t.score.toFixed(4) : (1 - t.score).toFixed(4)}
                       </div>
                       <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            background: 'var(--green)', 
                            width: `${recMethod === 'clustering' ? Math.max(10, t.score * 100) : Math.max(10, 100 - (t.score * 100))}%` 
                          }} />
                       </div>
                       {t.anchor_song && (
                          <div style={{ 
                            marginTop: '0.6rem', 
                            fontSize: '0.6rem', 
                            fontFamily: "'Space Mono', monospace", 
                            color: 'var(--muted)',
                            padding: '4px 8px',
                            background: 'rgba(29,185,84,0.1)',
                            borderRadius: 4,
                            borderLeft: '2px solid var(--green)'
                          }}>
                            <span style={{ color: 'var(--green)', opacity: 0.8 }}>RECOMMENDED BECAUSE YOU LIKE:</span><br/>
                            {t.anchor_song}
                          </div>
                       )}
                    </div>
                    <button onClick={() => findSimilar(t.id, t.name)} className="find-sim-btn" style={{ marginLeft: '1rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--green)', borderRadius: 4, padding: '0.3rem 0.6rem', fontSize: '0.6rem', fontFamily: "'Space Mono', monospace", cursor: 'pointer', transition: 'all 0.2s' }}>✨ SIMILAR</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CLUSTER VISUALIZER */}
          {recMethod === 'clustering' && clusterViz && (
            <div style={{ marginBottom: '4rem', animation: 'fadeUp 0.6s ease' }}>
              <div className="section-label">Your Taste Clusters (PCA Projection)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem' }}>
                
                {/* 2D SCATTER MAP */}
                <div style={{ position: 'relative', background: '#0a0a0a', borderRadius: 8, border: '1px solid var(--border)', padding: '1rem', height: '400px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
                    <defs>
                       <filter id="glow">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                          <feMerge>
                             <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                          </feMerge>
                       </filter>
                    </defs>
                    <line x1="200" y1="0" x2="200" y2="400" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    
                    {(() => {
                      const allX = clusterViz.points.map(p => p.x);
                      const allY = clusterViz.points.map(p => p.y);
                      const minX = Math.min(...allX);
                      const maxX = Math.max(...allX);
                      const minY = Math.min(...allY);
                      const maxY = Math.max(...allY);
                      const pad = (maxX - minX) * 0.1;
                      
                      const scaleX = (x) => 40 + (x - minX) / (maxX - minX + pad || 1) * 320;
                      const scaleY = (y) => 360 - (y - minY) / (maxY - minY + pad || 1) * 320;

                      return (
                        <>
                          {clusterViz.points.map((p, i) => (
                            <circle 
                              key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r="1.5" 
                              fill={CLUSTER_COLORS[p.cluster % CLUSTER_COLORS.length]} 
                              opacity="0.4"
                            />
                          ))}

                          {clusterViz.clusters.map((c, i) => {
                            const nx = scaleX(c.center_x);
                            const ny = scaleY(c.center_y);
                            return (
                              <g key={`center-${i}`} 
                                 onMouseEnter={() => setHoveredCluster(c)}
                                 onMouseLeave={() => setHoveredCluster(null)}
                                 style={{ cursor: 'pointer' }}>
                                <circle 
                                  cx={nx} cy={ny} r="8" 
                                  fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} 
                                  filter="url(#glow)"
                                  stroke="white" strokeWidth="2"
                                />
                                <text x={nx} y={ny + 20} textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace" fontWeight="bold" style={{ textShadow: '0 0 4px black' }}>
                                  C{i+1}
                                </text>
                              </g>
                            )
                          })}
                        </>
                      )
                    })()}
                  </svg>
                  <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', fontSize: '0.6rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                    X/Y axes represent 9 audio features compressed via Principal Component Analysis.
                  </div>
                </div>

                {/* FEATURE INTERPRETATION */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', marginBottom: '1rem', color: hoveredCluster ? CLUSTER_COLORS[hoveredCluster.id % CLUSTER_COLORS.length] : 'var(--text)' }}>
                    {hoveredCluster ? (
                      <>
                        CLUSTER {hoveredCluster.id + 1}: {hoveredCluster.mean_song}
                      </>
                    ) : 'HOVER A CLUSTER TO ANALYZE'}
                  </div>
                  
                  {!hoveredCluster ? (
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: "'Space Mono', monospace", lineHeight: '1.6' }}>
                      Each circle represents a central point in your listening history. Hover over a cluster to see the 9-dimensional "DNA" and your top 5 songs that define it.
                    </div>
                  ) : (
                    <>
                      {hoveredCluster.top_songs && hoveredCluster.top_songs.length > 0 && (
                        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                          <div style={{ fontSize: '0.6rem', fontFamily: "'Space Mono', monospace", color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Top Cluster Anthems:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {hoveredCluster.top_songs.map((song, idx) => (
                              <div key={idx} style={{ fontSize: '0.7rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Space Mono', monospace" }}>
                                <span style={{ color: CLUSTER_COLORS[hoveredCluster.id % CLUSTER_COLORS.length], fontWeight: 'bold' }}>#{idx + 1}</span> {song}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div style={{ display: 'grid', gap: '0.8rem' }}>
                        {Object.entries(hoveredCluster.features).map(([feat, val]) => {
                          const width = Math.min(100, Math.max(5, (val + 2) * 20));
                          return (
                            <div key={feat}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontFamily: "'Space Mono', monospace", marginBottom: '0.2rem' }}>
                                <span style={{ textTransform: 'uppercase' }}>{feat}</span>
                                <span>{val.toFixed(2)}</span>
                              </div>
                              <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: CLUSTER_COLORS[hoveredCluster.id % CLUSTER_COLORS.length], width: `${width}%`, transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* SIMILAR SONGS SECTION */}
      <div ref={similarSectionRef}>
        {similarTarget && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="section-label" style={{ color: 'var(--accent)' }}>✨ Songs Similar to "{similarTarget.name}"</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 8, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button onClick={() => { setSimilarTarget(null); setSimilarRecs([]); }} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: 4, fontSize: '0.7rem' }}>✕ CLOSE</button>
                  <div style={{ display: 'flex', background: 'var(--surface3)', padding: '2px', borderRadius: '6px' }}>
                    {['hits', 'diverse'].map(m => (
                      <button key={m} onClick={() => findSimilar(similarTarget.id, similarTarget.name, m)} style={{ padding: '0.4rem 1rem', border: 'none', borderRadius: '4px', fontSize: '0.6rem', fontFamily: "'Space Mono', monospace", cursor: 'pointer', background: similarMode === m ? 'var(--accent)' : 'transparent', color: similarMode === m ? 'black' : 'var(--muted)', transition: 'all 0.2s' }}>{m.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                {isSimilarLoading && <div className="spinner" style={{ width: 20, height: 20, border: '2px solid var(--accent)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {similarRecs.map((t) => (
                  <div key={`sim-${t.id}`} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.75rem' }}>
                    <iframe title={`spotify-sim-${t.id}`} style={{ borderRadius: 8 }} src={`https://open.spotify.com/embed/track/${t.id}`} width="100%" height="80" frameBorder="0" loading="lazy"></iframe>
                    <div style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '0.6rem', fontFamily: 'monospace', color: 'var(--accent)' }}>Similarity: {t.score.toFixed(4)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .refresh-circle-btn:hover:not(:disabled) { border-color: var(--green) !important; transform: scale(1.05); }
        .refresh-circle-btn:hover:not(:disabled) span { transform: rotate(180deg); }
        .find-sim-btn:hover { background: var(--green) !important; color: black !important; border-color: var(--green) !important; }
        @keyframes load { 0% { margin-left: -100%; } 100% { margin-left: 100%; } }
      `}</style>
    </div>
  )
}
