export const SCOPES = 'user-read-private'

export function getAuthUrl(clientId, redirectUri) {
  return `https://accounts.spotify.com/authorize?client_id=${encodeURIComponent(clientId)}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPES)}`
}

export function extractTokenFromHash() {
  const params = new URLSearchParams(window.location.hash.slice(1))
  return params.get('access_token') || null
}

export async function spotifyFetch(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) throw new Error('Spotify token expired. Please reconnect.')
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`)
  return res.json()
}

export async function fetchRecommendations(allTracks, token, seedType) {
  const trackMap = {}
  const artistMap = {}

  allTracks.forEach(d => {
    if (d.spotify_track_uri) {
      const id = d.spotify_track_uri.split(':')[2]
      trackMap[id] = (trackMap[id] || 0) + (d.ms_played || 0)
    }
    if (d.master_metadata_album_artist_name) {
      const a = d.master_metadata_album_artist_name
      artistMap[a] = (artistMap[a] || 0) + (d.ms_played || 0)
    }
  })

  const topTrackIds = Object.entries(trackMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id)
  const topArtistNames = Object.entries(artistMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name)

  let seedTrackIds = []
  let seedArtistIds = []

  if (seedType === 'artists' || seedType === 'mixed') {
    const limit = seedType === 'mixed' ? 3 : 5
    for (const name of topArtistNames.slice(0, limit)) {
      try {
        const res = await spotifyFetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
          token
        )
        if (res.artists.items.length) seedArtistIds.push(res.artists.items[0].id)
      } catch (e) {}
      if (seedArtistIds.length >= 3) break
    }
  }

  if (seedType === 'tracks') seedTrackIds = topTrackIds.slice(0, 5)
  else if (seedType === 'mixed') seedTrackIds = topTrackIds.slice(0, 2)

  if (seedTrackIds.length + seedArtistIds.length === 0) {
    throw new Error('Could not find your tracks/artists on Spotify.')
  }

  const params = new URLSearchParams({ limit: 20 })
  if (seedTrackIds.length) params.set('seed_tracks', seedTrackIds.join(','))
  if (seedArtistIds.length) params.set('seed_artists', seedArtistIds.join(','))

  const data = await spotifyFetch(`https://api.spotify.com/v1/recommendations?${params}`, token)

  if (!data.tracks?.length) throw new Error('No recommendations returned. Try a different seed type.')

  const historyUris = new Set(allTracks.map(d => d.spotify_track_uri).filter(Boolean))
  const fresh = data.tracks.filter(t => !historyUris.has(t.uri))
  return fresh.length > 0 ? fresh : data.tracks
}
