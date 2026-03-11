import { useState, useMemo } from 'react'
import { filterTracks, computeStats, computeTimeline, MONTH_NAMES } from '../utils/dataProcessing'

export function useListeningData() {
  const [allTracks, setAllTracks] = useState([])
  const [year, setYear] = useState('all')
  const [month, setMonth] = useState('all')

  const years = useMemo(() => (
    [...new Set(allTracks.map(d => (d.ts || d.endTime || '').slice(0, 4)).filter(Boolean))].sort((a, b) => b - a)
  ), [allTracks])

  const monthsByYear = useMemo(() => {
    const map = {}
    allTracks.forEach(d => {
      const ts = d.ts || d.endTime
      if (!ts) return
      const y = ts.slice(0, 4)
      const m = ts.slice(5, 7)
      if (!map[y]) map[y] = new Set()
      map[y].add(m)
    })
    // Convert sets to sorted arrays
    Object.keys(map).forEach(y => {
      map[y] = [...map[y]].sort()
    })
    return map
  }, [allTracks])

  const filteredTracks = useMemo(() => filterTracks(allTracks, year, month), [allTracks, year, month])

  const stats = useMemo(() => (
    filteredTracks.length > 0 ? computeStats(filteredTracks) : null
  ), [filteredTracks])

  const timeline = useMemo(() => (
    filteredTracks.length > 0 ? computeTimeline(filteredTracks, year, month) : null
  ), [filteredTracks, year, month])

  const periodLabel = useMemo(() => {
    if (year === 'all') return 'ALL TIME'
    if (month === 'all') return year
    return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`
  }, [year, month])

  function handleYearChange(y) {
    setYear(y)
    if (y === 'all') setMonth('all')
  }

  function loadTracks(data) {
    const tracks = data.filter(d => d && (d.master_metadata_track_name || d.trackName))
    setAllTracks(tracks)
    setYear('all')
    setMonth('all')
  }

  function reset() {
    setAllTracks([])
    setYear('all')
    setMonth('all')
  }

  return {
    allTracks, loadTracks, reset,
    year, month, setMonth, handleYearChange,
    years, monthsByYear, filteredTracks, stats, timeline, periodLabel,
  }
}
