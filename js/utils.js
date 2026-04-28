const Utils = {
  truncate(str, n) { return !str ? '' : str.length > n ? str.substr(0, n - 1) + '...' : str; },
  getImage(path, size = 'original') {
    if (!path) return CONFIG.DEFAULT_POSTER;
    const base = size === 'w500' ? CONFIG.IMG_URL_W500 : size === 'w300' ? CONFIG.IMG_URL_W300 : CONFIG.IMG_URL;
    return `${base}${path}`;
  },
  getBackdrop(path) { return path ? `${CONFIG.IMG_URL}${path}` : CONFIG.DEFAULT_BACKDROP; },
  isLatinText(str) {
    if (!str) return false;
    const nonLatinRe = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff\u0590-\u05ff\u0e00-\u0e7f]/;
    if (nonLatinRe.test(str)) return false;
    const latinChars = (str.match(/[A-Za-z0-9\s\-:'!?&,.()\[\]\/]/g) || []).length;
    return latinChars / str.length >= 0.6;
  },
  getTitle(item) {
    if (!item) return 'Untitled';
    const en = item.title || item.name;
    if (en && this.isLatinText(en)) return en;
    const orig = item.original_title || item.original_name;
    if (orig && this.isLatinText(orig)) return orig;
    return en || orig || 'Untitled';
  },
  getTitleAr(item) { return (item && (item.title_ar || item.name_ar)) || ''; },
  getOverview(item) {
    if (!item) return '';
    if (item.overview_ar && item.overview_ar.trim()) return item.overview_ar;
    if (item.overview && /[\u0600-\u06ff]/.test(item.overview)) return item.overview;
    return '';
  },
  getOverviewSafe(item, placeholder = 'لا يوجد وصف متاح لهذا العنوان.') {
    const ar = this.getOverview(item);
    if (ar) return ar;
    if (item && item.overview && item.overview.trim()) return item.overview;
    return placeholder;
  },
  getYear(item) {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : '';
  },
  getRating(vote) { return vote ? (vote / 2).toFixed(1) : 'N/A'; },
  formatRuntime(mins) {
    if (!mins) return '';
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  },
  getMediaType(item) { return item.media_type || (item.first_air_date ? 'tv' : 'movie'); },

  getQueryParam(name) {
    try { return new URLSearchParams(window.location.search).get(name) || ''; }
    catch { return ''; }
  },

  // ====== SERVER PICKER ======
  // Shows a modal asking the user to pick server 1 or 2 before entering the watch page.
  // opts: { id, type, season, episode }
  showServerPicker(opts) {
    const id = opts.id;
    const type = opts.type || 'movie';
    const season = opts.season || null;
    const episode = opts.episode || null;

    // Default server preference from localStorage (Videasy if nothing saved)
    const VALID_SERVERS = ['videasy', 'vidsrccc'];
    let defaultServer = 'videasy';
    try {
      const saved = localStorage.getItem(`netflixServer_${type}_${id}`)
                 || localStorage.getItem('netflixDefaultServer');
      if (VALID_SERVERS.includes(saved)) defaultServer = saved;
    } catch {}

    // Remove existing picker if present
    const existing = document.getElementById('serverPickerModal');
    if (existing) existing.remove();

    const picker = document.createElement('div');
    picker.id = 'serverPickerModal';
    picker.className = 'srv-picker-modal active';
    picker.innerHTML = `
      <div class="srv-picker-backdrop"></div>
      <div class="srv-picker-box">
        <button class="srv-picker-close" title="إغلاق" aria-label="إغلاق">
          <i class="fas fa-times"></i>
        </button>
        <div class="srv-picker-header">
          <div class="srv-picker-icon"><i class="fas fa-play-circle"></i></div>
          <h2>اختر السيرفر</h2>
          <p>يمكنك التبديل بين السيرفرات إذا لم يعمل أحدهما</p>
        </div>
        <div class="srv-picker-list">
          <button class="srv-picker-option ${defaultServer === 'videasy' ? 'recommended' : ''}" data-server="videasy">
            <div class="srv-picker-opt-icon"><i class="fas fa-bolt"></i></div>
            <div class="srv-picker-opt-body">
              <div class="srv-picker-opt-title">
                <span>السيرفر 1</span>
                <span class="srv-picker-badge">مُوصى به</span>
              </div>
              <div class="srv-picker-opt-desc">جودة عالية HD • ترجمة عربية تلقائية</div>
            </div>
            <i class="fas fa-chevron-left srv-picker-chev"></i>
          </button>
          <button class="srv-picker-option ${defaultServer === 'vidsrccc' ? 'recommended' : ''}" data-server="vidsrccc">
            <div class="srv-picker-opt-icon"><i class="fas fa-globe"></i></div>
            <div class="srv-picker-opt-body">
              <div class="srv-picker-opt-title">
                <span>السيرفر 2</span>
                <span class="srv-picker-badge alt">بديل</span>
              </div>
              <div class="srv-picker-opt-desc">يدعم الأفلام والمسلسلات العربية • ترجمة عربية (حسب التوفر)</div>
            </div>
            <i class="fas fa-chevron-left srv-picker-chev"></i>
          </button>
        </div>
        <div class="srv-picker-footer">
          <i class="fas fa-info-circle"></i>
          <span>إذا لم يعمل السيرفر، ارجع وجرّب الآخر</span>
        </div>
      </div>
    `;
    document.body.appendChild(picker);
    document.body.style.overflow = 'hidden';

    const close = () => {
      picker.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => picker.remove(), 200);
    };

    picker.querySelector('.srv-picker-close').addEventListener('click', close);
    picker.querySelector('.srv-picker-backdrop').addEventListener('click', close);
    const escHandler = (e) => {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);

    picker.querySelectorAll('.srv-picker-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const serverId = btn.dataset.server;
        // Persist choice so continue-watching auto-uses it later
        try {
          localStorage.setItem(`netflixServer_${type}_${id}`, serverId);
          localStorage.setItem('netflixDefaultServer', serverId);
        } catch {}

        // Visual feedback + prevent double click
        btn.classList.add('recommended');
        btn.setAttribute('aria-busy', 'true');

        let url = `watch.html?id=${id}&type=${type}&server=${serverId}&autoplay=1`;
        if (type === 'tv' && season) url += `&s=${season}`;
        if (type === 'tv' && episode) url += `&e=${episode}`;

        // Immediate navigation to selected server
        window.location.assign(url);
      });
    });

    // Focus first option for keyboard users
    setTimeout(() => picker.querySelector('.srv-picker-option')?.focus(), 100);
  },

  createCard(item, index = 0) {
    const poster = this.getImage(item.poster_path, 'w500');
    const title = this.getTitle(item);
    const id = item.id, mediaType = this.getMediaType(item);
    const rating = this.getRating(item.vote_average), year = this.getYear(item);
    return `
      <div class="card" data-id="${id}" data-type="${mediaType}" tabindex="0" style="animation-delay: ${index * 0.04}s">
        <div class="card-img-wrap">
          <img src="${poster}" alt="${title}" loading="lazy" onerror="this.src='${CONFIG.DEFAULT_POSTER}'">
          <span class="hd-badge">HD</span>
          <div class="card-hover-overlay">
            <h3 class="card-hover-title">${title}</h3>
            <div class="card-hover-meta">
              <span class="year">${year}</span>
              <span class="dot">•</span>
              <span class="rating"><i class="fas fa-star"></i> ${rating}</span>
            </div>
          </div>
        </div>
      </div>`;
  },

  createPosterCard(item, index = 0) {
    const poster = this.getImage(item.poster_path, 'w500');
    const title = this.getTitle(item);
    return `
      <div class="card card-poster" data-id="${item.id}" data-type="${this.getMediaType(item)}" tabindex="0" style="animation-delay: ${index * 0.04}s">
        <img src="${poster}" alt="${title}" loading="lazy" onerror="this.src='${CONFIG.DEFAULT_POSTER}'">
      </div>`;
  },

  createContinueCard(item, index = 0) {
    const backdrop = this.getBackdrop(item.backdrop_path);
    const title = item.title || 'Unknown';
    const progress = Math.min(100, Math.max(2, item.progress || 0));
    const subtitle = item.type === 'tv' && item.season ? `الموسم ${item.season} • الحلقة ${item.episode || 1}` : (item.year || 'فيلم');
    // Note: clicking the card opens the details popup (handled by attachCardListeners).
    // No direct watch link here — user must choose "تشغيل" or "متابعة المشاهدة" inside the popup.
    return `
      <div class="card card-continue" data-id="${item.id}" data-type="${item.type}" tabindex="0" style="animation-delay: ${index * 0.04}s">
        <div class="card-img-wrap continue-img-wrap">
          <img src="${backdrop}" alt="${title}" loading="lazy" onerror="this.src='${CONFIG.DEFAULT_BACKDROP}'">
          <div class="continue-overlay">
            <div class="continue-play" title="عرض التفاصيل"><i class="fas fa-play-circle"></i></div>
            <button class="continue-remove" title="إزالة" data-id="${item.id}" data-type="${item.type}"><i class="fas fa-times"></i></button>
          </div>
          <div class="continue-progress"><div class="continue-progress-bar" style="width: ${progress}%"></div></div>
        </div>
        <div class="card-info continue-info">
          <h3>${title}</h3>
          <div class="card-meta"><span>${subtitle}</span><span class="resume-text">استئناف</span></div>
        </div>
      </div>`;
  },

  renderRow(containerId, items, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!items || !items.length) { const r = container.closest('.row'); if (r) r.style.display = 'none'; return; }
    const row = container.closest('.row'); if (row) row.style.display = '';
    let cardFn = options.continueStyle ? 'createContinueCard' : options.posterStyle ? 'createPosterCard' : 'createCard';
    const filtered = options.continueStyle ? items : items.filter(i => i.poster_path || i.backdrop_path);
    container.innerHTML = filtered.map((it, i) => this[cardFn](it, i)).join('');
    this.attachCardListeners(container);
  },

  attachCardListeners(container) {
    container.querySelectorAll('.card').forEach(card => {
      const id = card.dataset.id, type = card.dataset.type;
      card.addEventListener('click', (e) => {
        // Remove button on Continue Watching card — handled first and stops propagation
        if (e.target.closest('.continue-remove')) {
          e.preventDefault(); e.stopPropagation();
          const btn = e.target.closest('.continue-remove');
          Utils.removeFromContinueWatching(btn.dataset.id, btn.dataset.type);
          Utils.showToast('تمت الإزالة من "متابعة المشاهدة"');
          card.style.transform = 'scale(0)'; card.style.opacity = '0';
          setTimeout(() => card.remove(), 300); return;
        }
        // Continue Watching card → open details popup with resume option
        if (card.classList.contains('card-continue')) {
          e.preventDefault(); e.stopPropagation();
          this.openDetailsModal(id, type, { continueWatching: true });
          return;
        }
        if (e.target.closest('.btn-play') || e.target.closest('.card-play-hover')) {
          e.preventDefault(); e.stopPropagation();
          this.showServerPicker({ id, type });
        } else if (e.target.closest('.btn-add')) {
          const added = this.toggleMyList(id, type);
          this.showToast(added ? 'تمت الإضافة إلى قائمتي' : 'تمت الإزالة من قائمتي');
          const icon = e.target.closest('.btn-add').querySelector('i');
          if (icon) icon.className = added ? 'fas fa-check' : 'fas fa-plus';
        } else if (e.target.closest('.btn-trailer-card')) {
          e.preventDefault(); e.stopPropagation();
          this.openTrailerFor(id, type);
        } else {
          this.openDetailsModal(id, type);
        }
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); card.click(); }
      });
    });
  },

  async openTrailerFor(id, type) {
    this.showToast('جاري تحميل الإعلان...');
    try {
      const details = type === 'tv' ? await API.getTVDetails(id) : await API.getMovieDetails(id);
      const videos = (details && details.videos && details.videos.results) || [];
      const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
                      videos.find(v => v.type === 'Teaser' && v.site === 'YouTube') ||
                      videos.find(v => v.site === 'YouTube');
      if (trailer) this.openTrailerModal(trailer.key);
      else {
        const title = this.getTitle(details);
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`, '_blank');
      }
    } catch (e) { this.showToast('تعذر تحميل الإعلان'); }
  },

  setupCarouselScroll() {
    document.querySelectorAll('.row').forEach(row => {
      const content = row.querySelector('.row-content');
      const leftBtn = row.querySelector('.scroll-left');
      const rightBtn = row.querySelector('.scroll-right');
      if (!content) return;
      if (leftBtn) leftBtn.addEventListener('click', () => content.scrollBy({ left: -content.offsetWidth * 0.85, behavior: 'smooth' }));
      if (rightBtn) rightBtn.addEventListener('click', () => content.scrollBy({ left: content.offsetWidth * 0.85, behavior: 'smooth' }));
    });
    // Always reveal rows (required because CSS hides rows with opacity:0 until .visible class added)
    this.setupScrollReveal();
  },

  setupScrollReveal() {
    const rows = document.querySelectorAll('.row');
    if (!rows.length) return;
    // If IntersectionObserver unsupported, reveal all immediately
    if (!('IntersectionObserver' in window)) {
      rows.forEach(r => r.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '100px 0px' });
    rows.forEach(row => {
      // If row is already in/near viewport at load, reveal immediately
      const rect = row.getBoundingClientRect();
      if (rect.top < window.innerHeight + 300) {
        row.classList.add('visible');
      } else {
        observer.observe(row);
      }
    });
    // Safety net: force-reveal any remaining hidden rows after 2s
    setTimeout(() => {
      rows.forEach(r => r.classList.add('visible'));
    }, 2000);
  },

  highlightRow(rowId, scrollTo = true) {
    const container = document.getElementById(rowId);
    if (!container) return;
    const row = container.closest('.row');
    if (!row) return;
    document.querySelectorAll('.row.highlighted').forEach(r => r.classList.remove('highlighted'));
    row.classList.add('highlighted');
    if (scrollTo) {
      setTimeout(() => {
        const top = row.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }, 300);
    }
    setTimeout(() => row.classList.remove('highlighted'), 5000);
  },

  // ===== PER-PROFILE STORAGE HELPERS =====
  // Each profile has its own "My List" and "Continue Watching" so users don't mix data.
  getActiveProfileId() {
    try {
      const id = localStorage.getItem('netflixy_active_profile');
      return id || 'guest';
    } catch { return 'guest'; }
  },
  _myListKey() { return `netflixMyList_${this.getActiveProfileId()}`; },
  _continueKey() { return `netflixContinue_${this.getActiveProfileId()}`; },

  // Migrate legacy global keys to the active profile ONCE (first time we see them)
  _migrateLegacyStorage() {
    try {
      const pid = this.getActiveProfileId();
      if (pid === 'guest') return;
      const migrated = localStorage.getItem(`netflix_migrated_${pid}`);
      if (migrated === '1') return;

      const oldList = localStorage.getItem('netflixMyList');
      if (oldList && !localStorage.getItem(this._myListKey())) {
        localStorage.setItem(this._myListKey(), oldList);
      }
      const oldCont = localStorage.getItem('netflixContinue');
      if (oldCont && !localStorage.getItem(this._continueKey())) {
        localStorage.setItem(this._continueKey(), oldCont);
      }
      localStorage.setItem(`netflix_migrated_${pid}`, '1');
    } catch {}
  },

  getMyList() {
    this._migrateLegacyStorage();
    try { return JSON.parse(localStorage.getItem(this._myListKey()) || '[]'); } catch { return []; }
  },
  addToMyList(item) {
    const list = this.getMyList();
    if (!list.find(x => x.id == item.id && x.type == item.type)) {
      list.push(item); localStorage.setItem(this._myListKey(), JSON.stringify(list)); return true;
    } return false;
  },
  removeFromMyList(id, type) {
    const list = this.getMyList().filter(x => !(x.id == id && x.type == type));
    localStorage.setItem(this._myListKey(), JSON.stringify(list));
  },
  clearMyList() { localStorage.setItem(this._myListKey(), '[]'); },
  toggleMyList(id, type) {
    if (this.isInMyList(id, type)) { this.removeFromMyList(id, type); return false; }
    this.addToMyList({ id, type, addedAt: Date.now() }); return true;
  },
  isInMyList(id, type) { return !!this.getMyList().find(x => x.id == id && x.type == type); },

  getContinueWatching() {
    this._migrateLegacyStorage();
    try { return JSON.parse(localStorage.getItem(this._continueKey()) || '[]').sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); }
    catch { return []; }
  },
  saveContinueWatching(data) {
    try {
      let list = this.getContinueWatching();
      const existing = list.findIndex(x => x.id == data.id && x.type == data.type);
      const entry = {
        id: data.id, type: data.type, title: data.title || 'Unknown',
        backdrop_path: data.backdrop_path || '', year: data.year || '',
        season: data.season || null, episode: data.episode || null,
        progress: Math.min(100, Math.max(0, data.progress || 0)),
        updatedAt: Date.now()
      };
      if (existing >= 0) list[existing] = entry; else list.push(entry);
      list = list.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);
      localStorage.setItem(this._continueKey(), JSON.stringify(list));
    } catch (e) {}
  },
  removeFromContinueWatching(id, type) {
    try {
      const list = this.getContinueWatching().filter(x => !(x.id == id && x.type == type));
      localStorage.setItem(this._continueKey(), JSON.stringify(list));
    } catch {}
  },
  clearContinueWatching() { localStorage.setItem(this._continueKey(), '[]'); },

  showToast(message, duration = 2500) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message; toast.classList.add('show');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => toast.classList.remove('show'), duration);
  },

  async openDetailsModal(id, type, options = {}) {
    const modal = document.getElementById('detailsModal');
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const body = modal.querySelector('.modal-body');
    body.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i></div>';

    const details = type === 'tv' ? await API.getTVDetails(id) : await API.getMovieDetails(id);
    if (!details || !details.id) {
      body.innerHTML = '<p style="padding: 40px; text-align: center;">لا يمكن تحميل التفاصيل</p>'; return;
    }
    const title = this.getTitle(details);
    const titleAr = this.getTitleAr(details);
    const showArTitle = titleAr && titleAr !== title;
    const backdrop = this.getBackdrop(details.backdrop_path);
    const genres = (details.genres || []).map(g => g.name).join(' • ');
    const runtime = details.runtime ? this.formatRuntime(details.runtime) :
      (details.episode_run_time && details.episode_run_time[0]) ? this.formatRuntime(details.episode_run_time[0]) : '';
    const cast = ((details.credits && details.credits.cast) || []).slice(0, 5).map(c => c.name).join(', ');
    const videos = (details.videos && details.videos.results) || [];
    const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
      videos.find(v => v.type === 'Teaser' && v.site === 'YouTube') ||
      videos.find(v => v.site === 'YouTube');
    const inList = this.isInMyList(id, type);
    const similar = ((details.similar && details.similar.results) || []).filter(s => s.backdrop_path || s.poster_path).slice(0, 8);
    const overview = this.getOverviewSafe(details);

    // Check continue-watching data for this item (used to show "Resume" button)
    const continueList = this.getContinueWatching();
    const cwEntry = continueList.find(x => String(x.id) === String(id) && x.type === type);
    const showResume = !!cwEntry || options.continueWatching;
    const resumeSeason = cwEntry && cwEntry.season ? cwEntry.season : 1;
    const resumeEpisode = cwEntry && cwEntry.episode ? cwEntry.episode : 1;
    const resumeLabel = type === 'tv'
      ? `متابعة (ح${resumeEpisode} - الموسم ${resumeSeason})`
      : 'متابعة المشاهدة';

    body.innerHTML = `
      <div class="modal-hero" style="background-image: linear-gradient(to top, #181818 5%, transparent 60%), url('${backdrop}')">
        <div class="modal-hero-content">
          <h1>${title}</h1>
          ${showArTitle ? `<div class="modal-ar-title">${titleAr}</div>` : ''}
          <div class="modal-actions">
            ${type === 'movie' ? `
              <button class="btn btn-primary btn-play-modal" data-id="${id}" data-type="${type}"><i class="fas fa-play"></i> تشغيل</button>
            ` : ''}
            ${showResume ? `
              <button class="btn btn-resume btn-resume-modal" data-id="${id}" data-type="${type}" data-season="${resumeSeason}" data-episode="${resumeEpisode}">
                <i class="fas fa-redo"></i> ${resumeLabel}
              </button>
            ` : ''}
            <button class="btn btn-secondary btn-trailer-modal" data-key="${trailer ? trailer.key : ''}" data-id="${id}" data-type="${type}"><i class="fas fa-film"></i> الإعلان الدعائي</button>
            <button class="btn-circle btn-toggle-list" data-id="${id}" data-type="${type}" title="${inList ? 'إزالة من قائمتي' : 'أضف لقائمتي'}"><i class="fas ${inList ? 'fa-check' : 'fa-plus'}"></i></button>
          </div>
        </div>
      </div>
      <div class="modal-details">
        <div class="modal-details-main">
          <div class="modal-meta">
            <span class="match">${Math.round((details.vote_average || 0) * 10)}% مطابقة</span>
            <span>${this.getYear(details)}</span>
            ${runtime ? `<span>${runtime}</span>` : ''}
            <span class="hd-badge">HD</span>
          </div>
          <p class="modal-overview" dir="rtl">${overview}</p>
        </div>
        <div class="modal-details-side">
          ${cast ? `<p><span class="dim">الأبطال:</span> ${cast}</p>` : ''}
          ${genres ? `<p><span class="dim">النوع:</span> ${genres}</p>` : ''}
          ${details.vote_average ? `<p><span class="dim">التقييم:</span> ⭐ ${details.vote_average.toFixed(1)}/10</p>` : ''}
          ${details.number_of_seasons ? `<p><span class="dim">المواسم:</span> ${details.number_of_seasons}</p>` : ''}
        </div>
      </div>
      ${type === 'tv' && details.seasons && details.seasons.filter(s => s.season_number > 0).length ? `
        <div class="modal-episodes">
          <div class="modal-ep-header">
            <h3>الحلقات</h3>
            <select class="modal-season-select" id="modalSeasonSelect">
              ${details.seasons.filter(s => s.season_number > 0).map(s =>
                `<option value="${s.season_number}" ${s.season_number === resumeSeason ? 'selected' : ''}>الموسم ${s.season_number}</option>`
              ).join('')}
            </select>
          </div>
          <div class="modal-ep-list" id="modalEpList">
            <div class="loader"><i class="fas fa-spinner fa-spin"></i></div>
          </div>
        </div>
      ` : ''}
      ${similar.length ? `
        <div class="modal-similar">
          <h3>محتوى مشابه</h3>
          <div class="modal-similar-grid">
            ${similar.map(s => {
              const sType = this.getMediaType(s);
              const simTitle = this.getTitle(s);
              return `
                <button class="sim-card" data-sim-id="${s.id}" data-sim-type="${sType}">
                  <img src="${this.getBackdrop(s.backdrop_path || s.poster_path)}" alt="${simTitle}" loading="lazy">
                  <div class="sim-play"><i class="fas fa-play"></i></div>
                  <div class="sim-overlay">
                    <div class="sim-info">
                      <h4>${simTitle}</h4>
                      <span>${Math.round((s.vote_average || 0) * 10)}% • ${this.getYear(s)}</span>
                    </div>
                  </div>
                </button>`;
            }).join('')}
          </div>
        </div>` : ''}
    `;

    const trailerBtn = body.querySelector('.btn-trailer-modal');
    if (trailerBtn) {
      trailerBtn.addEventListener('click', () => {
        const key = trailerBtn.dataset.key;
        if (key) this.openTrailerModal(key);
        else this.openTrailerFor(trailerBtn.dataset.id, trailerBtn.dataset.type);
      });
    }
    const playModalBtn = body.querySelector('.btn-play-modal');
    if (playModalBtn) {
      playModalBtn.addEventListener('click', () => {
        // "تشغيل" = start from beginning → open server picker
        const detailsModal = document.getElementById('detailsModal');
        if (detailsModal) detailsModal.classList.remove('active');
        document.body.style.overflow = '';
        this.showServerPicker({ id: playModalBtn.dataset.id, type: playModalBtn.dataset.type });
      });
    }

    // "متابعة المشاهدة" — jump directly to saved episode/position (no server picker, use saved server)
    const resumeBtn = body.querySelector('.btn-resume-modal');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        const rId = resumeBtn.dataset.id;
        const rType = resumeBtn.dataset.type;
        const rSeason = resumeBtn.dataset.season || 1;
        const rEpisode = resumeBtn.dataset.episode || 1;
        let preferred = 'videasy';
        try {
          preferred = localStorage.getItem(`netflixServer_${rType}_${rId}`)
                   || localStorage.getItem('netflixDefaultServer')
                   || 'videasy';
        } catch {}
        const detailsModal = document.getElementById('detailsModal');
        if (detailsModal) detailsModal.classList.remove('active');
        document.body.style.overflow = '';
        const watchUrl = rType === 'tv'
          ? `watch.html?id=${rId}&type=tv&s=${rSeason}&e=${rEpisode}&server=${preferred}&autoplay=1`
          : `watch.html?id=${rId}&type=movie&server=${preferred}&autoplay=1`;
        window.location.assign(watchUrl);
      });
    }

    body.querySelectorAll('.sim-card').forEach(simBtn => {
      simBtn.addEventListener('click', () => {
        const detailsModal = document.getElementById('detailsModal');
        if (detailsModal) detailsModal.classList.remove('active');
        document.body.style.overflow = '';
        this.showServerPicker({ id: simBtn.dataset.simId, type: simBtn.dataset.simType });
      });
    });

    const addBtn = body.querySelector('.btn-toggle-list');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const added = this.toggleMyList(id, type);
        this.showToast(added ? 'تمت الإضافة إلى قائمتي' : 'تمت الإزالة من قائمتي');
        const icon = addBtn.querySelector('i');
        if (icon) icon.className = added ? 'fas fa-check' : 'fas fa-plus';
        addBtn.title = added ? 'إزالة من قائمتي' : 'أضف لقائمتي';
      });
    }

    // Episodes list inside modal (TV shows only)
    const seasonSelect = body.querySelector('#modalSeasonSelect');
    const epListEl = body.querySelector('#modalEpList');
    if (seasonSelect && epListEl) {
      const loadEpisodesInModal = async (seasonNum) => {
        epListEl.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i></div>';
        try {
          const seasonData = await API.getSeasonDetails(id, seasonNum);
          const episodes = (seasonData && seasonData.episodes) || [];
          if (!episodes.length) {
            epListEl.innerHTML = '<p class="modal-ep-empty">لا توجد حلقات متاحة</p>';
            return;
          }
          epListEl.innerHTML = episodes.map(ep => {
            const thumb = ep.still_path
              ? `${CONFIG.IMG_URL_W500}${ep.still_path}`
              : this.getBackdrop(details.backdrop_path);
            const epName = ep.name || `الحلقة ${ep.episode_number}`;
            const runtime = ep.runtime ? `${ep.runtime} د` : '';
            const desc = ep.overview || 'لا يوجد وصف متاح.';
            const isResume = cwEntry && cwEntry.season === seasonNum && cwEntry.episode === ep.episode_number;
            return `
              <button class="modal-ep-item ${isResume ? 'is-resume' : ''}" data-season="${seasonNum}" data-episode="${ep.episode_number}">
                <div class="modal-ep-num">${ep.episode_number}</div>
                <div class="modal-ep-thumb">
                  <img src="${thumb}" alt="${epName}" loading="lazy" onerror="this.src='${CONFIG.DEFAULT_BACKDROP}'">
                  <div class="modal-ep-play-ov"><i class="fas fa-play"></i></div>
                  ${isResume ? '<span class="modal-ep-badge">متابعة</span>' : ''}
                </div>
                <div class="modal-ep-info">
                  <div class="modal-ep-title-row">
                    <h4>${epName}</h4>
                    ${runtime ? `<span class="modal-ep-time">${runtime}</span>` : ''}
                  </div>
                  <p class="modal-ep-desc">${this.truncate(desc, 180)}</p>
                </div>
              </button>
            `;
          }).join('');

          // Episode click → open server picker with selected season/episode
          epListEl.querySelectorAll('.modal-ep-item').forEach(item => {
            item.addEventListener('click', () => {
              const s = parseInt(item.dataset.season, 10);
              const e = parseInt(item.dataset.episode, 10);
              const dm = document.getElementById('detailsModal');
              if (dm) dm.classList.remove('active');
              document.body.style.overflow = '';
              this.showServerPicker({ id, type: 'tv', season: s, episode: e });
            });
          });
        } catch (err) {
          epListEl.innerHTML = '<p class="modal-ep-empty">تعذر تحميل الحلقات</p>';
        }
      };

      seasonSelect.addEventListener('change', () => {
        loadEpisodesInModal(parseInt(seasonSelect.value, 10));
      });
      // Initial load
      loadEpisodesInModal(parseInt(seasonSelect.value, 10));
    }
  },

  openTrailerModal(videoKey) {
    const modal = document.getElementById('trailerModal');
    if (!modal || !videoKey) return;
    const iframe = modal.querySelector('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  setupModals() {
    document.querySelectorAll('.modal, .trailer-modal').forEach(m => {
      const close = () => {
        m.classList.remove('active');
        document.body.style.overflow = '';
        const iframe = m.querySelector('iframe');
        if (iframe) iframe.src = '';
      };
      const closeBtn = m.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', close);
      m.addEventListener('click', (e) => { if (e.target === m) close(); });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active, .trailer-modal.active').forEach(m => {
          m.classList.remove('active');
          document.body.style.overflow = '';
          const iframe = m.querySelector('iframe');
          if (iframe) iframe.src = '';
        });
      }
    });
  },

  setupNavbar() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
      });
    }
    const toggle = document.querySelector('.menu-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        links.classList.toggle('active');
        const icon = toggle.querySelector('i');
        if (icon) icon.className = links.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
      });
      // Close mobile menu when a link is tapped (not the dropdown toggle)
      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', (e) => {
          if (a.classList.contains('nav-dropdown-toggle')) return;
          if (window.innerWidth <= 768) {
            links.classList.remove('active');
            const icon = toggle.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
          }
        });
      });
      // Close mobile menu when clicking outside
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            links.classList.contains('active') &&
            !links.contains(e.target) &&
            !toggle.contains(e.target)) {
          links.classList.remove('active');
          const icon = toggle.querySelector('i');
          if (icon) icon.className = 'fas fa-bars';
        }
      });
    }
    // Dropdown click handler (mobile/TV + accessibility)
    document.querySelectorAll('.nav-dropdown').forEach(dd => {
      const t = dd.querySelector('.nav-dropdown-toggle');
      if (!t) return;
      t.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Close other open dropdowns
        document.querySelectorAll('.nav-dropdown.open').forEach(other => {
          if (other !== dd) other.classList.remove('open');
        });
        dd.classList.toggle('open');
      });
    });
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-dropdown.open').forEach(dd => {
        if (!dd.contains(e.target)) dd.classList.remove('open');
      });
    });
  }
};
