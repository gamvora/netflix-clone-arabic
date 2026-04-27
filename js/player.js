// ====================================================
// NETFLIX-STYLE PLAYER - Multi-server, auto-play, remembered server per content
// ====================================================

const SERVERS = [
  {
    id: 'videasy',
    name: 'Videasy',
    nameAr: 'السيرفر الرئيسي',
    badge: 'HD',
    description: 'السيرفر الأصلي - جودة عالية مع ترجمة عربية',
    icon: 'fa-bolt',
    movieUrl: (id) => `https://player.videasy.net/movie/${id}?color=e50914&autoplay=true&subtitle=ar&sub=ar&defaultSubtitle=ar&lang=ar`,
    tvUrl: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}?color=e50914&autoplay=true&subtitle=ar&sub=ar&defaultSubtitle=ar&lang=ar&nextEpisode=true&episodeSelector=true&autoNextEpisode=true`
  },
  {
    id: 'vidsrc',
    name: 'VidSrc',
    nameAr: 'سيرفر عالمي',
    badge: '4K',
    description: 'تركي • عربي • كوري • آسيوي مع ترجمة',
    icon: 'fa-globe',
    movieUrl: (id) => `https://vidsrc.xyz/embed/movie?tmdb=${id}&ds_lang=ar`,
    tvUrl: (id, s, e) => `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}&ds_lang=ar`
  },
  {
    id: 'vidsrcto',
    name: 'VidSrc.to',
    nameAr: 'سيرفر بديل',
    badge: 'HD',
    description: 'كتالوج ضخم متعدد الجودات',
    icon: 'fa-play-circle',
    movieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    nameAr: 'سيرفر آسيوي',
    badge: 'ASIA',
    description: 'محتوى آسيوي وتركي مع ترجمة عربية',
    icon: 'fa-dragon',
    movieUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`
  },
  {
    id: '2embed',
    name: '2Embed',
    nameAr: 'سيرفر احتياطي',
    badge: 'BACKUP',
    description: 'احتياطي إذا توقف الباقي',
    icon: 'fa-shield-alt',
    movieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    tvUrl: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
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
    if (type === 'tv') return server.tvUrl(id, season, episode);
    return server.movieUrl(id);
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

    // AUTO-PLAY: skip episode picker if episode specified OR if resuming
    const continueList = Utils.getContinueWatching ? Utils.getContinueWatching() : [];
    const isResuming = continueList.some(x => String(x.id) === String(id) && x.type === type);

    if (type === 'tv' && !params.get('e') && !isResuming) {
      this.renderEpisodePicker();
    } else {
      // If resuming a TV show without episode param, use the saved episode
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

  // ============ EPISODE PICKER ============
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

  // ============ MAIN PLAYER ============
  renderPlayer() {
    const d = this.currentDetails;
    const wrapper = document.getElementById('playerWrapper');
    const title = Utils.getTitle(d);
    const year = (d.release_date || d.first_air_date || '').substring(0, 4);
    const epLabel = this.currentType === 'tv'
      ? `الموسم ${this.currentSeason} • الحلقة ${this.currentEpisode}`
      : year;

    const streamUrl = this.buildUrl(this.currentType, this.currentId, this.currentSeason, this.currentEpisode);
    const currentServer = this.getServer(this.currentServerId);
    const backHref = this.currentType === 'tv'
      ? `watch.html?id=${this.currentId}&type=tv`
      : 'index.html';

    const serverOptions = SERVERS.map(s => `
      <button class="nf-server-item ${s.id === this.currentServerId ? 'active' : ''}" data-server="${s.id}" tabindex="0">
        <div class="nf-server-icon"><i class="fas ${s.icon}"></i></div>
        <div class="nf-server-info">
          <div class="nf-server-name">
            <span>${s.nameAr}</span>
            <span class="nf-server-badge">${s.badge}</span>
          </div>
          <div class="nf-server-desc">${s.description}</div>
        </div>
        ${s.id === this.currentServerId ? '<i class="fas fa-check nf-server-check"></i>' : ''}
      </button>
    `).join('');

    wrapper.innerHTML = `
      <div class="nf-player" id="nfPlayer">
        <div class="nf-top" id="nfTop">
          <div class="nf-top-left">
            <a href="${backHref}" class="nf-icon-btn" title="عودة" tabindex="0">
              <i class="fas fa-arrow-right"></i>
            </a>
            <div class="nf-logo-mini">N</div>
            <div class="nf-now-playing">
              <span class="nf-np-label">يُعرض الآن · ${currentServer.nameAr}</span>
              <span class="nf-np-title">${title} <span class="nf-np-year">(${epLabel})</span></span>
            </div>
          </div>
          <div class="nf-top-right">
            <button class="nf-server-btn" id="serverBtn" title="اختيار سيرفر" tabindex="0">
              <i class="fas fa-server"></i>
              <span>السيرفرات</span>
              <i class="fas fa-chevron-down nf-chev"></i>
            </button>
            <div class="nf-server-menu" id="serverMenu">
              <div class="nf-server-menu-header">
                <i class="fas fa-server"></i>
                <span>اختر السيرفر المفضل</span>
              </div>
              <div class="nf-server-list">${serverOptions}</div>
              <div class="nf-server-menu-footer">
                <i class="fas fa-info-circle"></i> إذا لم يعمل المحتوى، جرّب سيرفراً آخر
              </div>
            </div>
          </div>
        </div>

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

        ${this.currentType === 'tv' ? `
          <div class="nf-tv-bottom" id="nfTvBottom">
            <button class="nf-tv-btn" id="prevEpBtn" tabindex="0">
              <i class="fas fa-step-backward"></i>
              <span>الحلقة السابقة</span>
            </button>
            <button class="nf-tv-btn" id="episodesListBtn" tabindex="0">
              <i class="fas fa-list"></i>
              <span>كل الحلقات</span>
            </button>
            <button class="nf-tv-btn nf-tv-btn-primary" id="nextEpBtn" tabindex="0">
              <span>الحلقة التالية</span>
              <i class="fas fa-step-forward"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;

    const frame = document.getElementById('nfFrame');
    const loader = document.getElementById('nfLoader');
    frame.addEventListener('load', () => {
      setTimeout(() => loader?.classList.add('hidden'), 800);
    });
    setTimeout(() => loader?.classList.add('hidden'), 6000);

    // Server menu toggle
    const serverBtn = document.getElementById('serverBtn');
    const serverMenu = document.getElementById('serverMenu');
    if (serverBtn && serverMenu) {
      serverBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        serverMenu.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!serverMenu.contains(e.target) && !serverBtn.contains(e.target)) {
          serverMenu.classList.remove('open');
        }
      });
      serverMenu.querySelectorAll('.nf-server-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const newServerId = item.dataset.server;
          if (newServerId === this.currentServerId) {
            serverMenu.classList.remove('open');
            return;
          }
          this.switchServer(newServerId);
        });
      });
    }

    if (this.currentType === 'tv') {
      document.getElementById('prevEpBtn')?.addEventListener('click', () => this.goToPrevEpisode());
      document.getElementById('nextEpBtn')?.addEventListener('click', () => this.goToNextEpisode());
      document.getElementById('episodesListBtn')?.addEventListener('click', () => {
        window.location.href = `watch.html?id=${this.currentId}&type=tv`;
      });
    }

    this.attachKeyboardShortcuts();
    this.setupAutoHide();
  },

  switchServer(newServerId) {
    this.currentServerId = newServerId;
    this.setLastServer(newServerId);
    const server = this.getServer(newServerId);
    const frame = document.getElementById('nfFrame');
    const loader = document.getElementById('nfLoader');
    const menu = document.getElementById('serverMenu');
    const loaderText = loader?.querySelector('.nf-loader-text');
    const npLabel = document.querySelector('.nf-np-label');

    if (loader) loader.classList.remove('hidden');
    if (loaderText) loaderText.textContent = `جاري التحميل من ${server.nameAr}...`;
    if (npLabel) {
      const title = Utils.getTitle(this.currentDetails);
      npLabel.textContent = `يُعرض الآن · ${server.nameAr}`;
    }
    if (menu) menu.classList.remove('open');

    const newUrl = this.buildUrl(this.currentType, this.currentId, this.currentSeason, this.currentEpisode);
    if (frame) frame.src = newUrl;

    document.querySelectorAll('.nf-server-item').forEach(it => {
      const isActive = it.dataset.server === newServerId;
      it.classList.toggle('active', isActive);
      const existing = it.querySelector('.nf-server-check');
      if (isActive && !existing) {
        const check = document.createElement('i');
        check.className = 'fas fa-check nf-server-check';
        it.appendChild(check);
      } else if (!isActive && existing) {
        existing.remove();
      }
    });

    if (Utils.showToast) Utils.showToast(`تم التبديل إلى ${server.nameAr}`);

    setTimeout(() => loader?.classList.add('hidden'), 6000);
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
    window.location.href = `watch.html?id=${this.currentId}&type=tv&s=${this.currentSeason}&e=${this.currentEpisode}`;
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
    window.location.href = `watch.html?id=${this.currentId}&type=tv&s=${this.currentSeason}&e=${this.currentEpisode}`;
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

  setupAutoHide() {
    const player = document.getElementById('nfPlayer');
    if (!player) return;
    let hideTimer;
    const show = () => {
      player.classList.remove('idle');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => player.classList.add('idle'), 4000);
    };
    player.addEventListener('mousemove', show);
    player.addEventListener('mousedown', show);
    player.addEventListener('touchstart', show);
    player.addEventListener('keydown', show);
    show();
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
