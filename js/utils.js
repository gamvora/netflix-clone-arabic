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

  createCard(item, index = 0) {
    const poster = this.getImage(item.poster_path, 'w500');
    const title = this.getTitle(item);
    const id = item.id, mediaType = this.getMediaType(item);
    const rating = this.getRating(item.vote_average), year = this.getYear(item);
    return `
      <div class="card" data-id="${id}" data-type="${mediaType}" tabindex="0" style="animation-delay: ${index * 0.04}s">
        <div class="card-img-wrap">
          <img src="${poster}" alt="${title}" loading="lazy" onerror="this.src='${CONFIG.DEFAULT_POSTER}'">
          <div class="card-play-hover"><i class="fas fa-play"></i></div>
        </div>
        <div class="card-info">
          <h3>${title}</h3>
          <div class="card-meta">
            <span class="rating"><i class="fas fa-star"></i> ${rating}</span>
            <span class="year">${year}</span>
            <span class="hd-badge">HD</span>
          </div>
          <div class="card-buttons">
            <button class="btn-icon btn-play" title="تشغيل"><i class="fas fa-play"></i></button>
            <button class="btn-icon btn-add" title="أضف لقائمتي"><i class="fas fa-plus"></i></button>
            <button class="btn-icon btn-trailer-card" title="الإعلان الدعائي"><i class="fas fa-film"></i></button>
            <button class="btn-icon btn-info" title="مزيد من المعلومات"><i class="fas fa-chevron-down"></i></button>
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
    const watchUrl = item.type === 'tv' ? `watch.html?id=${item.id}&type=tv&s=${item.season || 1}&e=${item.episode || 1}` : `watch.html?id=${item.id}&type=movie`;
    return `
      <div class="card card-continue" data-id="${item.id}" data-type="${item.type}" tabindex="0" style="animation-delay: ${index * 0.04}s">
        <div class="card-img-wrap continue-img-wrap">
          <img src="${backdrop}" alt="${title}" loading="lazy" onerror="this.src='${CONFIG.DEFAULT_BACKDROP}'">
          <div class="continue-overlay">
            <a href="${watchUrl}" class="continue-play"><i class="fas fa-play-circle"></i></a>
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
        if (e.target.closest('.continue-remove')) {
          e.preventDefault(); e.stopPropagation();
          const btn = e.target.closest('.continue-remove');
          Utils.removeFromContinueWatching(btn.dataset.id, btn.dataset.type);
          Utils.showToast('تمت الإزالة من "متابعة المشاهدة"');
          card.style.transform = 'scale(0)'; card.style.opacity = '0';
          setTimeout(() => card.remove(), 300); return;
        }
        if (card.classList.contains('card-continue')) {
          if (!e.target.closest('a')) {
            const link = card.querySelector('.continue-play');
            if (link) window.location.href = link.href;
          }
          return;
        }
        if (e.target.closest('.btn-play') || e.target.closest('.card-play-hover')) {
          window.location.href = `watch.html?id=${id}&type=${type}`;
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

  getMyList() { try { return JSON.parse(localStorage.getItem('netflixMyList') || '[]'); } catch { return []; } },
  addToMyList(item) {
    const list = this.getMyList();
    if (!list.find(x => x.id == item.id && x.type == item.type)) {
      list.push(item); localStorage.setItem('netflixMyList', JSON.stringify(list)); return true;
    } return false;
  },
  removeFromMyList(id, type) {
    const list = this.getMyList().filter(x => !(x.id == id && x.type == type));
    localStorage.setItem('netflixMyList', JSON.stringify(list));
  },
  toggleMyList(id, type) {
    if (this.isInMyList(id, type)) { this.removeFromMyList(id, type); return false; }
    this.addToMyList({ id, type, addedAt: Date.now() }); return true;
  },
  isInMyList(id, type) { return !!this.getMyList().find(x => x.id == id && x.type == type); },

  getContinueWatching() {
    try { return JSON.parse(localStorage.getItem('netflixContinue') || '[]').sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); }
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
      localStorage.setItem('netflixContinue', JSON.stringify(list));
    } catch (e) {}
  },
  removeFromContinueWatching(id, type) {
    try {
      const list = this.getContinueWatching().filter(x => !(x.id == id && x.type == type));
      localStorage.setItem('netflixContinue', JSON.stringify(list));
    } catch {}
  },
  clearContinueWatching() { localStorage.setItem('netflixContinue', '[]'); },

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

  async openDetailsModal(id, type) {
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

    body.innerHTML = `
      <div class="modal-hero" style="background-image: linear-gradient(to top, #181818 5%, transparent 60%), url('${backdrop}')">
        <div class="modal-hero-content">
          <h1>${title}</h1>
          ${showArTitle ? `<div class="modal-ar-title">${titleAr}</div>` : ''}
          <div class="modal-actions">
            <a href="watch.html?id=${id}&type=${type}" class="btn btn-primary"><i class="fas fa-play"></i> تشغيل</a>
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
      ${similar.length ? `
        <div class="modal-similar">
          <h3>محتوى مشابه</h3>
          <div class="modal-similar-grid">
            ${similar.map(s => {
              const sType = this.getMediaType(s);
              const simTitle = this.getTitle(s);
              return `
                <a href="watch.html?id=${s.id}&type=${sType}" class="sim-card">
                  <img src="${this.getBackdrop(s.backdrop_path || s.poster_path)}" alt="${simTitle}" loading="lazy">
                  <div class="sim-play"><i class="fas fa-play"></i></div>
                  <div class="sim-overlay">
                    <div class="sim-info">
                      <h4>${simTitle}</h4>
                      <span>${Math.round((s.vote_average || 0) * 10)}% • ${this.getYear(s)}</span>
                    </div>
                  </div>
                </a>`;
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
      toggle.addEventListener('click', () => links.classList.toggle('open'));
    }
    // Dropdown click handler for mobile/TV
    document.querySelectorAll('.nav-dropdown').forEach(dd => {
      const t = dd.querySelector('.nav-dropdown-toggle');
      if (!t) return;
      t.addEventListener('click', (e) => {
        e.preventDefault();
        dd.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!dd.contains(e.target)) dd.classList.remove('open');
      });
    });
  }
};
