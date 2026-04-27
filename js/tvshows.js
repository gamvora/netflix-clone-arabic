// TV Shows page logic

const TVPage = {
  async init() {
    Utils.setupNavbar();
    Utils.setupModals();
    
    const [popular, topRated, onAir, airingToday, netflixOriginals, actionTV, comedyTV, dramaTV, crimeTV, sciFiTV, koreanTV, animeTV, arabicTV, asianTV] = await Promise.all([
      API.getMoviesByCategory('popularTV', 4),
      API.getMoviesByCategory('topRatedTV', 4),
      API.getMoviesByCategory('onAirTV', 4),
      API.getMoviesByCategory('airingTodayTV', 4),
      API.getNetflixOriginals(),
      API.getMoviesByCategory('actionTV', 4),
      API.getMoviesByCategory('comedyTV', 4),
      API.getMoviesByCategory('dramaTV', 4),
      API.getMoviesByCategory('crimeTV', 4),
      API.getMoviesByCategory('sciFiTV', 4),
      API.getMoviesByCategory('koreanTV', 4),
      API.getMoviesByCategory('animeTV', 4),
      API.getMoviesByCategory('arabicTV', 4),
      API.getMoviesByCategory('asianTV', 4)
    ]);

    const rows = API.allocateUniqueRows([
      { key: 'netflixOriginals', items: netflixOriginals },
      { key: 'popular', items: popular },
      { key: 'topRated', items: topRated },
      { key: 'onAir', items: onAir },
      { key: 'airingToday', items: airingToday },
      { key: 'actionTV', items: actionTV },
      { key: 'dramaTV', items: dramaTV },
      { key: 'comedyTV', items: comedyTV },
      { key: 'crimeTV', items: crimeTV },
      { key: 'sciFiTV', items: sciFiTV },
      { key: 'koreanTV', items: koreanTV },
      { key: 'animeTV', items: animeTV },
      { key: 'arabicTV', items: arabicTV },
      { key: 'asianTV', items: asianTV }
    ], 28);
    
    const featured = rows.netflixOriginals?.[0] || rows.popular?.[0];
    if (featured) {
      const hero = document.getElementById('pageHero');
      if (hero) {
        const title = Utils.getTitle(featured);
        const titleAr = Utils.getTitleAr(featured);
        const showArTitle = titleAr && titleAr !== title;
        hero.style.backgroundImage = `
          linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0.4) 100%),
          linear-gradient(to right, rgba(20,20,20,0.8) 0%, transparent 70%),
          url('${Utils.getBackdrop(featured.backdrop_path)}')
        `;
        hero.innerHTML = `
          <div class="hero-content">
            <div class="hero-badge"><span class="n-logo">N</span> <span>مسلسل</span></div>
            <h1 class="hero-title">${title}</h1>
            ${showArTitle ? `<div class="hero-ar-title">${titleAr}</div>` : ''}
            <p class="hero-overview">${Utils.truncate(featured.overview, 200)}</p>
            <div class="hero-actions">
              <button class="btn btn-primary btn-hero-play" data-id="${featured.id}" data-type="tv"><i class="fas fa-play"></i> تشغيل</button>
              <button class="btn btn-secondary" onclick="Utils.openDetailsModal(${featured.id}, 'tv')"><i class="fas fa-info-circle"></i> مزيد من المعلومات</button>
            </div>
          </div>
        `;
        const playBtn = hero.querySelector('.btn-hero-play');
        if (playBtn) {
          playBtn.addEventListener('click', () => {
            Utils.showServerPicker({ id: playBtn.dataset.id, type: playBtn.dataset.type });
          });
        }
      }
    }
    
    Utils.renderRow('row-netflix', rows.netflixOriginals || [], { posterStyle: true });
    Utils.renderRow('row-popular', rows.popular || []);
    Utils.renderRow('row-top-rated', rows.topRated || []);
    Utils.renderRow('row-on-air', rows.onAir || []);
    Utils.renderRow('row-airing-today', rows.airingToday || []);
    Utils.renderRow('row-action', rows.actionTV || []);
    Utils.renderRow('row-drama', rows.dramaTV || []);
    Utils.renderRow('row-comedy', rows.comedyTV || []);
    Utils.renderRow('row-crime', rows.crimeTV || []);
    Utils.renderRow('row-scifi', rows.sciFiTV || []);
    Utils.renderRow('row-korean', rows.koreanTV || []);
    Utils.renderRow('row-anime', rows.animeTV || []);
    Utils.renderRow('row-arabic', rows.arabicTV || []);
    Utils.renderRow('row-asian', rows.asianTV || []);
    
    Utils.setupCarouselScroll();
    
    // Handle ?genre= URL param
    const params = new URLSearchParams(window.location.search);
    const genre = params.get('genre');
    if (genre) {
      const rowMap = {
        netflix: 'row-netflix', popular: 'row-popular', 'top-rated': 'row-top-rated',
        'on-air': 'row-on-air', action: 'row-action', drama: 'row-drama',
        comedy: 'row-comedy', crime: 'row-crime', scifi: 'row-scifi',
        korean: 'row-korean', anime: 'row-anime', arabic: 'row-arabic', asian: 'row-asian'
      };
      const rowId = rowMap[genre.toLowerCase()];
      if (rowId) setTimeout(() => Utils.highlightRow(rowId, true), 500);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => TVPage.init());
