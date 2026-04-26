// ====================================================
// NETFLIX-STYLE PLAYER - Single reliable streaming server
// Using player.videasy.net - has Arabic subtitles for all content
// ====================================================

const Player = {
  currentDetails: null,
  currentId: null,
  currentType: 'movie',
  currentSeason: 1,
  currentEpisode: 1,

  // Build the streaming URL with Arabic subtitle auto-selected + autoplay
  buildUrl(type, id, season, episode) {
    const base = 'https://player.videasy.net';
    // Multiple subtitle params for maximum compatibility + all autoplay flags
    const commonParams = [
      'color=e50914',              // Netflix red theme
      'autoplay=true',             // Auto-play on load
      'autoPlay=true',             // alt casing
      'autostart=true',            // alt param
      'muted=false',
      'subtitle=ar',               // Arabic subtitle
      'sub=ar',                    // alt param
      'defaultSubtitle=ar',        // alt param
      'lang=ar',                   // language preference
      'preferredLang=ar',          // alt param
      'subtitleLang=ar'            // alt param
    ].join('&');

    if (type === 'tv') {
      const tvParams = [
        'nextEpisode=true',
        'episodeSelector=true',
        'autoNextEpisode=true',
        'autoPlayNextEpisode=true'
      ].join('&');
      return `${base}/tv/${id}/${season}/${episode}?${commonParams}&${tvParams}`;
    }
    return `${base}/movie/${id}?${commonParams}`;
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
    } catch (e) {
      console.error('Details error:', e);
      return this.showError('خطأ في الاتصال بالخادم');
    }

    // For TV shows without a specific episode parameter, show episode picker
    if (type === 'tv' && !params.get('e')) {
      this.renderEpisodePicker();
    } else {
      this.renderPlayer();
      // Save to Continue Watching as soon as user starts watching
      this.saveToContinueWatching();
      // Keep updating progress every 30 seconds to keep it "fresh"
      this.progressInterval = setInterval(() => this.saveToContinueWatching(), 30000);
    }
  },

  saveToContinueWatching(progress = null) {
    const d = this.currentDetails;
    if (!d) return;
    // Guess progress from how long user has been on page (fallback)
    const timeOnPage = (Date.now() - (this._startTime || Date.now())) / 1000;
    const estimated = Math.min(95, Math.max(5, Math.round((timeOnPage / 300) * 100))); // ~5min movie = 100%
    
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

  // ============ EPISODE PICKER (Netflix-style) ============
  renderEpisodePicker() {
    const d = this.currentDetails;
    const wrapper = document.getElementById('playerWrapper');
    const title = Utils.getTitle(d);
    const seasons = (d.seasons || []).filter(s => s.season_number > 0);

    if (seasons.length === 0) {
      // No seasons info → play directly
      return this.renderPlayer();
    }

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

    // Season tabs
    wrapper.querySelectorAll('.nf-season-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        wrapper.querySelectorAll('.nf-season-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const sn = parseInt(tab.dataset.season, 10);
        this.loadEpisodes(sn);
      });
    });

    // Play first episode
    document.getElementById('playFirstBtn')?.addEventListener('click', () => {
      this.currentSeason = seasons[0].season_number;
      this.currentEpisode = 1;
      this.renderPlayer();
    });

    // Load first season episodes
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

      // Click handlers
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

  // ============ MAIN PLAYER (iframe) ============
  renderPlayer() {
    const d = this.currentDetails;
    const wrapper = document.getElementById('playerWrapper');
    const title = Utils.getTitle(d);
    const year = (d.release_date || d.first_air_date || '').substring(0, 4);
    const epLabel = this.currentType === 'tv'
      ? `الموسم ${this.currentSeason} • الحلقة ${this.currentEpisode}`
      : year;

    const streamUrl = this.buildUrl(this.currentType, this.currentId, this.currentSeason, this.currentEpisode);

    const backHref = this.currentType === 'tv'
      ? `watch.html?id=${this.currentId}&type=tv`
      : 'index.html';

    wrapper.innerHTML = `
      <div class="nf-player" id="nfPlayer">

        <!-- Top Bar (overlay above iframe) -->
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
        </div>

        <!-- Loading overlay -->
        <div class="nf-loader" id="nfLoader">
          <div class="nf-loader-spin"></div>
          <div class="nf-loader-text">جاري التحميل...</div>
        </div>

        <!-- Streaming iframe -->
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
          <!-- Bottom info bar for TV shows -->
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
    frame.addEventListener('load', () => {
      setTimeout(() => loader?.classList.add('hidden'), 800);
    });
    // Fallback: hide loader after 6 seconds regardless
    setTimeout(() => loader?.classList.add('hidden'), 6000);

    // TV navigation buttons
    if (this.currentType === 'tv') {
      document.getElementById('prevEpBtn')?.addEventListener('click', () => this.goToPrevEpisode());
      document.getElementById('nextEpBtn')?.addEventListener('click', () => this.goToNextEpisode());
      document.getElementById('episodesListBtn')?.addEventListener('click', () => {
        window.location.href = `watch.html?id=${this.currentId}&type=tv`;
      });
    }

    // Keyboard shortcuts
    this.attachKeyboardShortcuts();

    // Auto-hide top bar when idle
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
    // Check if there's a next episode in current season
    const currentSeason = (d.seasons || []).find(s => s.season_number === this.currentSeason);
    if (currentSeason && this.currentEpisode < currentSeason.episode_count) {
      this.currentEpisode++;
    } else {
      // Go to next season
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
