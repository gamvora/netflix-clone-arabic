// Movies page logic

const MoviesPage = {
  async init() {
    Utils.setupNavbar();
    Utils.setupModals();
    
    const [popular, topRated, nowPlaying, upcoming, action, comedy, horror, romance, scifi, animation, thriller, crime, fantasy, adventure, family] = await Promise.all([
      API.getMoviesByCategory('popularMovies'),
      API.getMoviesByCategory('topRatedMovies'),
      API.getMoviesByCategory('nowPlayingMovies'),
      API.getMoviesByCategory('upcomingMovies'),
      API.getMoviesByCategory('actionMovies'),
      API.getMoviesByCategory('comedyMovies'),
      API.getMoviesByCategory('horrorMovies'),
      API.getMoviesByCategory('romanceMovies'),
      API.getMoviesByCategory('scienceFictionMovies'),
      API.getMoviesByCategory('animationMovies'),
      API.getMoviesByCategory('thrillerMovies'),
      API.getMoviesByCategory('crimeMovies'),
      API.getMoviesByCategory('fantasyMovies'),
      API.getMoviesByCategory('adventureMovies'),
      API.getMoviesByCategory('familyMovies')
    ]);
    
    // Set featured hero
    const featured = popular[0] || nowPlaying[0] || topRated[0];
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
              <a href="watch.html?id=${featured.id}&type=movie" class="btn btn-primary"><i class="fas fa-play"></i> تشغيل</a>
              <button class="btn btn-secondary" onclick="Utils.openDetailsModal(${featured.id}, 'movie')"><i class="fas fa-info-circle"></i> مزيد من المعلومات</button>
            </div>
          </div>
        `;
      }
    }
    
    Utils.renderRow('row-popular', popular);
    Utils.renderRow('row-top-rated', topRated);
    Utils.renderRow('row-now-playing', nowPlaying);
    Utils.renderRow('row-upcoming', upcoming);
    Utils.renderRow('row-action', action);
    Utils.renderRow('row-comedy', comedy);
    Utils.renderRow('row-scifi', scifi);
    Utils.renderRow('row-horror', horror);
    Utils.renderRow('row-romance', romance);
    Utils.renderRow('row-animation', animation);
    Utils.renderRow('row-thriller', thriller);
    Utils.renderRow('row-crime', crime);
    Utils.renderRow('row-fantasy', fantasy);
    Utils.renderRow('row-adventure', adventure);
    Utils.renderRow('row-family', family);
    
    Utils.setupCarouselScroll();
  }
};

document.addEventListener('DOMContentLoaded', () => MoviesPage.init());
