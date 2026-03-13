export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function msToHM(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function msToReadable(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 24) return `${Math.round(h / 24)} days`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatHour(h) {
  const n = parseInt(h)
  if (n === 0) return '12 AM'
  if (n < 12) return `${n} AM`
  if (n === 12) return '12 PM'
  return `${n - 12} PM`
}

export function normalizePlatform(raw) {
  const p = raw.toLowerCase()
  if (p.includes('android')) return 'Android'
  if (p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return 'iOS'
  if (p.includes('windows')) return 'Windows'
  if (p.includes('mac') || p.includes('osx')) return 'macOS'
  if (p.includes('linux')) return 'Linux'
  if (p.includes('web') || p.includes('browser')) return 'Web Player'
  if (p.includes('cast') || p.includes('chromecast')) return 'Chromecast'
  return raw.split(' ')[0]
}

export function topN(map, n) {
  return Object.entries(map)
    .sort((a, b) => b[1].ms - a[1].ms)
    .slice(0, n)
    .map(([k, v]) => ({ key: k, ...v }))
}

export function filterTracks(allTracks, year, month) {
  return allTracks.filter(d => {
    const ts = d.ts || d.endTime
    if (!ts) return false
    if (year === 'all') return true
    if (ts.slice(0, 4) !== year) return false
    if (month === 'all') return true
    return ts.slice(5, 7) === month
  })
}

export function computeStats(tracks, limit = 15) {
  const totalMs = tracks.reduce((s, d) => s + (d.ms_played || d.msPlayed || 0), 0)
  const totalPlays = tracks.length
  const skipped = tracks.filter(d => d.skipped === true).length
  const uniqueTracks = new Set(tracks.map(d => d.spotify_track_uri || d.trackName)).size
  const uniqueArtists = new Set(tracks.map(d => d.master_metadata_album_artist_name || d.artistName).filter(Boolean)).size

  // Top tracks
  const trackMap = {}
  tracks.forEach(d => {
    const name = d.master_metadata_track_name || d.trackName
    const artist = d.master_metadata_album_artist_name || d.artistName
    if (!name) return
    const key = `${name}|||${artist}`
    if (!trackMap[key]) trackMap[key] = { ms: 0, plays: 0, name: name, artist: artist }
    trackMap[key].ms += d.ms_played || d.msPlayed || 0
    trackMap[key].plays++
  })
  const topTracks = topN(trackMap, limit)

  // Top artists
  const artistMap = {}
  tracks.forEach(d => {
    const a = d.master_metadata_album_artist_name || d.artistName
    if (!a) return
    if (!artistMap[a]) artistMap[a] = { ms: 0, plays: 0 }
    artistMap[a].ms += d.ms_played || d.msPlayed || 0
    artistMap[a].plays++
  })
  const topArtists = topN(artistMap, limit)

  // Top albums
  const albumMap = {}
  tracks.forEach(d => {
    const alb = d.master_metadata_album_album_name || 'Unknown Album'
    const art = d.master_metadata_album_artist_name || d.artistName
    if (!art) return
    const key = `${alb}|||${art}`
    if (!albumMap[key]) albumMap[key] = { ms: 0, plays: 0, album: alb, artist: art }
    albumMap[key].ms += d.ms_played || d.msPlayed || 0
    albumMap[key].plays++
  })
  const topAlbums = topN(albumMap, limit)

  // Heatmap
  const heatmap = {}
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) heatmap[`${d}_${h}`] = 0
  tracks.forEach(d => {
    const ts = d.ts || d.endTime
    if (!ts) return
    const dt = new Date(ts)
    const day = (dt.getDay() + 6) % 7
    const hour = dt.getHours()
    heatmap[`${day}_${hour}`] += d.ms_played || d.msPlayed || 0
  })

  // Platforms
  const platformMap = {}
  tracks.forEach(d => {
    if (!d.platform) return
    const p = normalizePlatform(d.platform)
    platformMap[p] = (platformMap[p] || 0) + 1
  })
  const topPlatforms = Object.entries(platformMap).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // Fun facts
  const dayMap = {}
  tracks.forEach(d => {
    const ts = d.ts || d.endTime
    if (!ts) return
    const day = ts.slice(0, 10)
    dayMap[day] = (dayMap[day] || 0) + (d.ms_played || d.msPlayed || 0)
  })
  const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]
  const totalDays = Object.keys(dayMap).length

  const hourTotals = {}
  for (let h = 0; h < 24; h++) hourTotals[h] = 0
  tracks.forEach(d => {
    const ts = d.ts || d.endTime
    if (!ts) return
    const h = new Date(ts).getHours()
    hourTotals[h] += d.ms_played || d.msPlayed || 0
  })
  const topHour = Object.entries(hourTotals).sort((a, b) => b[1] - a[1])[0]

  const offlinePlays = tracks.filter(d => d.offline === true).length
  const shufflePlays = tracks.filter(d => d.shuffle === true).length
  const incognitoPlays = tracks.filter(d => d.incognito_mode === true).length

  // Night owl vs early bird
  let nightPlays = 0, morningPlays = 0
  tracks.forEach(d => {
    const ts = d.ts || d.endTime
    if (!ts) return
    const hh = new Date(ts).getHours()
    if (hh >= 0 && hh < 6) nightPlays++
    else if (hh >= 6 && hh < 12) morningPlays++
  })

  // Longest streak
  const sortedDays = Object.keys(dayMap).sort()
  let longestStreak = 0, curStreak = 0, prevDate = null
  sortedDays.forEach(dateStr => {
    const dd = new Date(dateStr)
    if (prevDate) {
      const diff = (dd - prevDate) / 86400000
      curStreak = diff === 1 ? curStreak + 1 : 1
    } else { curStreak = 1 }
    if (curStreak > longestStreak) longestStreak = curStreak
    prevDate = dd
  })

  const yearMap = {}
  tracks.forEach(d => {
    const ts = d.ts || d.endTime
    if (!ts) return
    const y = ts.slice(0, 4)
    yearMap[y] = (yearMap[y] || 0) + (d.ms_played || d.msPlayed || 0)
  })
  const topYear = Object.entries(yearMap).sort((a, b) => b[1] - a[1])[0]
  const avgPerDay = totalDays > 0 ? Math.round(totalPlays / totalDays) : 0

  return {
    totalMs, totalPlays, skipped, uniqueTracks, uniqueArtists,
    topTracks, topArtists, topAlbums,
    heatmap,
    topPlatforms,
    bestDay, totalDays, topHour, offlinePlays, shufflePlays, topYear, avgPerDay,
    nightPlays, morningPlays, longestStreak, incognitoPlays,
    skipPct: totalPlays > 0 ? Math.round(skipped / totalPlays * 100) : 0,
  }
}

