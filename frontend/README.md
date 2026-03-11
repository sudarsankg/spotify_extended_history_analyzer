# Spotify Wrapped+

A React app that analyzes your Spotify extended listening history.

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Spotify Recommendations

To use the recommendations feature you need a Spotify Developer app:

1. Go to https://developer.spotify.com/dashboard → Create App
2. Set Redirect URI to your app URL (e.g. http://localhost:5173)
3. Copy your Client ID and paste it into the app

## Project Structure

```
src/
  components/
    Header.jsx          — Top header bar
    DropZone.jsx        — File drag & drop + parse
    GlobalFilter.jsx    — Year/month period selector
    HeroStats.jsx       — 4 big overview numbers
    FunFacts.jsx        — 6 fun stat cards
    RankedList.jsx      — Reusable top-N list (tracks, artists, albums)
    TimelineChart.jsx   — Bar chart (yearly/monthly/weekly)
    Heatmap.jsx         — Hour × day listening grid
    PlatformStats.jsx   — Platforms bar chart + skip rate gauge
    Recommendations.jsx — Spotify OAuth + recommendation cards
  hooks/
    useListeningData.js — All data state, filtering, computed stats
    useSpotifyAuth.js   — Spotify OAuth token management
  utils/
    dataProcessing.js   — Pure functions: filtering, aggregation, formatting
    spotify.js          — Spotify API fetch helpers
```
