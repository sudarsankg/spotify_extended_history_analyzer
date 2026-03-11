import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import DropZone from './components/DropZone'
import GlobalFilter from './components/GlobalFilter'
import HeroStats from './components/HeroStats'
import FunFacts from './components/FunFacts'
import RankedList from './components/RankedList'
import TimelineChart from './components/TimelineChart'
import Heatmap from './components/Heatmap'
import { Platforms } from './components/PlatformStats'
import ListeningInsights from './components/ListeningInsights'
import Recommendations from './components/Recommendations'
import { useListeningData } from './hooks/useListeningData'

export default function App() {
  const {
    allTracks, loadTracks, reset,
    year, month, setMonth, handleYearChange,
    years, monthsByYear, stats, timeline, periodLabel,
  } = useListeningData()

  // AI State
  const [aiStatus, setAiStatus] = useState('')
  const [hitsRecs, setHitsRecs] = useState([])
  const [diverseRecs, setDiverseRecs] = useState([])
  const [deepRecs, setDeepRecs] = useState([])
  const [clusterViz, setClusterViz] = useState(null)
  const [isDeepLoading, setIsDeepLoading] = useState(false)
  const [currentSeed, setCurrentSeed] = useState(42)
  const [recMethod, setRecMethod] = useState('autoencoder') // 'autoencoder' or 'clustering'

  // AI Period State (Separate from the dashboard filter)
  const [recYear, setRecYear] = useState('all')
  const [recMonth, setRecMonth] = useState('all')

  const hasData = allTracks.length > 0

  const getWeightedTopTracks = (data, filterYear, filterMonth) => {
    const trackStats = {}
    data.forEach(song => {
      const ts = song.ts || song.endTime
      if (!ts) return
      if (filterYear !== 'all' && ts.slice(0, 4) !== filterYear) return
      if (filterMonth !== 'all' && ts.slice(5, 7) !== filterMonth) return
      const name = song.master_metadata_track_name || song.trackName
      if (name) {
        if (!trackStats[name]) trackStats[name] = { totalMs: 0, count: 0 }
        trackStats[name].totalMs += (song.ms_played || song.msPlayed || 0)
        trackStats[name].count += 1
      }
    })
    return Object.entries(trackStats)
      .sort((a, b) => b[1].totalMs - a[1].totalMs)
      .slice(0, 2000)
      .map(([name, stats]) => ({ name, count: stats.count }))
  }

  const runAnalysis = async (weightedTracks, seed, method) => {
    if (weightedTracks.length === 0) {
      setAiStatus('No listening history found for this period.')
      return
    }
    const methodLabel = method === 'clustering' ? 'Clustering + Cosine' : 'Autoencoder'
    setAiStatus(`Training weighted ${methodLabel} on ${weightedTracks.length} tracks...`)
    setHitsRecs([])
    setDiverseRecs([])
    setDeepRecs([])
    setClusterViz(null)
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
    
    try {
      const resHits = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ top_tracks: weightedTracks, seed, mode: 'hits', method })
      })
      const dataHits = await resHits.json()
      setHitsRecs(dataHits.recommendations || [])
      if (dataHits.cluster_viz) setClusterViz(dataHits.cluster_viz)

      const resDiv = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ top_tracks: weightedTracks, seed, mode: 'diverse', method })
      })
      const dataDiv = await resDiv.json()
      setDiverseRecs(dataDiv.recommendations || [])

      setIsDeepLoading(true)
      const resDeep = await fetch(`${API_URL}/deep_analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ top_tracks: weightedTracks, seed, method })
      })
      const dataDeep = await resDeep.json()
      setDeepRecs(dataDeep.recommendations || [])
      setAiStatus(`Analysis complete using ${methodLabel}!`)
    } catch (e) {
      setAiStatus('Analysis failed.')
    } finally {
      setIsDeepLoading(false)
    }
  }

  useEffect(() => {
    if (hasData) {
      const weighted = getWeightedTopTracks(allTracks, recYear, recMonth)
      runAnalysis(weighted, currentSeed, recMethod)
    }
  }, [recYear, recMonth, recMethod])

  const handleRefreshAI = () => {
    const newSeed = Math.floor(Math.random() * 1000000)
    setCurrentSeed(newSeed)
    const weighted = getWeightedTopTracks(allTracks, recYear, recMonth)
    runAnalysis(weighted, newSeed, recMethod)
  }

  const handleDataLoaded = async (allData) => {
    loadTracks(allData)
    const weighted = getWeightedTopTracks(allData, recYear, recMonth)
    runAnalysis(weighted, currentSeed, recMethod)
  }

  return (
    <div>
      <Header />
      {!hasData ? (
        <DropZone onData={handleDataLoaded} />
      ) : (
        <>
          <div style={{ padding: '2rem 4rem 0' }}>
            {aiStatus && (
               <div style={{ padding: '1rem', background: 'var(--surface3)', color: 'var(--green)', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                 ⚙️ AI Status: {aiStatus}
               </div>
            )}
            <GlobalFilter years={years} year={year} month={month} onYearChange={handleYearChange} onMonthChange={setMonth} periodLabel={periodLabel} onReset={reset} />
            
            {stats && (
              <>
                <div className="section-label">Overview</div>
                <HeroStats stats={stats} />

                <div className="section-label">Fun Facts</div>
                <FunFacts stats={stats} />

                <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <RankedList title="Top Tracks" items={stats.topTracks} getName={d => d.name} getSub={d => `${d.artist} · ${d.plays.toLocaleString()} plays`} maxMs={stats.topTracks[0]?.ms} />
                  <RankedList title="Top Artists" items={stats.topArtists} getName={d => d.key} getSub={d => `${d.plays.toLocaleString()} plays`} maxMs={stats.topArtists[0]?.ms} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', alignItems: 'stretch' }}>
                  <RankedList title="Top Albums" items={stats.topAlbums} getName={d => d.album} getSub={d => `${d.artist} · ${d.plays.toLocaleString()} plays`} maxMs={stats.topAlbums[0]?.ms} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <TimelineChart timeline={timeline} />
                    <Heatmap heatmap={stats.heatmap} />
                    <ListeningInsights stats={stats} />
                    <Platforms topPlatforms={stats.topPlatforms} />
                  </div>
                </div>
              </>
            )}
          </div>
          <Recommendations 
            allTracks={allTracks}
            years={years}
            monthsByYear={monthsByYear}
            recYear={recYear}
            recMonth={recMonth}
            setRecYear={setRecYear}
            setRecMonth={setRecMonth}
            hitsRecs={hitsRecs} 
            diverseRecs={diverseRecs} 
            deepRecs={deepRecs} 
            onRefresh={handleRefreshAI} 
            isDeepLoading={isDeepLoading}
            recMethod={recMethod}
            setRecMethod={setRecMethod}
            clusterViz={clusterViz}
          />
        </>
      )}
    </div>
  )
}
