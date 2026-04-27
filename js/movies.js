// Movies page logic

const MoviesPage = {
  async init() {
    Utils.setupNavbar();
    Utils.setupModals();
    
    const [popular, topRated, nowPlaying, upcoming, action, comedy, horror, romance, scifi, animation, thriller, crime, fantasy, adventure, family, arabicMovies, asianMovies] = await Promise.all([
      API.getMoviesByCategory('popularMovies', 4),
      API.getMoviesByCategory('topRatedMovies', 4),
      API.getMoviesByCategory('nowPlayingMovies', 4),
      API.getMoviesByCategory('upcomingMovies', 4),
      API.getMoviesByCategory('actionMovies', 4),
      API.getMoviesByCategory('comedyMovies', 4),
      API.getMoviesByCategory('horrorMovies', 3),
      API.getMoviesByCategory('romanceMovies', 3),
      API.getMoviesByCategory('scienceFictionMovies', 3),
      API.getMoviesByCategory('animationMovies', 3),
      API.getMoviesByCategory('thrillerMovies', 3),
      API.getMoviesByCategory('crimeMovies', 3),
      API.getMoviesByCategory('fantasyMovies', 3),
      API.getMoviesByCategory('adventureMovies', 3),
      API.getMoviesByCategory('familyMovies', 3),
      API.getMoviesByCategory('arabicMovies', 4),
      API.getMoviesByCategory('asianMovies', 4)
    ]);

    const rows = API.allocateUniqueRows([
      { key: 'popular', items: popular },
      { key: 'topRated', items: topRated },
      { key: 'nowPlaying', items: nowPlaying },
      { key: 'upcoming', items: upcoming },
      { key: 'action', items: action },
      { key: 'comedy', items: comedy },
      { key: 'scifi', items: scifi },
      { key: 'horror', items: horror },
      { key: 'romance', items: romance },
      { key: 'animation', items: animation },
      { key: 'thriller', items: thriller },
      { key: 'crime', items: crime },
      { key: 'fantasy', items: fantasy },
      { key: 'adventure', items: adventure },
      { key: 'family', items: family },
      { key: 'arabicMovies', items: arabicMovies },
      { key: 'asianMovies', items: asianMovies }
    ], 28);
    
    // Set featured hero
    const featured = rows.popular?.[0] || rows.nowPlaying?.[0] || rows.topRated?.[0];
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
            <div class="hero-badge"><span class="n-logo">N</span> <span>فيلم</span></div>
            <h1 class="hero-title">${title}</h1>
            ${showArTitle ? `<div class="hero-ar-title">${titleAr}</div>` : ''}
            <p class="hero-overview">${Utils.truncate(featured.overview, 200)}</p>
            <div class="hero-actions">
              <button class="btn btn-primary btn-hero-play" data-id="${featured.id}" data-type="movie"><i class="fas fa-play"></i> تشغيل</button>
              <button class="btn btn-secondary" onclick="Utils.openDetailsModal(${featured.id}, 'movie')"><i class="fas fa-info-circle"></i> مزيد من المعلومات</button>
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
    
    Utils.renderRow('row-popular', rows.popular || []);
    Utils.renderRow('row-top-rated', rows.topRated || []);
    Utils.renderRow('row-now-playing', rows.nowPlaying || []);
    Utils.renderRow('row-upcoming', rows.upcoming || []);
    Utils.renderRow('row-action', rows.action || []);
    Utils.renderRow('row-comedy', rows.comedy || []);
    Utils.renderRow('row-scifi', rows.scifi || []);
    Utils.renderRow('row-horror', rows.horror || []);
    Utils.renderRow('row-romance', rows.romance || []);
    Utils.renderRow('row-animation', rows.animation || []);
    Utils.renderRow('row-thriller', rows.thriller || []);
    Utils.renderRow('row-crime', rows.crime || []);
    Utils.renderRow('row-fantasy', rows.fantasy || []);
    Utils.renderRow('row-adventure', rows.adventure || []);
    Utils.renderRow('row-family', rows.family || []);
    Utils.renderRow('row-arabic', rows.arabicMovies || []);
    Utils.renderRow('row-asian', rows.asianMovies || []);
    
    Utils.setupCarouselScroll();
    
    // Handle ?genre= URL param → scroll to matching row & highlight
    const params = new URLSearchParams(window.location.search);
    const genre = params.get('genre');
    if (genre) {
      const rowMap = {
        action: 'row-action', comedy: 'row-comedy', horror: 'row-horror',
        romance: 'row-romance', scifi: 'row-scifi', animation: 'row-animation',
        thriller: 'row-thriller', crime: 'row-crime', fantasy: 'row-fantasy',
        adventure: 'row-adventure', family: 'row-family', popular: 'row-popular',
        'top-rated': 'row-top-rated', upcoming: 'row-upcoming',
        arabic: 'row-arabic', asian: 'row-asian'
      };
      const rowId = rowMap[genre.toLowerCase()];
      if (rowId) setTimeout(() => Utils.highlightRow(rowId, true), 500);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => MoviesPage.init());
