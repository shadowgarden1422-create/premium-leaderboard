export default {
  async fetch(request, env) {
    const DEFAULT_VIDEOS = {
      1: "https://files.catbox.moe/uq1rwi.mp4",
      2: "https://files.catbox.moe/vsyn5n.mp4",
      3: "https://files.catbox.moe/9bgunq.mp4"
    };

    const isValidUrl = (value) => {
      if (!value || typeof value !== "string") return false;
      try {
        const u = new URL(value);
        return ["http:", "https:"].includes(u.protocol) && !!u.hostname;
      } catch {
        return false;
      }
    };

    const getLeaderboardData = () => {
      const rows = [
        { rank: 1, name: "OBEY", username: "obey111000", coins: 5058, avatar_url: "https://unavatar.io/tiktok/obey111000", badge: "KING" },
        { rank: 2, name: "24", username: "user24", coins: 5058, avatar_url: "https://unavatar.io/tiktok/user24", badge: "VIP" },
        { rank: 3, name: "ZIA24.10", username: "zia24.10", coins: 4563, avatar_url: "https://unavatar.io/tiktok/zia24.10", badge: "TOP 3" },
        { rank: 4, name: "索伊特", username: "suoyite", coins: 4414, avatar_url: "https://unavatar.io/tiktok/suoyite", badge: "HOT" },
        { rank: 5, name: "Riska", username: "riska", coins: 4000, avatar_url: "https://unavatar.io/tiktok/riska", badge: "FAVORITE" }
      ];

      for (let i = 6; i <= 600; i++) {
        rows.push({
          rank: i,
          name: `Supporter ${i}`,
          username: `supporter${i}`,
          coins: Math.max(1, 3000 - Math.floor(i * 2)),
          avatar_url: `https://unavatar.io/tiktok/supporter${i}`,
          badge: i <= 10 ? "NEW" : "SUPPORTER"
        });
      }

      return rows;
    };

    const getVideosFromKV = async () => {
      try {
        const stored = await env.VIDEOS?.get("leaderboard_videos", { type: "json" });
        if (stored && typeof stored === "object") {
          return {
            1: stored[1] || DEFAULT_VIDEOS[1],
            2: stored[2] || DEFAULT_VIDEOS[2],
            3: stored[3] || DEFAULT_VIDEOS[3]
          };
        }
      } catch (err) {
        console.error("Failed to read video KV:", err);
      }
      return { ...DEFAULT_VIDEOS };
    };

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Cache-Control": "no-store"
        }
      });

    const url = new URL(request.url);

    if (url.pathname === "/api/videos") {
      const videos = await getVideosFromKV();
      return json({ ok: true, videos });
    }

    if (url.pathname === "/api/leaderboard") {
      return json({ ok: true, items: getLeaderboardData() });
    }

    if (url.pathname === "/api/set-video") {
      if (request.method !== "POST") {
        return json({ ok: false, msg: "Method not allowed" }, 405);
      }

      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const rank = Number(body.rank);
      const videoUrl = String(body.url || "").trim();

      if (!Number.isInteger(rank) || rank < 1 || rank > 3) {
        return json({ ok: false, msg: "Rank harus 1 sampai 3" }, 400);
      }

      if (!isValidUrl(videoUrl)) {
        return json({ ok: false, msg: "URL video tidak valid" }, 400);
      }

      try {
        const current = await getVideosFromKV();
        const next = { ...current, [String(rank)]: videoUrl };
        await env.VIDEOS.put("leaderboard_videos", JSON.stringify(next));
        return json({ ok: true, msg: `Top ${rank} updated`, videos: next });
      } catch (err) {
        console.error("Error saving video:", err);
        return json({ ok: false, msg: "Gagal menyimpan video" }, 500);
      }
    }

    const leaderboard = getLeaderboardData();
    const videos = await getVideosFromKV();
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    const escapeHtml = (value = "") =>
      String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const listHtml = rest.map((item) => `
      <div class="card">
        <div class="rank">${item.rank}</div>
        <img class="ca" src="${escapeHtml(item.avatar_url || "https://placehold.co/48x48/111827/ffffff?text=U")}" alt="${escapeHtml(item.name)}" loading="lazy">
        <div style="flex:1;min-width:0">
          <div class="name-text">${escapeHtml(item.name)}</div>
          <div class="user-text">@${escapeHtml(item.username)}</div>
        </div>
        <div class="coin-box">💎 ${Number(item.coins).toLocaleString()}</div>
      </div>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Top Supporter Leaderboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Inter:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    :root{
      --avatar-size:56px;
      --avatar-size-p1:72px;
      --box-height:155px;
      --font-name:11px;
      --font-coin:11px;
      --font-rank:12px;
    }
    *{margin:0;padding:0;box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{
      background:#000;color:#fff;padding:8px;
      font-family:Inter,sans-serif;max-width:500px;margin:0 auto;overflow-x:hidden;
    }
    .header{
      border-radius:24px;background:linear-gradient(180deg,#15151a,#0e0e11);
      border:1px solid #23232a;padding:12px 14px;display:flex;justify-content:space-between;
      align-items:center;position:sticky;top:8px;z-index:999;
    }
    .live{padding:6px 12px;border-radius:99px;font-size:10px;font-weight:900;border:1px solid;cursor:pointer}
    .live.offline{background:#1a1a1a;color:#555;border-color:#2a2a2a}
    .podium{display:flex;gap:10px;align-items:flex-end;justify-content:center;margin:60px 0 20px 0;padding-top:50px;min-height:220px}
    .p-wrap{flex:1;position:relative;cursor:pointer;transition:.3s;overflow:visible;display:flex;flex-direction:column;justify-content:flex-end;z-index:1;min-width:0;user-select:none}
    .p-wrap:hover{transform:scale(1.05)}
    .p1-wrap{flex:1.2;transform:scale(1.08);z-index:2}
    .avatar-wrap{position:absolute;left:50%;transform:translateX(-50%);z-index:3}
    .avatar-wrap.top2{top:-42px;width:var(--avatar-size);height:var(--avatar-size)}
    .avatar-wrap.top1{top:-58px;width:var(--avatar-size-p1);height:var(--avatar-size-p1)}
    .avatar{width:100%;height:100%;border-radius:50%;object-fit:cover;background:#e0e0e0;display:block;border:3px solid #fff}
    .crown{position:absolute;top:-8px;right:-8px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;border:2px solid #000;z-index:5}
    .crown.gold{background:radial-gradient(circle at 30% 30%,#ffffc0,#ffcc00,#ff9900);width:28px;height:28px;font-size:13px}
    .crown.silver{background:linear-gradient(180deg,#fff,#c0c0c0)}
    .crown.bronze{background:linear-gradient(180deg,#ffe0a0,#cd7f32)}
    .p-item{position:relative;border-radius:22px;padding:32px 6px 12px 6px;text-align:center;overflow:hidden;cursor:pointer;min-height:var(--box-height)}
    .p2{background:linear-gradient(180deg,#ffffff 0%,#f5f5f5 50%,#e0e0e0 100%);border:2px solid #e8e8e8;color:#000}
    .p3{background:linear-gradient(180deg,#ffe8c0 0%,#f5c78a 30%,#e8a85c 70%,#d28a3a 100%);border:2px solid #e8b87a;color:#000}
    .p1{background:linear-gradient(180deg,#fffef0 0%,#fff8a0 20%,#ffeb3b 40%,#ffcc00 60%,#ff9900 80%,#ff6a00 100%);border:2.5px solid #ffde40;color:#000}
    .p-num{width:28px;height:28px;background:#000;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;margin:0 auto 6px;font-size:var(--font-rank);border:2px solid #fff}
    .p-name{font-family:Cinzel,serif;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:uppercase;font-size:var(--font-name)}
    .p-user{font-size:8px;color:#333;font-weight:700;margin-top:2px}
    .p-coin{display:flex;align-items:center;justify-content:center;gap:3px;margin-top:8px;font-weight:900;background:#fff;border:2px solid #000;border-radius:12px;padding:6px 10px;width:fit-content;margin-left:auto;margin-right:auto;font-size:var(--font-coin)}
    .badge{margin-top:8px;font-size:7px;padding:6px 10px;font-family:Cinzel,serif;font-weight:900;border-radius:10px;border:1.5px solid #000;text-transform:uppercase;display:inline-block}
    .badge.sultan-kaya{background:linear-gradient(90deg,#ff4400 0%,#ff8800 100%);color:#fff}
    .badge.wakil{background:#000;color:#fff}
    .badge.pejuang{background:#5a3a1a;color:#ffe0a0;border-color:#8B4513}
    .vid-badge{margin-top:6px;background:#00c853;color:#fff;font-size:8px;font-weight:900;padding:5px 8px;border-radius:99px;display:inline-flex;align-items:center;gap:3px;border:1px solid #00e676}
    .search-wrap{position:relative;margin:14px 0 10px 0}
    .search-input{width:100%;background:#111;border:1.5px solid #232323;border-radius:18px;padding:14px 16px 14px 46px;color:#fff;font-weight:700;font-size:13px;outline:none}
    .search-input:focus{border-color:#555}
    .search-icon{position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none}
    .card{display:flex;align-items:center;gap:12px;background:#0a0a0a;border:1px solid #151515;padding:12px 13px;border-radius:14px;margin-top:6px;cursor:pointer;transition:.2s}
    .card:hover{border-color:#333;background:#111}
    .rank{width:32px;height:32px;background:#111;border:1px solid #222;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;flex-shrink:0}
    .ca{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #222;flex-shrink:0;background:#222}
    .name-text{font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .user-text{font-size:10px;color:#666}
    .coin-box{margin-left:auto;font-weight:900}
    #videoModal{position:fixed;inset:0;background:rgba(0,0,0,0.95);backdrop-filter:blur(10px);z-index:99999;display:none;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s}
    #videoModal.show{display:flex}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .modal-video-wrap{background:#000;border:3px solid #ffcc00;border-radius:20px;overflow:hidden;max-width:90vw;width:100%;max-width:500px;position:relative;box-shadow:0 0 50px rgba(255,204,0,0.3)}
    .modal-video-wrap video{width:100%;max-height:70vh;object-fit:contain;background:#000;display:block}
    .close-modal{margin-top:12px;background:#fff;color:#000;border:none;padding:12px 24px;border-radius:99px;font-weight:900;font-size:12px;cursor:pointer;width:100%;transition:.2s}
    .close-modal:hover{background:#ddd}
    .top1-header{margin:10px 0 60px 0;text-align:center;background:linear-gradient(90deg,#111,#222,#111);border:1px solid #333;border-radius:12px;padding:10px 12px;font-family:Cinzel,serif;font-weight:900;font-size:11px;color:#ffcc00}
  </style>
</head>
<body>
  <div class="header">
    <div style="display:flex;gap:10px;align-items:center">
      <img src="https://unavatar.io/tiktok/obey111000" style="width:46px;height:46px;border-radius:50%;border:2.5px solid #ff2a5a" alt="OBEY" loading="lazy">
      <div>
        <div style="font-family:Cinzel,serif;font-weight:900;letter-spacing:1.5px;font-size:18px">OBEY</div>
        <div style="font-size:11px;color:#888">@obey111000 • OFFLINE</div>
      </div>
    </div>
    <div class="live offline">⚫ OFF</div>
  </div>

  <div class="top1-header">👑 TOP SUPPORTER - ALL TIME - VIDEO MODAL - PUBLIK BISA LIHAT</div>

  <div class="podium">
    <div class="p-wrap" onclick="openVideoModal(2)">
      <div class="avatar-wrap top2">
        <img class="avatar" src="${escapeHtml(top3[1]?.avatar_url || "https://unavatar.io/tiktok/user24")}" alt="${escapeHtml(top3[1]?.name || "Top 2")}" loading="lazy">
        <div class="crown silver">🥈</div>
      </div>
      <div class="p-item p2">
        <div class="p-num">2</div>
        <div class="p-name">${escapeHtml(top3[1]?.name || "24")}</div>
        <div class="p-user">@${escapeHtml(top3[1]?.username || "user24")}</div>
        <div class="p-coin">💎 ${Number(top3[1]?.coins || 5058).toLocaleString()}</div>
        <div class="badge wakil">WAKIL TOP 2</div>
        <div class="vid-badge">🎬 ADA VIDEO - KLIK!</div>
      </div>
    </div>

    <div class="p-wrap p1-wrap" onclick="openVideoModal(1)">
      <div class="avatar-wrap top1">
        <img class="avatar" src="${escapeHtml(top3[0]?.avatar_url || "https://unavatar.io/tiktok/obey111000")}" alt="${escapeHtml(top3[0]?.name || "Top 1")}" loading="lazy">
        <div class="crown gold">👑</div>
      </div>
      <div class="p-item p1">
        <div class="p-num">1</div>
        <div class="p-name">🔥 ${escapeHtml(top3[0]?.name || "OBEY")} 🔥</div>
        <div class="p-user">@${escapeHtml(top3[0]?.username || "obey111000")}</div>
        <div class="p-coin">💎 ${Number(top3[0]?.coins || 5058).toLocaleString()} ✨</div>
        <div class="badge sultan-kaya">🔥 KING TOP 1 🔥</div>
        <div class="vid-badge">🎬 ADA VIDEO - KLIK!</div>
      </div>
    </div>

    <div class="p-wrap" onclick="openVideoModal(3)">
      <div class="avatar-wrap top2">
        <img class="avatar" src="${escapeHtml(top3[2]?.avatar_url || "https://unavatar.io/tiktok/zia24.10")}" alt="${escapeHtml(top3[2]?.name || "Top 3")}" loading="lazy">
        <div class="crown bronze">🥉</div>
      </div>
      <div class="p-item p3">
        <div class="p-num">3</div>
        <div class="p-name">${escapeHtml(top3[2]?.name || "ZIA24.10")}</div>
        <div class="p-user">@${escapeHtml(top3[2]?.username || "zia24.10")}</div>
        <div class="p-coin">💎 ${Number(top3[2]?.coins || 4563).toLocaleString()}</div>
        <div class="badge pejuang">PEJUANG TOP 3</div>
        <div class="vid-badge">🎬 ADA VIDEO - KLIK!</div>
      </div>
    </div>
  </div>

  <div class="search-wrap">
    <span class="search-icon">🔍</span>
    <input type="text" id="searchInput" class="search-input" placeholder="🔍 Cari supporter..." />
  </div>

  <div style="display:flex;justify-content:space-between;font-size:10px;color:#666;font-weight:700;margin:8px 4px">
    <span>Menampilkan ${rest.length} supporter</span>
    <span style="color:#00ff88">TOP 1-3 ADA VIDEO - KLIK!</span>
  </div>

  <div id="list">${listHtml}</div>

  <div id="videoModal" onclick="closeVideoModal()">
    <div class="modal-video-wrap" onclick="event.stopPropagation()">
      <video id="modalVideo" controls playsinline preload="auto" crossorigin="anonymous"></video>
      <button class="close-modal" onclick="closeVideoModal()">❌ TUTUP VIDEO</button>
      <div style="padding:8px;text-align:center;font-size:10px;color:#ffcc00;font-weight:900" id="videoInfo"></div>
    </div>
  </div>

  <script>
    const DEFAULT_JJ = ${JSON.stringify(videos)};
    const searchInput = document.getElementById('searchInput');
    const cards = Array.from(document.querySelectorAll('.card'));

    function filterCards() {
      const q = (searchInput.value || '').trim().toLowerCase();
      cards.forEach((card) => {
        const txt = card.textContent.toLowerCase();
        card.style.display = txt.includes(q) ? 'flex' : 'none';
      });
    }

    searchInput.addEventListener('input', filterCards);

    window.openVideoModal = function (rank) {
      const videoUrl = DEFAULT_JJ[rank] || DEFAULT_JJ[1];
      const modal = document.getElementById('videoModal');
      const v = document.getElementById('modalVideo');
      const info = document.getElementById('videoInfo');

      v.muted = false;
      v.src = videoUrl;
      v.preload = "auto";
      info.innerText = 'TOP ' + rank + ' - Loading...';
      modal.classList.add('show');

      const attemptPlay = () => {
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              info.innerText = 'TOP ' + rank;
            })
            .catch((err) => {
              console.warn("Play failed, trying muted:", err);
              v.muted = true;
              v.play().catch((e) => {
                console.error("Autoplay blocked:", e);
                info.innerText = 'TOP ' + rank + ' - Click play to start';
              });
            });
        }
      };

      if (v.readyState >= 3) {
        attemptPlay();
      } else {
        v.onloadedmetadata = attemptPlay;
        v.oncanplay = attemptPlay;
      }
    };

    window.closeVideoModal = function () {
      const modal = document.getElementById('videoModal');
      const v = document.getElementById('modalVideo');

      v.pause();
      v.currentTime = 0;
      v.src = '';
      v.muted = false;
      modal.classList.remove('show');
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeVideoModal();
    });
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "no-store"
      }
    });
  }
};
