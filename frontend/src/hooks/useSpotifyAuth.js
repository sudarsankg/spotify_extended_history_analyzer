import { useState, useEffect } from 'react'
import { extractTokenFromHash, getAuthUrl, spotifyFetch } from '../utils/spotify'

export function useSpotifyAuth() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [clientId, setClientId] = useState(() => sessionStorage.getItem('spotify_client_id') || '')

  // Check for token in URL hash on mount (returning from OAuth)
  useEffect(() => {
    const t = extractTokenFromHash()
    if (t) {
      setToken(t)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Fetch user info when token is set
  useEffect(() => {
    if (!token) return
    spotifyFetch('https://api.spotify.com/v1/me', token)
      .then(me => setUser(me))
      .catch(() => {})
  }, [token])

  function connect(id) {
    const cid = id || clientId
    if (!cid) return false
    sessionStorage.setItem('spotify_client_id', cid)
    setClientId(cid)
    const redirectUri = window.location.origin + window.location.pathname
    window.location.href = getAuthUrl(cid, redirectUri)
    return true
  }

  function disconnect() {
    setToken(null)
    setUser(null)
    sessionStorage.removeItem('spotify_client_id')
  }

  return { token, user, clientId, setClientId, connect, disconnect }
}
