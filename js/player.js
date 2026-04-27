// ====================================================
// NETFLIX-STYLE PLAYER - 2 servers, auto-play, Arabic subtitles
// Server is chosen from the picker BEFORE entering this page
// ====================================================

const SERVERS = [
  {
    id: 'videasy',
    name: 'Videasy',
    nameAr: 'السيرفر 1',
    movieUrl: (id) => `https://player.videasy.net/movie/${id}?color=e50914&autoplay=true&autostart=true&mute=0&subtitle=ar&sub=ar&defaultSubtitle=ar&lang=ar`,
    tvUrl: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}?color=e50914&autoplay=true&autostart=true&mute=0&subtitle=ar&sub=ar&defaultSubtitle=ar&lang=ar&nextEpisode=true&episodeSelector=true&autoNextEpisode=true`
  },
  {
    id: 'mycima',
    name: 'MyCima',
    nameAr: 'السيرفر 2 (سيما)',
    external: true,
    // MyCima search URL — opens in a NEW TAB (can't be embedded due to X-Frame-Options)
    movieUrl: (id, title) => `https://w20.my-cima.net/search/${encodeURIComponent(title || '')}/`,
    tvUrl: (id, s, e, title) => `https://w20.my-cima.net/search/${encodeURIComponent(title || '')}/`
  }
];

