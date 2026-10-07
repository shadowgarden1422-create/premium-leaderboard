# Leaderboard Worker

Project worker untuk leaderboard public dengan:
- top 3 podium
- search supporter
- video modal
- API untuk update video
- data default hardcoded
- video disimpan di Cloudflare KV

## Struktur folder

```bash
.
├── src/
│   └── index.js
├── package.json
├── wrangler.toml
├── .env.example
├── .gitignore
└── README.md
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Buat KV namespace:
```bash
npx wrangler kv:namespace create VIDEOS
```

3. Ganti `wrangler.toml` dengan ID KV yang dihasilkan.

4. Jalankan lokal:
```bash
npm run dev
```

5. Buka browser ke:
```bash
http://localhost:8787
```

## Update video top 3

```bash
curl -X POST http://localhost:8787/api/set-video \
  -H "Content-Type: application/json" \
  -d '{"rank":1,"url":"https://files.catbox.moe/video-baru.mp4"}'
```

## Deploy

```bash
npm run deploy
```

## API

- `GET /api/leaderboard`
- `GET /api/videos`
- `POST /api/set-video`

## Catatan

- Data leaderboard default sudah ada di `src/index.js`
- Video default sudah ada di `src/index.js`
- Untuk update video, worker memakai Cloudflare KV dengan key `leaderboard_videos`
