// ====================================================
// NETFLIX-STYLE PLAYER - Multi-Server + YouTube Trailer
// Safe default (YouTube) + multiple streaming alternatives
// ====================================================

const Player = {
  currentDetails: null,
  currentId: null,
  currentType: 'movie',
  currentSeason: 1,
  currentEpisode: 1,
  currentServer: 'trailer', // default to YouTube trailer (safest)
  availableTrailer: null,

  // List of streaming servers (user can switch)
  SERVERS: [
    { id: 'trailer', name: 'المقطع الدعائي (YouTube)', safe: true, icon: 'fab fa-youtube' },
    { id: 'vidsrc',  name: 'Server 1 (VidSrc)',        safe: false, icon: 'fas fa-server' },
    { id: 'vidsrc2', name: 'Server 2 (VidSrc Pro)',    safe: false, icon: 'fas fa-server' },
    { id: 'embed2',  name: 'Server 3 (2Embed)',        safe: false, icon: 'fas fa-server' },
    { id: 'multi',   name: 'Server 4 (MultiEmbed)',    safe: false, icon: 'fas fa-server' },
    { id: 'auto',    name: 'Server 5 (AutoEmbed)',     safe: false, icon: 'fas fa-server' }
  ],

  // Build streaming URL based on selected server
  buildUrl(server, type, id, season, episode) {
    const isTV = type === 'tv';
    switch (server) {
      case 'trailer':
        // YouTube embed from TMDB's video array (100% safe)
        if (!this.availableTrailer) return null;
        return `https://www.youtube.com/embed/${this.availableTrailer}?autoplay=1&cc_load_policy=1&cc_lang_pref=ar&hl=ar&rel=0&modestbranding=1`;

      case 'vidsrc':
        return isTV
          ? `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}&ds_lang=ar`
          : `https://vidsrc.xyz/embed/movie?tmdb=${id}&ds_lang=ar`;

      case 'vidsrc2':
        return isTV
          ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
          : `https://vidsrc.to/embed/movie/${id}`;

      case 'embed2':
        return isTV
          ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
          : `https://www.2embed.cc/embed/${id}`;

      case 'multi':
        return isTV
          ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
          : `https://multiembed.mov/?video_id=${id}&tmdb=1`;

      case 'auto':
        return isTV
          ? `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`
          : `https://player.autoembed.cc/embed/movie/${id}`;

      default:
        return null;
    }
  },

  async init() {
    document.body.classList.add('player-mode');
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = params.get('type') || 'movie';
    const season = parseInt(params.get('s') || '1', 10);
    const episode = parseInt(params.get('e') || '1', 10);

    if (!id) return this.showError('لم يتم تحديد محتوى للمشاهدة');

    this.currentId = id;
    this.currentType = type;
    this.currentSeason = season;
    this.currentEpisode = episode;

    // Load details
    try {
      const details = type === 'tv'
        ? await API.getTVDetails(id)
        : await API.getMovieDetails(id);
      if (!details || !details.id) return this.showError('تعذر تحميل بيانات المحتوى');
      this.currentDetails = details;

      // Extract YouTube trailer (prefer Arabic, else English, else any)
      this.availableTrailer = this.extractTrailer(details);
    } catch (e) {
      console.error('Details error:', e);
      return this.showError('خطأ في الاتصال بالخادم');
    }

    // Default server: trailer if available, otherwise first streaming server
    if (!this.availableTrailer) {
      this.currentServer = 'vidsrc';
    }

    // For TV shows without a specific episode parameter, show episode picker
    if (type === 'tv' && !params.get('e')) {
      this.renderEpisodePicker();
    } else {
      this.renderPlayer();
      this.saveToContinueWatching();
      this.progressInterval = setInterval(() => this.saveToContinueWatching(), 30000);
    }
  },

  extractTrailer(details) {
    const videos = details.videos && details.videos.results ? details.videos.results : [];
    // Priority: Trailer > Teaser > Clip, prefer YouTube + Arabic
    const youtubeVids = videos.filter(v => v.site === 'YouTube');
    const trailers = youtubeVids.filter(v => v.type === 'Trailer');
    const teasers = youtubeVids.filter(v => v.type === 'Teaser');
    const best = trailers[0] || teasers[0] || youtubeVids[0];
    return best ? best.key : null;
  },

  saveToContinueWatching(progress = null) {
    const d = this.currentDetails;
    if (!d) return;
    const timeOnPage = (Date.now() - (this._startTime || Date.now())) / 1000;
    const estimated = Math.min(95, Math.max(5, Math.round((timeOnPage / 300) * 100)));
    if (!this._startTime) this._startTime = Date.now();

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
            <i class="fas fa-play"></i> تشغيل
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
        const sn = parseInt(tab.dataset.season, 10);
        this.loadEpisodes(sn);
      });
    });

    document.getElementById('playFirstBtn')?.addEventListener('click', () => {
      this.currentSeason = seasons[0].season_number;
      this.currentEpisode = 1;
      this.renderPlayer();
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
        const epOverview = ep.overview || 'لا يوجد وصف متاح لهذه الحلقة.';
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

    const streamUrl = this.buildUrl(this.currentServer, this.currentType, this.currentId, this.currentSeason, this.currentEpisode);
    const backHref = this.currentType === 'tv'
      ? `watch.html?id=${this.currentId}&type=tv`
      : 'index.html';

    const currentServerInfo = this.SERVERS.find(s => s.id === this.currentServer);

    wrapper.innerHTML = `
      <div class="nf-player" id="nfPlayer">

        <!-- Top Bar -->
        <div class="nf-top" id="nfTop">
          <div class="nf-top-left">
            <a href="${backHref}" class="nf-icon-btn" title="عودة" tabindex="0">
              <i class="fas fa-arrow-right"></i>
            </a>
            <div class="nf-logo-mini">N</div>
            <div class="nf-now-playing">
              <span class="nf-np-label">يُعرض الآن</span>
              <span class="nf-np-title">${title} <span class="nf-np-year">(${epLabel})</span></span>
            </div>
          </div>
          <div class="nf-top-right">
            <button class="nf-icon-btn" id="serverMenuBtn" title="تغيير السيرفر" tabindex="0">
              <i class="${currentServerInfo ? currentServerInfo.icon : 'fas fa-server'}"></i>
            </button>
          </div>
        </div>

        <!-- Server menu dropdown -->
        <div class="nf-server-menu" id="serverMenu">
          <div class="nf-server-menu-title">اختر السيرفر</div>
          ${this.SERVERS.map(s => {
            const disabled = s.id === 'trailer' && !this.availableTrailer;
            return `
              <button class="nf-server-item ${this.currentServer === s.id ? 'active' : ''} ${disabled ? 'disabled' : ''}" 
                      data-server="${s.id}" ${disabled ? 'disabled' : ''} tabindex="0">
                <i class="${s.icon}"></i>
                <span>${s.name}</span>
                ${s.safe ? '<span class="nf-safe-badge">آمن</span>' : ''}
                ${this.currentServer === s.id ? '<i class="fas fa-check nf-check"></i>' : ''}
              </button>
            `;
          }).join('')}
          <div class="nf-server-note">
            <i class="fas fa-info-circle"></i>
            <span>إذا ظهر تحذير "موقع خطير" جرّب سيرفر آخر أو استخدم المقطع الدعائي</span>
          </div>
        </div>

        <!-- Loading overlay -->
        <div class="nf-loader" id="nfLoader">
          <div class="nf-loader-spin"></div>
          <div class="nf-loader-text">جاري التحميل...</div>
        </div>

        ${streamUrl ? `
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
        ` : `
          <div class="nf-no-stream">
            <i class="fas fa-exclamation-circle"></i>
            <h2>لا يوجد مقطع دعائي متاح</h2>
            <p>يرجى اختيار سيرفر آخر من القائمة أعلاه</p>
          </div>
        `}

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

    // Hide loader when iframe loads
    const frame = document.getElementById('nfFrame');
    const loader = document.getElementById('nfLoader');
    if (frame) {
      frame.addEventListener('load', () => {
        setTimeout(() => loader?.classList.add('hidden'), 800);
      });
    }
    setTimeout(() => loader?.classList.add('hidden'), 6000);

    // Server menu toggle
    const serverBtn = document.getElementById('serverMenuBtn');
    const serverMenu = document.getElementById('serverMenu');
    if (serverBtn && serverMenu) {
      serverBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        serverMenu.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!serverMenu.contains(e.target) && e.target !== serverBtn) {
          serverMenu.classList.remove('open');
        }
      });
      // Server switching
      serverMenu.querySelectorAll('.nf-server-item').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const newServer = btn.dataset.server;
          if (newServer !== this.currentServer) {
            this.currentServer = newServer;
            this.renderPlayer();
          }
        });
      });
    }

    // TV navigation
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
