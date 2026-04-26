// Utility functions used across the site

const Utils = {
  
  // Truncate long text
  truncate(str, n) {
    if (!str) return '';
    return str.length > n ? str.substr(0, n - 1) + '...' : str;
  },

  // Get image URL with fallback
  getImage(path, size = 'original') {
    if (!path) return CONFIG.DEFAULT_POSTER;
    const base = size === 'w500' ? CONFIG.IMG_URL_W500 : 
                 size === 'w300' ? CONFIG.IMG_URL_W300 : 
                 CONFIG.IMG_URL;
    return `${base}${path}`;
  },

  // Get backdrop image with fallback
  getBackdrop(path) {
    if (!path) return CONFIG.DEFAULT_BACKDROP;
    return `${CONFIG.IMG_URL}${path}`;
  },

  // Get title - PREFER ORIGINAL ENGLISH TITLE
  getTitle(item) {
    return item.original_title || item.original_name || item.title || item.name || 'Unknown';
  },

  // Get Arabic title (translated)
  getTitleAr(item) {
    return item.title || item.name || item.original_title || item.original_name || '';
  },

  // Get release year
  getYear(item) {
    const date = item.release_date || item.first_air_date;
    if (!date) return '';
    return new Date(date).getFullYear();
  },

  // Get rating out of 5
  getRating(vote) {
    if (!vote) return 'N/A';
    return (vote / 2).toFixed(1);
  },

  // Format runtime
  formatRuntime(mins) {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  },

  // Get media type
  getMediaType(item) {
    return item.media_type || (item.first_air_date ? 'tv' : 'movie');
  },

  // Create movie card HTML
  createCard(item, index = 0) {
    const poster = this.getImage(item.poster_path, 'w500');
    const title = this.getTitle(item);
    const id = item.id;
    const mediaType = this.getMediaType(item);
    const rating = this.getRating(item.vote_average);
    const year = this.getYear(item);
    
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
            <button class="btn-icon btn-info" title="مزيد من المعلومات"><i class="fas fa-info"></i></button>
          </div>
        </div>
      </div>
    `;
  },

  // Large poster style card
  createPosterCard(item, index = 0) {
    const poster = this.getImage(item.poster_path, 'w500');
    const title = this.getTitle(item);
    const id = item.id;
    const mediaType = this.getMediaType(item);
    
    return `
      <div class="card card-poster" data-id="${id}" data-type="${mediaType}" tabindex="0" style="animation-delay: ${index * 0.04}s">
        <img src="${poster}" alt="${title}" loading="lazy" onerror="this.src='${CONFIG.DEFAULT_POSTER}'">
      </div>
    `;
  },

  // Continue Watching card (special: uses backdrop + progress bar)
  createContinueCard(item, index = 0) {
    const backdrop = this.getBackdrop(item.backdrop_path);
    const title = item.title || 'Unknown';
    const progress = Math.min(100, Math.max(2, item.progress || 0));
    const subtitle = item.type === 'tv' && item.season ? 
      `S${item.season} • E${item.episode || 1}` : 
      (item.year || '');
    const watchUrl = item.type === 'tv' ? 
      `watch.html?id=${item.id}&type=tv&s=${item.season || 1}&e=${item.episode || 1}` :
      `watch.html?id=${item.id}&type=movie`;
    
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
          <div class="card-meta">
            ${subtitle ? `<span>${subtitle}</span>` : ''}
            <span class="resume-text">استئناف <i class="fas fa-redo-alt"></i></span>
          </div>
        </div>
      </div>
    `;
  },

  // Render a row of cards
  renderRow(containerId, items, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!items || items.length === 0) {
      // Hide the whole row if empty
      const row = container.closest('.row');
      if (row) row.style.display = 'none';
      return;
    }
    
    const row = container.closest('.row');
    if (row) row.style.display = '';
    
    let cardFn = 'createCard';
    if (options.posterStyle) cardFn = 'createPosterCard';
    if (options.continueStyle) cardFn = 'createContinueCard';
    
    const filtered = options.continueStyle ? items : items.filter(item => item.poster_path || item.backdrop_path);
    
    container.innerHTML = filtered
      .map((item, i) => this[cardFn](item, i))
      .join('');
    
    this.attachCardListeners(container);
  },

  // Attach click listeners to cards
  attachCardListeners(container) {
    container.querySelectorAll('.card').forEach(card => {
      const id = card.dataset.id;
      const type = card.dataset.type;
      
      card.addEventListener('click', (e) => {
        // Handle continue-watching remove button
        if (e.target.closest('.continue-remove')) {
          e.preventDefault();
          e.stopPropagation();
          const btn = e.target.closest('.continue-remove');
          Utils.removeFromContinueWatching(btn.dataset.id, btn.dataset.type);
          Utils.showToast('تمت الإزالة من "متابعة المشاهدة"');
          // Remove card from UI
          card.style.transform = 'scale(0)';
          card.style.opacity = '0';
          setTimeout(() => card.remove(), 300);
          return;
        }
        // Continue card click -> go watch
        if (card.classList.contains('card-continue')) {
          if (e.target.closest('.continue-play') || !e.target.closest('.continue-remove')) {
            // Let the link handle it, or go manually
            if (!e.target.closest('a')) {
              const link = card.querySelector('.continue-play');
              if (link) window.location.href = link.href;
            }
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
        } else if (e.target.closest('.btn-info')) {
          this.openDetailsModal(id, type);
        } else {
          this.openDetailsModal(id, type);
        }
      });

      // Keyboard support (TV remote)
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          card.click();
        }
      });
    });
  },

  // Horizontal scroll controls
  setupCarouselScroll() {
    document.querySelectorAll('.row').forEach(row => {
      const content = row.querySelector('.row-content');
      const leftBtn = row.querySelector('.scroll-left');
      const rightBtn = row.querySelector('.scroll-right');
      
      if (!content) return;
      
      if (leftBtn) {
        leftBtn.addEventListener('click', () => {
          content.scrollBy({ left: -content.offsetWidth * 0.85, behavior: 'smooth' });
        });
      }
      if (rightBtn) {
        rightBtn.addEventListener('click', () => {
          content.scrollBy({ left: content.offsetWidth * 0.85, behavior: 'smooth' });
        });
      }
    });
  },

  // ============== MY LIST (localStorage) ==============
  getMyList() {
    try {
      return JSON.parse(localStorage.getItem('netflixMyList') || '[]');
    } catch {
      return [];
    }
  },

  addToMyList(item) {
    const list = this.getMyList();
    if (!list.find(x => x.id == item.id && x.type == item.type)) {
      list.push(item);
      localStorage.setItem('netflixMyList', JSON.stringify(list));
      return true;
    }
    return false;
  },

  removeFromMyList(id, type) {
    let list = this.getMyList();
    list = list.filter(x => !(x.id == id && x.type == type));
    localStorage.setItem('netflixMyList', JSON.stringify(list));
  },

  toggleMyList(id, type) {
    const list = this.getMyList();
    const existing = list.find(x => x.id == id && x.type == type);
    if (existing) {
      this.removeFromMyList(id, type);
      return false;
    } else {
      this.addToMyList({ id, type, addedAt: Date.now() });
      return true;
    }
  },

  isInMyList(id, type) {
    return !!this.getMyList().find(x => x.id == id && x.type == type);
  },

  // ============== CONTINUE WATCHING ==============
  getContinueWatching() {
    try {
      const list = JSON.parse(localStorage.getItem('netflixContinue') || '[]');
      // Sort by most recent, newest first
      return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch {
      return [];
    }
  },

  saveContinueWatching(data) {
    // data: {id, type, title, backdrop, season, episode, progress (0-100), updatedAt}
    try {
      let list = this.getContinueWatching();
      const existing = list.findIndex(x => x.id == data.id && x.type == data.type);
      const entry = {
        id: data.id,
        type: data.type,
        title: data.title || 'Unknown',
        backdrop_path: data.backdrop_path || '',
        year: data.year || '',
        season: data.season || null,
        episode: data.episode || null,
        progress: Math.min(100, Math.max(0, data.progress || 0)),
        updatedAt: Date.now()
      };
      if (existing >= 0) {
        list[existing] = entry;
      } else {
        list.push(entry);
      }
      // Keep only last 20
      list = list.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);
      localStorage.setItem('netflixContinue', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save continue watching', e);
    }
  },

  removeFromContinueWatching(id, type) {
    try {
      let list = this.getContinueWatching();
      list = list.filter(x => !(x.id == id && x.type == type));
      localStorage.setItem('netflixContinue', JSON.stringify(list));
    } catch {}
  },

  clearContinueWatching() {
    localStorage.setItem('netflixContinue', '[]');
  },

  // ============== TOAST ==============
  showToast(message, duration = 2500) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  },

  // ============== DETAILS MODAL ==============
  async openDetailsModal(id, type) {
    const modal = document.getElementById('detailsModal');
    if (!modal) return;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const body = modal.querySelector('.modal-body');
    body.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i></div>';
    
    let details;
    if (type === 'tv') {
      details = await API.getTVDetails(id);
    } else {
      details = await API.getMovieDetails(id);
    }
    
    if (!details || !details.id) {
      body.innerHTML = '<p style="padding: 40px; text-align: center;">لا يمكن تحميل التفاصيل</p>';
      return;
    }
    
    const title = this.getTitle(details);
    const titleAr = this.getTitleAr(details);
    const showArTitle = titleAr && titleAr !== title;
    const backdrop = this.getBackdrop(details.backdrop_path);
    const genres = (details.genres || []).map(g => g.name).join(' • ');
    const runtime = details.runtime ? this.formatRuntime(details.runtime) : 
                    details.episode_run_time && details.episode_run_time[0] ? this.formatRuntime(details.episode_run_time[0]) : '';
    const cast = (details.credits && details.credits.cast || []).slice(0, 5).map(c => c.name).join(', ');
    const trailer = (details.videos && details.videos.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
                    (details.videos && details.videos.results || []).find(v => v.site === 'YouTube');
    const inList = this.isInMyList(id, type);
    const similar = (details.similar && details.similar.results || []).slice(0, 8);
    
    body.innerHTML = `
      <div class="modal-hero" style="background-image: linear-gradient(to top, #181818 5%, transparent 60%), url('${backdrop}')">
        <div class="modal-hero-content">
          <h1>${title}</h1>
          ${showArTitle ? `<div class="modal-ar-title">${titleAr}</div>` : ''}
          <div class="modal-actions">
            <a href="watch.html?id=${id}&type=${type}" class="btn btn-primary">
              <i class="fas fa-play"></i> تشغيل
            </a>
            <button class="btn-circle btn-toggle-list" data-id="${id}" data-type="${type}" title="${inList ? 'إزالة من قائمتي' : 'أضف لقائمتي'}">
              <i class="fas ${inList ? 'fa-check' : 'fa-plus'}"></i>
            </button>
            ${trailer ? `<button class="btn-circle btn-trailer" data-key="${trailer.key}" title="مشاهدة الإعلان"><i class="fas fa-film"></i></button>` : ''}
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
          <p class="modal-overview">${details.overview || 'لا يوجد وصف متاح لهذا العنوان.'}</p>
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
                <div class="sim-overlay">
                  <div class="sim-play"><i class="fas fa-play"></i></div>
                  <div class="sim-info">
                    <h4>${simTitle}</h4>
                    <span>${Math.round((s.vote_average || 0) * 10)}% مطابقة • ${this.getYear(s)}</span>
                  </div>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      </div>` : ''}
    `;
    
    const toggleBtn = body.querySelector('.btn-toggle-list');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const added = this.toggleMyList(id, type);
        const icon = toggleBtn.querySelector('i');
        if (added) {
          icon.className = 'fas fa-check';
          this.showToast('تمت الإضافة إلى قائمتي');
        } else {
          icon.className = 'fas fa-plus';
          this.showToast('تمت الإزالة من قائمتي');
        }
      });
    }
    
    const trailerBtn = body.querySelector('.btn-trailer');
    if (trailerBtn) {
      trailerBtn.addEventListener('click', () => {
        const key = trailerBtn.dataset.key;
        this.openTrailerModal(key);
      });
    }
  },

  openTrailerModal(youtubeKey) {
    const modal = document.getElementById('trailerModal');
    if (!modal) return;
    const iframe = modal.querySelector('iframe');
    iframe.src = `https://www.youtube.com/embed/${youtubeKey}?autoplay=1&modestbranding=1&rel=0`;
    modal.classList.add('active');
  },

  closeTrailerModal() {
    const modal = document.getElementById('trailerModal');
    if (!modal) return;
    const iframe = modal.querySelector('iframe');
    iframe.src = '';
    modal.classList.remove('active');
  },

  closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  setupModals() {
    const detailsModal = document.getElementById('detailsModal');
    const trailerModal = document.getElementById('trailerModal');
    
    if (detailsModal) {
      detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal || e.target.closest('.modal-close')) {
          this.closeDetailsModal();
        }
      });
    }
    
    if (trailerModal) {
      trailerModal.addEventListener('click', (e) => {
        if (e.target === trailerModal || e.target.closest('.modal-close')) {
          this.closeTrailerModal();
        }
      });
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDetailsModal();
        this.closeTrailerModal();
      }
    });
  },

  setupNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
    
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
      });
    }
  },

  getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
};
