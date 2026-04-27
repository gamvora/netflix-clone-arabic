// Unified Genre page logic
// Fetches BOTH movies and TV shows for the selected genre and displays them separately.

const GenrePage = {
  async init() {
    Utils.setupNavbar();
    Utils.setupModals();

    const genreKey = (Utils.getQueryParam('type') || 'action').toLowerCase();
    const genre = (typeof GENRE_MAP !== 'undefined') ? GENRE_MAP[genreKey] : null;

    // If invalid genre key, show a friendly error
    if (!genre) {
      this.renderInvalidGenre(genreKey);
      return;
    }

    // Update page title + breadcrumb
    document.title = `${genre.ar} - Netflix`;
    const titleEl = document.getElementById('genreTitle');
    const iconEl = document.getElementById('genreIcon');
    const subEl = document.getElementById('genreSub');
    if (titleEl) titleEl.textContent = genre.ar;
    if (iconEl) iconEl.className = `fas ${genre.icon || 'fa-film'}`;
    if (subEl) subEl.textContent = `${genre.en} · أفلام ومسلسلات`;

    // Build and render the "pills" (genre chips) navigation bar
    this.renderGenrePills(genreKey);

    // Fetch both movies + TV shows in parallel
    const { movies, tv } = await API.getGenreContent(genreKey, 3);

    // Featured hero: prefer a movie with backdrop, else TV
    const pool = [...movies, ...tv].filter(x => x && x.backdrop_path);
    const featured = pool[Math.floor(Math.random() * Math.min(pool.length, 8))] || movies[0] || tv[0];
    if (featured) this.renderHero(featured, genre);

    // Render movies & tv rows
    const moviesRow = document.getElementById('row-genre-movies');
    const tvRow = document.getElementById('row-genre-tv');
    const moviesSection = document.getElementById('section-genre-movies');
    const tvSection = document.getElementById('section-genre-tv');

    if (movies.length === 0 && moviesSection) {
      moviesSection.style.display = 'none';
    } else if (moviesRow) {
      Utils.renderRow('row-genre-movies', movies);
    }

    if (tv.length === 0 && tvSection) {
      tvSection.style.display = 'none';
    } else if (tvRow) {
      Utils.renderRow('row-genre-tv', tv, { posterStyle: true });
    }

    // Grid view sections - show full results as a grid (like movies.html style)
    this.renderGrid('grid-genre-movies', movies);
    this.renderGrid('grid-genre-tv', tv);

    Utils.setupCarouselScroll();

    // Update counts
    const countMovies = document.getElementById('countMovies');
    const countTV = document.getElementById('countTV');
    if (countMovies) countMovies.textContent = movies.length;
    if (countTV) countTV.textContent = tv.length;
  },

  renderInvalidGenre(key) {
    const container = document.querySelector('.genre-body') || document.body;
    const hero = document.getElementById('pageHero');
    if (hero) hero.style.display = 'none';
    container.innerHTML = `
      <section class="rows-section" style="padding-top: 120px;">
        <div style="text-align: center; padding: 60px 20px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: var(--netflix-red); margin-bottom: 20px;"></i>
          <h1 style="font-size: 32px; margin-bottom: 16px;">نوع غير معروف</h1>
          <p style="color: var(--text-secondary); margin-bottom: 24px;">لم نعثر على النوع "${key}".</p>
          <a href="index.html" class="btn btn-primary"><i class="fas fa-home"></i> العودة للرئيسية</a>
        </div>
      </section>
    `;
  },

  renderHero(item, genre) {
    const hero = document.getElementById('pageHero');
    if (!hero) return;
    const title = Utils.getTitle(item);
    const titleAr = Utils.getTitleAr(item);
    const showArTitle = titleAr && titleAr !== title;
    const isMovie = (item.media_type === 'movie') || !!item.title;
    const mediaType = isMovie ? 'movie' : 'tv';
    const overview = Utils.truncate(Utils.getOverviewSafe(item), 220);

    hero.style.backgroundImage = `
      linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0.4) 100%),
      linear-gradient(to right, rgba(20,20,20,0.8) 0%, transparent 70%),
      url('${Utils.getBackdrop(item.backdrop_path)}')
    `;
    hero.innerHTML = `
      <div class="hero-content">
        <div class="hero-badge"><i class="fas ${genre.icon || 'fa-film'}"></i> <span>${genre.ar}</span></div>
        <h1 class="hero-title">${title}</h1>
        ${showArTitle ? `<div class="hero-ar-title">${titleAr}</div>` : ''}
        <p class="hero-overview">${overview}</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-hero-play" data-id="${item.id}" data-type="${mediaType}"><i class="fas fa-play"></i> تشغيل</button>
          <button class="btn btn-secondary" onclick="Utils.openDetailsModal(${item.id}, '${mediaType}')"><i class="fas fa-info-circle"></i> مزيد من المعلومات</button>
        </div>
      </div>
    `;
    const playBtn = hero.querySelector('.btn-hero-play');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        Utils.showServerPicker({ id: playBtn.dataset.id, type: playBtn.dataset.type });
      });
    }
  },

  renderGenrePills(activeKey) {
    const pills = document.getElementById('genrePills');
    if (!pills) return;
    const order = ['action','comedy','horror','romance','scifi','thriller','animation','documentary','crime','drama','fantasy','adventure','family','mystery','korean','anime','arabic'];
    pills.innerHTML = order.map(key => {
      const g = GENRE_MAP[key];
      if (!g) return '';
      const active = key === activeKey ? 'active' : '';
      return `<a href="genre.html?type=${key}" class="genre-pill ${active}"><i class="fas ${g.icon}"></i> ${g.ar}</a>`;
    }).join('');
  },

  renderGrid(gridId, items) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    if (!items || items.length === 0) {
      grid.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-secondary); grid-column: 1/-1;">لا توجد نتائج لهذا النوع حالياً.</p>';
      return;
    }
    grid.innerHTML = items.map((item, i) => Utils.createPosterCard(item, i)).join('');
    // IMPORTANT: Attach click listeners so cards open the details modal
    Utils.attachCardListeners(grid);
  }
};

document.addEventListener('DOMContentLoaded', () => GenrePage.init());