export function computeTimeline(tracks, year, month) {
  if (year === 'all') {
    const map = {}
    tracks.forEach(d => {
      const ts = d.ts || d.endTime
      if (!ts) return
      const k = ts.slice(0, 4)
      map[k] = (map[k] || 0) + (d.ms_played || d.msPlayed || 0)
    })
    return {
      title: 'Listening By Year',
      buckets: Object.entries(map).sort((a, b) => a[0] < b[0] ? -1 : 1),
    }
  } else if (month === 'all') {
    const map = {}
    tracks.forEach(d => {
      const ts = d.ts || d.endTime
      if (!ts) return
      const k = ts.slice(0, 7)
      map[k] = (map[k] || 0) + (d.ms_played || d.msPlayed || 0)
    })
    return {
      title: `Listening By Month — ${year}`,
      buckets: Object.entries(map).sort((a, b) => a[0] < b[0] ? -1 : 1).map(([k, v]) => [k.slice(2), v]),
    }
  } else {
    const map = {}
    tracks.forEach(d => {
      const ts = d.ts || d.endTime
      if (!ts) return
      const day = new Date(ts).getDate()
      const week = Math.ceil(day / 7)
      const k = `Week ${week}`
      map[k] = (map[k] || 0) + (d.ms_played || d.msPlayed || 0)
    })
    return {
      title: `Listening By Week — ${MONTH_NAMES[parseInt(month) - 1]} ${year}`,
      buckets: Object.entries(map).sort((a, b) => parseInt(a[0].split(' ')[1]) - parseInt(b[0].split(' ')[1])),
    }
  }
}
export function computeExtendedStats(tracks) { return computeStats(tracks, 15) }
