// TV Shows page logic

const TVPage = {
  async init() {
    Utils.setupNavbar();
    Utils.setupModals();
    
    const [popular, topRated, onAir, airingToday, netflixOriginals, actionTV, comedyTV, dramaTV, crimeTV, sciFiTV, koreanTV, animeTV, arabicTV] = await Promise.all([
      API.getMoviesByCategory('popularTV'),
      API.getMoviesByCategory('topRatedTV'),
      API.getMoviesByCategory('onAirTV'),
      API.getMoviesByCategory('airingTodayTV'),
      API.getNetflixOriginals(),
      API.getMoviesByCategory('actionTV'),
      API.getMoviesByCategory('comedyTV'),
      API.getMoviesByCategory('dramaTV'),
      API.getMoviesByCategory('crimeTV'),
      API.getMoviesByCategory('sciFiTV'),
      API.getMoviesByCategory('koreanTV'),
      API.getMoviesByCategory('animeTV'),
      API.getMoviesByCategory('arabicTV')
    ]);
    
    const featured = netflixOriginals[0] || popular[0];
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
    
    Utils.renderRow('row-netflix', netflixOriginals, { posterStyle: true });
    Utils.renderRow('row-popular', popular);
    Utils.renderRow('row-top-rated', topRated);
    Utils.renderRow('row-on-air', onAir);
    Utils.renderRow('row-airing-today', airingToday);
    Utils.renderRow('row-action', actionTV);
    Utils.renderRow('row-drama', dramaTV);
    Utils.renderRow('row-comedy', comedyTV);
    Utils.renderRow('row-crime', crimeTV);
    Utils.renderRow('row-scifi', sciFiTV);
    Utils.renderRow('row-korean', koreanTV);
    Utils.renderRow('row-anime', animeTV);
    Utils.renderRow('row-arabic', arabicTV);
    
    Utils.setupCarouselScroll();
    
    // Handle ?genre= URL param
    const params = new URLSearchParams(window.location.search);
    const genre = params.get('genre');
    if (genre) {
      const rowMap = {
        netflix: 'row-netflix', popular: 'row-popular', 'top-rated': 'row-top-rated',
        'on-air': 'row-on-air', action: 'row-action', drama: 'row-drama',
        comedy: 'row-comedy', crime: 'row-crime', scifi: 'row-scifi',
        korean: 'row-korean', anime: 'row-anime', arabic: 'row-arabic'
      };
      const rowId = rowMap[genre.toLowerCase()];
      if (rowId) setTimeout(() => Utils.highlightRow(rowId, true), 500);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => TVPage.init());
