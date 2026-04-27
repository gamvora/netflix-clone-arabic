// Homepage logic - Hero banner + Continue Watching + content rows

const Main = {
  
  heroItems: [],
  currentHeroIndex: 0,
  heroInterval: null,

  async init() {
    Utils.setupNavbar();
    Utils.setupModals();
    
    this.showLoader();
    
    // Render Continue Watching first (instant from localStorage)
    this.renderContinueWatching();
    
    // Fetch all data in parallel
    const data = await API.getHomepageData();
    
    this.hideLoader();
    
    // Setup hero from trending - prefer items with Arabic overview + backdrop
    const candidates = data.trending.filter(item => item.backdrop_path);
    const withArabic = candidates.filter(item => item.overview && item.overview.trim().length > 80);
    this.heroItems = (withArabic.length >= 3 ? withArabic : candidates).slice(0, 6);
    if (this.heroItems.length > 0) {
      this.renderHero(this.heroItems[0]);
      this.startHeroRotation();
    }
    
    // Render rows
    Utils.renderRow('row-trending', data.trending);
    Utils.renderRow('row-trending-day', data.trendingDay);
    Utils.renderRow('row-netflix', data.netflixOriginals, { posterStyle: true });
    Utils.renderRow('row-top-rated', data.topRatedMovies);
    Utils.renderRow('row-now-playing', data.nowPlayingMovies);
    Utils.renderRow('row-upcoming', data.upcomingMovies);
    Utils.renderRow('row-action', data.actionMovies);
    Utils.renderRow('row-comedy', data.comedyMovies);
    Utils.renderRow('row-scifi', data.scienceFictionMovies);
    Utils.renderRow('row-horror', data.horrorMovies);
    Utils.renderRow('row-romance', data.romanceMovies);
    Utils.renderRow('row-tv', data.popularTV);
    Utils.renderRow('row-arabic-movies', data.arabicMovies);
    Utils.renderRow('row-arabic-tv', data.arabicTV);
    Utils.renderRow('row-asian-movies', data.asianMovies);
    Utils.renderRow('row-asian-tv', data.asianTV);
    Utils.renderRow('row-korean', data.koreanTV);
    Utils.renderRow('row-anime', data.animeTV);
    Utils.renderRow('row-animation', data.animationMovies);
    Utils.renderRow('row-docs', data.documentaries);
    
    Utils.setupCarouselScroll();
    this.setupScrollReveal();
  },

  renderContinueWatching() {
    const list = Utils.getContinueWatching();
    const row = document.getElementById('row-continue-parent');
    if (!row) return;
    if (list.length === 0) {
      row.style.display = 'none';
      return;
    }
    row.style.display = '';
    Utils.renderRow('row-continue', list, { continueStyle: true });
  },

  showLoader() {
    const loader = document.getElementById('mainLoader');
    if (loader) loader.style.display = 'flex';
  },

  hideLoader() {
    const loader = document.getElementById('mainLoader');
    if (loader) setTimeout(() => loader.style.display = 'none', 300);
  },

  renderHero(item) {
    const hero = document.getElementById('hero');
    if (!hero || !item) return;
    
    const title = Utils.getTitle(item);
    const titleAr = Utils.getTitleAr(item);
    const showArTitle = titleAr && titleAr !== title;
    const backdrop = Utils.getBackdrop(item.backdrop_path);
    const overview = Utils.truncate(item.overview, 220);
    const id = item.id;
    const type = Utils.getMediaType(item);
    const rating = Utils.getRating(item.vote_average);
    const year = Utils.getYear(item);
    const typeLabel = type === 'tv' ? 'مسلسل' : 'فيلم';
    
    hero.style.backgroundImage = `
      linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0.5) 40%, rgba(20,20,20,0.2) 100%),
      linear-gradient(to right, rgba(20,20,20,0.85) 0%, rgba(20,20,20,0.3) 60%, transparent 100%),
      url('${backdrop}')
    `;
    
    hero.innerHTML = `
      <div class="hero-content">
        <div class="hero-badge">
          <span class="n-logo">N</span> <span>${typeLabel}</span>
        </div>
        <h1 class="hero-title">${title}</h1>
        ${showArTitle ? `<div class="hero-ar-title">${titleAr}</div>` : ''}
        <div class="hero-meta">
          <span class="match-score">${Math.round((item.vote_average || 0) * 10)}% مطابقة</span>
          <span>${year}</span>
          <span class="rating"><i class="fas fa-star"></i> ${rating}</span>
          <span class="hd-badge">HD</span>
        </div>
        <p class="hero-overview">${overview || 'لا يوجد وصف متاح'}</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-hero-play" data-id="${id}" data-type="${type}">
            <i class="fas fa-play"></i> تشغيل
          </button>
          <button class="btn btn-secondary" onclick="Utils.openDetailsModal(${id}, '${type}')">
            <i class="fas fa-info-circle"></i> مزيد من المعلومات
          </button>
        </div>
      </div>
      <div class="hero-indicators">
        ${this.heroItems.map((_, i) => `<span class="indicator ${i === this.currentHeroIndex ? 'active' : ''}" data-index="${i}"></span>`).join('')}
      </div>
    `;
    
    hero.querySelectorAll('.indicator').forEach(ind => {
      ind.addEventListener('click', () => {
        const idx = parseInt(ind.dataset.index);
        this.currentHeroIndex = idx;
        this.renderHero(this.heroItems[idx]);
        this.restartHeroRotation();
      });
    });

    const playBtn = hero.querySelector('.btn-hero-play');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        Utils.showServerPicker({
          id: playBtn.dataset.id,
          type: playBtn.dataset.type
        });
      });
    }
  },

  startHeroRotation() {
    this.heroInterval = setInterval(() => {
      this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroItems.length;
      this.renderHero(this.heroItems[this.currentHeroIndex]);
    }, 9000);
  },

  restartHeroRotation() {
    clearInterval(this.heroInterval);
    this.startHeroRotation();
  },

  setupScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.row').forEach(row => observer.observe(row));
  }
};

document.addEventListener('DOMContentLoaded', () => Main.init());
