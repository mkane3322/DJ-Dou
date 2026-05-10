# 🎵 DJ Dou — SoundDNA

> Your music has a fingerprint. DJ Dou finds it.

DJ Dou analyzes your Spotify listening history across 13 audio dimensions to generate a personalized **SoundDNA** — a unique musical fingerprint that powers hyper-accurate recommendations, mood-based search, and a beautiful radar chart visualization of who you are as a listener.

---

## Features

- **SoundDNA Profile** — 13-dimensional audio fingerprint (energy, valence, danceability, tempo, acousticness, etc.)
- **AI-Powered Summary** — Claude writes a plain-English paragraph describing your musical identity
- **Smart Recommendations** — Cosine similarity search finds tracks that match your DNA
- **Mood Search** — Natural language queries like "something melancholic and slow" → Claude parses → audio feature ranges
- **"Why You'll Love This"** — Claude generates per-recommendation explanations
- **DNA Radar Chart** — D3.js visualization of your audio fingerprint
- **30s Preview Player** — Built-in track preview with waveform animation
- **Catalog Indexing** — node-cron jobs cache Spotify tracks into MongoDB overnight

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + JavaScript |
| Styling | Custom CSS (no frameworks) |
| Charts | D3.js |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | Spotify OAuth 2.0 + JWT |
| Scheduling | node-cron |
| APIs | Spotify Web API, Claude API |
| Hosting | Vercel (frontend) + Railway (backend) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Spotify Developer Account
- Anthropic API Key

### 1. Clone & Install

```bash
git clone <repo>
cd dj-dou

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/djdou
JWT_SECRET=your_jwt_secret_here
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5000/auth/spotify/callback
ANTHROPIC_API_KEY=your_anthropic_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000
```

### 3. Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `http://localhost:5000/auth/spotify/callback` to Redirect URIs
4. Copy Client ID and Client Secret to `.env`

### 4. Run Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend  
cd frontend && npm start
```

---

## MongoDB Schemas

```
users        — spotifyId, email, dnaVector[13], dnaSummary, avatar
tracks       — spotifyId, title, artist, audioFeatures, featureVector[13], previewUrl
seeds        — userId → trackId (user's seed songs)
interactions — userId → trackId, action: liked|skipped|saved
recommendations — userId → trackId, similarityScore, whyText
```

---

## API Routes

```
POST /auth/spotify          — Initiate OAuth flow
GET  /auth/spotify/callback — Handle callback, issue JWT
GET  /auth/me               — Get current user

GET  /dna/profile           — Get user's DNA vector + summary
POST /dna/compute           — (Re)compute DNA from listening history
GET  /dna/chart-data        — Formatted data for D3 radar chart

GET  /recommendations       — Get personalized track recommendations
POST /recommendations/mood  — Natural language mood → recommendations

GET  /tracks/search         — Search Spotify catalog
GET  /tracks/:id            — Get track with audio features

POST /interactions          — Log like/skip/save
GET  /interactions/history  — User's interaction history

POST /seeds                 — Add seed track
DELETE /seeds/:trackId      — Remove seed track

POST /user/avatar           — Upload avatar via Cloudinary
```

---

## Project Structure

```
dj-dou/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── auth/         LoginPage, SpotifyButton
│       │   ├── dna/          RadarChart, DNASummary, FeatureBar
│       │   ├── player/       PreviewPlayer, WaveformVisualizer
│       │   ├── recommendations/ RecommendationCard, MoodSearch
│       │   └── shared/       Navbar, LoadingSpinner, Avatar
│       ├── pages/            Home, Dashboard, Profile, Discover
│       ├── hooks/            useAuth, useDNA, usePlayer, useRecommendations
│       ├── utils/            api.js, spotifyHelpers.js, dnaHelpers.js
│       └── styles/           global.css, variables.css, animations.css
└── backend/
    └── src/
        ├── controllers/      auth, dna, recommendations, tracks, interactions
        ├── middleware/        authMiddleware, errorHandler, rateLimiter
        ├── models/           User, Track, Seed, Interaction, Recommendation
        ├── routes/           auth, dna, recommendations, tracks, interactions, user
        ├── services/         spotifyService, claudeService, dnaService, similarityService
        ├── jobs/             catalogIndexer (node-cron)
        └── utils/            cosineSimiliarity, featureNormalizer, logger
```

---

## Key Algorithms

### DNA Vector Construction
The 13 Spotify audio features are normalized to [0,1] and assembled into a vector:
```
[danceability, energy, key, loudness, mode, speechiness, 
 acousticness, instrumentalness, liveness, valence, tempo,
 duration_ms, time_signature]
```
A user's DNA is the **weighted average** of their top tracks' vectors, weighted by play recency.

### Cosine Similarity
```
similarity(A, B) = (A · B) / (|A| × |B|)
```
Runs in-memory on candidate tracks filtered from MongoDB. For < 50k tracks this is fast enough without vector indexing.

### Mood Parsing (Claude)
Natural language → JSON feature ranges:
```json
{ "valence": [0, 0.3], "energy": [0, 0.4], "tempo": [60, 90] }
```
These ranges filter the MongoDB catalog before similarity ranking.