const Player = {
  currentDetails: null,
  currentId: null,
  currentType: 'movie',
  currentSeason: 1,
  currentEpisode: 1,
  currentServerId: 'videasy',

  getServerKey() {
    return `netflixServer_${this.currentType}_${this.currentId}`;
  },

  getServer(serverId) {
    return SERVERS.find(s => s.id === serverId) || SERVERS[0];
  },

  getLastServer() {
    try {
      const saved = localStorage.getItem(this.getServerKey());
      if (saved && SERVERS.find(s => s.id === saved)) return saved;
    } catch {}
    try {
      const def = localStorage.getItem('netflixDefaultServer');
      if (def && SERVERS.find(s => s.id === def)) return def;
    } catch {}
    return SERVERS[0].id;
  },

  setLastServer(serverId) {
    try {
      localStorage.setItem(this.getServerKey(), serverId);
      localStorage.setItem('netflixDefaultServer', serverId);
    } catch {}
  },

  buildUrl(type, id, season, episode, serverId) {
    const server = this.getServer(serverId || this.currentServerId);
    const title = this.currentDetails ? (Utils.getTitle(this.currentDetails) || '') : '';
    if (type === 'tv') return server.tvUrl(id, season, episode, title);
    return server.movieUrl(id, title);
  },

  async init() {
    document.body.classList.add('player-mode');
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = params.get('type') || 'movie';
    const season = parseInt(params.get('s') || '1', 10);
    const episode = parseInt(params.get('e') || '1', 10);
    const urlServer = params.get('server');

    if (!id) return this.showError('لم يتم تحديد محتوى للمشاهدة');

    this.currentId = id;
    this.currentType = type;
    this.currentSeason = season;
    this.currentEpisode = episode;

    this.currentServerId = (urlServer && SERVERS.find(s => s.id === urlServer))
      ? urlServer
      : this.getLastServer();

    if (urlServer) this.setLastServer(urlServer);

    try {
      const details = type === 'tv'
        ? await API.getTVDetails(id)
        : await API.getMovieDetails(id);
      if (!details || !details.id) return this.showError('تعذر تحميل بيانات المحتوى');
      this.currentDetails = details;
    } catch (e) {
      console.error('Details error:', e);
      return this.showError('خطأ في الاتصال بالخادم');
    }

    const continueList = Utils.getContinueWatching ? Utils.getContinueWatching() : [];
    const isResuming = continueList.some(x => String(x.id) === String(id) && x.type === type);

    if (type === 'tv' && !params.get('e') && !isResuming) {
      this.renderEpisodePicker();
    } else {
      if (type === 'tv' && !params.get('e') && isResuming) {
        const saved = continueList.find(x => String(x.id) === String(id) && x.type === type);
        if (saved && saved.season && saved.episode) {
          this.currentSeason = saved.season;
          this.currentEpisode = saved.episode;
        }
      }
      this.renderPlayer();
      this.saveToContinueWatching();
      this.progressInterval = setInterval(() => this.saveToContinueWatching(), 30000);
    }
  },

  saveToContinueWatching(progress = null) {
    const d = this.currentDetails;
    if (!d) return;
    if (!this._startTime) this._startTime = Date.now();
    const timeOnPage = (Date.now() - this._startTime) / 1000;
    const estimated = Math.min(95, Math.max(5, Math.round((timeOnPage / 300) * 100)));

    if (Utils.saveContinueWatching) {
      Utils.saveContinueWatching({
        id: this.currentId,
        type: this.currentType,
        title: Utils.getTitle(d),
        backdrop_path: d.backdrop_path || d.poster_path,
        year: Utils.getYear(d),
        season: this.currentType === 'tv' ? this.currentSeason : null,
        episode: this.currentType === 'tv' ? this.currentEpisode : null,
        progress: progress !== null ? progress : estimated
      });
    }
  },

  renderEpisodePicker() {
    const d = this.currentDetails;
    const wrapper = document.getElementById('playerWrapper');
    const title = Utils.getTitle(d);
    const seasons = (d.seasons || []).filter(s => s.season_number > 0);

    if (seasons.length === 0) return this.renderPlayer();

    wrapper.innerHTML = `
      <div class="nf-picker">
        <div class="nf-picker-header">
          <a href="index.html" class="nf-icon-btn" title="عودة" tabindex="0">
            <i class="fas fa-arrow-right"></i>
          </a>
          <div class="nf-picker-title">
            <div>
              <div class="nf-picker-label">مسلسل</div>
              <h1>${title}</h1>
            </div>
          </div>
          <button class="nf-icon-btn nf-picker-play" id="playFirstBtn" tabindex="0" style="width:auto;border-radius:4px;padding:10px 24px;background:#fff;color:#000;">
            <i class="fas fa-play"></i> تشغيل الآن
          </button>
        </div>
        <div class="nf-picker-body">
          <div class="nf-seasons-tabs" id="seasonsTabs">
            ${seasons.map((s, i) => `
              <button class="nf-season-tab ${i === 0 ? 'active' : ''}" data-season="${s.season_number}" tabindex="0">
                الموسم ${s.season_number}
              </button>
            `).join('')}
          </div>
          <div class="nf-episodes-list" id="episodesList">
            <div class="nf-loader-inline"><div class="nf-loader-spin"></div></div>
          </div>
        </div>
      </div>
    `;

    wrapper.querySelectorAll('.nf-season-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        wrapper.querySelectorAll('.nf-season-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.loadEpisodes(parseInt(tab.dataset.season, 10));
      });
    });

    document.getElementById('playFirstBtn')?.addEventListener('click', () => {
      this.currentSeason = seasons[0].season_number;
      this.currentEpisode = 1;
      this.renderPlayer();
      this.saveToContinueWatching();
    });

    this.loadEpisodes(seasons[0].season_number);
  },

  async loadEpisodes(seasonNumber) {
    const listEl = document.getElementById('episodesList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="nf-loader-inline"><div class="nf-loader-spin"></div></div>';

    try {
      const seasonData = await API.getSeasonDetails(this.currentId, seasonNumber);
      const episodes = (seasonData && seasonData.episodes) || [];

      if (episodes.length === 0) {
        listEl.innerHTML = '<p style="color:#b3b3b3;text-align:center;padding:30px;">لا توجد حلقات متاحة</p>';
        return;
      }

      listEl.innerHTML = episodes.map(ep => {
        const thumb = ep.still_path
          ? `${CONFIG.IMG_URL_W500}${ep.still_path}`
          : (this.currentDetails.backdrop_path ? `${CONFIG.IMG_URL_W500}${this.currentDetails.backdrop_path}` : CONFIG.DEFAULT_BACKDROP);
        const runtime = ep.runtime ? `${ep.runtime} د` : '';
        const epName = ep.name || `الحلقة ${ep.episode_number}`;
        const epOverview = ep.overview_ar || ep.overview || 'لا يوجد وصف متاح لهذه الحلقة.';
        return `
          <div class="nf-ep-card" data-season="${seasonNumber}" data-episode="${ep.episode_number}" tabindex="0">
            <div class="nf-ep-number">${ep.episode_number}</div>
            <div class="nf-ep-thumb">
              <img src="${thumb}" alt="${epName}" onerror="this.src='${CONFIG.DEFAULT_BACKDROP}'">
              <div class="nf-ep-play-overlay"><i class="fas fa-play-circle"></i></div>
            </div>
            <div class="nf-ep-info">
              <div class="nf-ep-title-row">
                <h3>${epName}</h3>
                <span class="nf-ep-duration">${runtime}</span>
              </div>
              <p class="nf-ep-desc">${epOverview}</p>
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.nf-ep-card').forEach(card => {
        const play = () => {
          this.currentSeason = parseInt(card.dataset.season, 10);
          this.currentEpisode = parseInt(card.dataset.episode, 10);
          this.renderPlayer();
          this.saveToContinueWatching();
        };
        card.addEventListener('click', play);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
        });
      });
    } catch (e) {
      console.error('Episodes error:', e);
      listEl.innerHTML = '<p style="color:#e50914;text-align:center;padding:30px;">فشل تحميل الحلقات</p>';
    }
  },

  renderPlayer() {
    const wrapper = document.getElementById('playerWrapper');
    const streamUrl = this.buildUrl(this.currentType, this.currentId, this.currentSeason, this.currentEpisode);
    const currentServer = this.getServer(this.currentServerId);
    const title = this.currentDetails ? (Utils.getTitle(this.currentDetails) || '') : '';

    // External server (e.g. MyCima): open in a new tab — no iframe embedding
    if (currentServer.external) {
      wrapper.innerHTML = `
        <div class="nf-player video-only" id="nfPlayer" style="background:#000;display:flex;align-items:center;justify-content:center;">
          <div class="nf-external-screen" style="max-width:640px;padding:48px 32px;text-align:center;color:#fff;">
            <div style="font-size:64px;color:#e50914;margin-bottom:16px;">
              <i class="fas fa-external-link-alt"></i>
            </div>
            <h2 style="font-size:28px;margin-bottom:12px;font-weight:700;">${currentServer.nameAr}</h2>
            <p style="font-size:16px;color:#b3b3b3;line-height:1.8;margin-bottom:28px;">
              هذا السيرفر يفتح في <strong style="color:#fff;">تبويب جديد</strong> لأنه موقع خارجي لا يدعم التضمين.<br>
              ابحث عن: <strong style="color:#e50914;">${title}</strong>
            </p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
              <a href="${streamUrl}" target="_blank" rel="noopener noreferrer" id="openExternalBtn"
                 style="display:inline-flex;align-items:center;gap:10px;background:#e50914;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:16px;font-weight:600;transition:background .2s;">
                <i class="fas fa-play"></i> فتح السيرفر 2 في تبويب جديد
              </a>
              <a href="index.html" style="display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,0.15);color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:16px;font-weight:600;">
                <i class="fas fa-arrow-right"></i> عودة
              </a>
            </div>
            <p style="margin-top:24px;font-size:13px;color:#808080;">
              💡 جرّب السيرفر 1 (Videasy) إذا أردت المشاهدة داخل الموقع
            </p>
          </div>
        </div>
      `;

      // Try to auto-open in a new tab (may be blocked by popup blocker — that's why we also show the button)
      setTimeout(() => {
        try {
          const w = window.open(streamUrl, '_blank', 'noopener,noreferrer');
          if (!w) console.log('Popup blocked — user must click the button manually');
        } catch (e) {
          console.warn('Auto-open blocked:', e);
        }
      }, 400);

      this.attachKeyboardShortcuts();
      return;
    }

    // Regular embeddable server (iframe)
    wrapper.innerHTML = `
      <div class="nf-player video-only" id="nfPlayer">
        <div class="nf-loader" id="nfLoader">
          <div class="nf-loader-spin"></div>
          <div class="nf-loader-text">جاري التحميل من ${currentServer.nameAr}...</div>
        </div>

        <iframe
          id="nfFrame"
          class="nf-iframe"
          src="${streamUrl}"
          allowfullscreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          referrerpolicy="origin"
          frameborder="0"
          loading="eager"
        ></iframe>
      </div>
    `;

    const frame = document.getElementById('nfFrame');
    const loader = document.getElementById('nfLoader');

    frame.addEventListener('load', () => {
      setTimeout(() => loader?.classList.add('hidden'), 800);
      try { frame.focus(); } catch {}
    });
    setTimeout(() => loader?.classList.add('hidden'), 6000);

    this.attachKeyboardShortcuts();
  },

  goToPrevEpisode() {
    if (this.currentEpisode > 1) {
      this.currentEpisode--;
    } else if (this.currentSeason > 1) {
      this.currentSeason--;
      this.currentEpisode = 1;
    } else {
      return;
    }
    const serverParam = `&server=${this.currentServerId}`;
    window.location.href = `watch.html?id=${this.currentId}&type=tv&s=${this.currentSeason}&e=${this.currentEpisode}${serverParam}`;
  },

  async goToNextEpisode() {
    const d = this.currentDetails;
    const currentSeason = (d.seasons || []).find(s => s.season_number === this.currentSeason);
    if (currentSeason && this.currentEpisode < currentSeason.episode_count) {
      this.currentEpisode++;
    } else {
      const nextSeason = (d.seasons || []).find(s => s.season_number === this.currentSeason + 1);
      if (nextSeason) {
        this.currentSeason++;
        this.currentEpisode = 1;
      } else {
        return;
      }
    }
    const serverParam = `&server=${this.currentServerId}`;
    window.location.href = `watch.html?id=${this.currentId}&type=tv&s=${this.currentSeason}&e=${this.currentEpisode}${serverParam}`;
  },

  attachKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          window.location.href = this.currentType === 'tv'
            ? `watch.html?id=${this.currentId}&type=tv`
            : 'index.html';
        }
      } else if (e.key === 'f' || e.key === 'F') {
        const frame = document.getElementById('nfFrame');
        if (frame && frame.requestFullscreen) frame.requestFullscreen();
      } else if (this.currentType === 'tv') {
        if (e.key === 'n' || e.key === 'N') this.goToNextEpisode();
        if (e.key === 'p' || e.key === 'P') this.goToPrevEpisode();
      }
    });
  },

  showError(msg) {
    const wrapper = document.getElementById('playerWrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div class="nf-error">
          <i class="fas fa-exclamation-triangle"></i>
          <h2>عذراً</h2>
          <p>${msg}</p>
          <a href="index.html" class="btn btn-primary">العودة للرئيسية</a>
        </div>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Player.init());
