// API Service - Handles all TMDB API calls
// Strategy: Fetch English (for titles) + Arabic (for overviews) in parallel, merge overviews
// SAFETY: Every response is filtered through isSafeContent() to block adult/porn/hentai content.
const API = {
  
  // Generic fetch function
  async fetchData(endpoint) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      // Apply safety filter to results array if present
      if (data && Array.isArray(data.results)) {
        data.results = data.results.filter(item => isSafeContent(item));
      }
      return data;
    } catch (error) {
      console.error('API Error:', error, endpoint);
      return { results: [] };
    }
  },

  // Apply safety filter to a raw array of items
  filterSafe(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => isSafeContent(item));
  },

  // Fetch a list endpoint in BOTH English and Arabic, merge overviews
  // English is primary (for titles), Arabic supplements with overview_ar
  async fetchBilingual(endpoint, pages = 2) {
    // Build English + Arabic variants
    const makeUrl = (lang) => {
      // Replace language= param with the desired language
      return endpoint.replace(/language=[^&]+/, `language=${lang}`);
    };
    
    const enEndpoint = makeUrl(CONFIG.LANGUAGE);           // en-US
    const arEndpoint = makeUrl(CONFIG.LANGUAGE_FALLBACK);  // ar
    
    const fetchPages = async (ep) => {
      const promises = [];
      for (let p = 1; p <= pages; p++) {
        const sep = ep.includes('?') ? '&' : '?';
        promises.push(this.fetchData(`${ep}${sep}page=${p}`));
      }
      const results = await Promise.all(promises);
      const all = [];
      results.forEach(r => { if (r && r.results) all.push(...r.results); });
      return all;
    };
    
    let [enAll, arAll] = await Promise.all([
      fetchPages(enEndpoint),
      fetchPages(arEndpoint)
    ]);
    // Double safety: filter again after merging (fetchData already filters, but be defensive)
    enAll = this.filterSafe(enAll);
    arAll = this.filterSafe(arAll);
    
    // Build Arabic overview lookup by id
    const arMap = new Map();
    arAll.forEach(item => {
      if (item && item.id) arMap.set(item.id, item);
    });
    
    // Merge Arabic overview into English items + deduplicate
    const seen = new Set();
    const merged = [];
    enAll.forEach(item => {
      if (!item || !item.id) return;
      const key = `${item.id}_${item.media_type || 'x'}`;
      if (seen.has(key)) return;
      seen.add(key);
      
      const arItem = arMap.get(item.id);
      if (arItem) {
        if (arItem.overview && arItem.overview.trim()) {
          item.overview_ar = arItem.overview;
        }
      }
      merged.push(item);
    });
    
    return merged;
  },

  // Legacy single-language fetch (kept for compatibility)
  async fetchMultiPage(endpoint, pages = 1) {
    return this.fetchBilingual(endpoint, pages);
  },

  // Get trending
  async getTrending() {
    return this.fetchBilingual(ENDPOINTS.trending, 2);
  },

  async getTrendingDay() {
    return this.fetchBilingual(ENDPOINTS.trendingDay, 1);
  },

  // Netflix Originals
  async getNetflixOriginals() {
    return this.fetchBilingual(ENDPOINTS.netflixOriginals, 2);
  },

  // Get content by category
  async getMoviesByCategory(category, pages = 2) {
    if (!ENDPOINTS[category]) return [];
    return this.fetchBilingual(ENDPOINTS[category], pages);
  },

  // Remove duplicates across multiple rows globally
  // Input: [{ key: 'trending', items: [...] }, ...]
  // Output: { trending: [...], topRatedMovies: [...], ... } with no repeated media across rows
  allocateUniqueRows(rowDefs, perRowLimit = 28) {
    const seen = new Set();
    const out = {};

    rowDefs.forEach(def => {
      const key = def.key;
      const items = Array.isArray(def.items) ? def.items : [];
      const unique = [];

      for (const item of items) {
        if (!item || !item.id) continue;
        const media = item.media_type || (item.title ? 'movie' : 'tv');
        const uid = `${media}_${item.id}`;
        if (seen.has(uid)) continue;
        seen.add(uid);
        unique.push(item);
        if (unique.length >= perRowLimit) break;
      }

      out[key] = unique;
    });

    return out;
  },

  // Fetch both movies + TV shows for a given genre key (used by genre.html)
  async getGenreContent(genreKey, pages = 3) {
    const genre = (typeof GENRE_MAP !== 'undefined') ? GENRE_MAP[genreKey] : null;
    if (!genre) return { movies: [], tv: [], genre: null };
    const movieUrl = buildGenreUrl(genreKey, 'movie');
    const tvUrl = buildGenreUrl(genreKey, 'tv');
    let [movies, tv] = await Promise.all([
      movieUrl ? this.fetchBilingual(movieUrl, pages) : Promise.resolve([]),
      tvUrl ? this.fetchBilingual(tvUrl, pages) : Promise.resolve([])
    ]);
    // Triple-check safety filter on final arrays
    movies = this.filterSafe(movies);
    tv = this.filterSafe(tv);
    // Ensure media_type is correctly set (discover endpoints don't always return it)
    movies.forEach(m => { if (!m.media_type) m.media_type = 'movie'; });
    tv.forEach(t => { if (!t.media_type) t.media_type = 'tv'; });
    return { movies, tv, genre };
  },

  // Movie details - English primary, Arabic overview supplement
  async getMovieDetails(id) {
    const enData = await this.fetchData(`${ENDPOINTS.movieDetails(id)}&language=${CONFIG.LANGUAGE}`);
    if (!enData || !enData.id) return enData;
    try {
      const arData = await this.fetchData(`${ENDPOINTS.movieDetails(id)}&language=${CONFIG.LANGUAGE_FALLBACK}`);
      if (arData && arData.overview && arData.overview.trim() !== '') {
        enData.overview_ar = arData.overview;
        enData.title_ar = arData.title && arData.title !== enData.title ? arData.title : '';
      }
      // Merge similar/recommendations overviews too
      if (arData && arData.similar && arData.similar.results && enData.similar && enData.similar.results) {
        const arSimMap = new Map(arData.similar.results.map(s => [s.id, s]));
        enData.similar.results.forEach(s => {
          const arS = arSimMap.get(s.id);
          if (arS && arS.overview) s.overview_ar = arS.overview;
        });
      }
    } catch (e) {}
    return enData;
  },

  // TV details - English primary, Arabic supplement
  async getTVDetails(id) {
    const enData = await this.fetchData(`${ENDPOINTS.tvDetails(id)}&language=${CONFIG.LANGUAGE}`);
    if (!enData || !enData.id) return enData;
    try {
      const arData = await this.fetchData(`${ENDPOINTS.tvDetails(id)}&language=${CONFIG.LANGUAGE_FALLBACK}`);
      if (arData && arData.overview && arData.overview.trim() !== '') {
        enData.overview_ar = arData.overview;
        enData.name_ar = arData.name && arData.name !== enData.name ? arData.name : '';
      }
      if (arData && arData.similar && arData.similar.results && enData.similar && enData.similar.results) {
        const arSimMap = new Map(arData.similar.results.map(s => [s.id, s]));
        enData.similar.results.forEach(s => {
          const arS = arSimMap.get(s.id);
          if (arS && arS.overview) s.overview_ar = arS.overview;
        });
      }
    } catch (e) {}
    return enData;
  },

  // Season details - English primary with Arabic episode descriptions
  async getSeasonDetails(tvId, seasonNumber) {
    const en = await this.fetchData(`/tv/${tvId}/season/${seasonNumber}?api_key=${CONFIG.API_KEY}&language=${CONFIG.LANGUAGE}`);
    if (!en || !en.episodes) return en;
    try {
      const ar = await this.fetchData(`/tv/${tvId}/season/${seasonNumber}?api_key=${CONFIG.API_KEY}&language=${CONFIG.LANGUAGE_FALLBACK}`);
      if (ar && ar.episodes) {
        en.episodes = en.episodes.map(ep => {
          const arEp = ar.episodes.find(e => e.episode_number === ep.episode_number);
          if (arEp && arEp.overview && arEp.overview.trim()) {
            ep.overview_ar = arEp.overview;
          }
          return ep;
        });
      }
    } catch (e) {}
    return en;
  },

  // Search - in English primarily, user can type Arabic and we'll also search Arabic
  async search(query) {
    if (!query || query.trim() === '') return [];
    
    const enUrl = `/search/multi?api_key=${CONFIG.API_KEY}&language=${CONFIG.LANGUAGE}&query=${encodeURIComponent(query)}&include_adult=false`;
    const arUrl = `/search/multi?api_key=${CONFIG.API_KEY}&language=${CONFIG.LANGUAGE_FALLBACK}&query=${encodeURIComponent(query)}&include_adult=false`;
    
    const [en, ar] = await Promise.all([this.fetchData(enUrl), this.fetchData(arUrl)]);
    const enResults = (en.results || []).filter(item => 
      item.media_type !== 'person' && (item.poster_path || item.backdrop_path) && isSafeContent(item)
    );
    const arResults = (ar.results || []).filter(item => 
      item.media_type !== 'person' && (item.poster_path || item.backdrop_path) && isSafeContent(item)
    );
    
    // Merge: English primary, add Arabic-only results + overview_ar
    const arMap = new Map(arResults.map(r => [r.id, r]));
    const seen = new Set();
    const merged = [];
    
    enResults.forEach(item => {
      const key = `${item.id}_${item.media_type}`;
      seen.add(key);
      const arItem = arMap.get(item.id);
      if (arItem && arItem.overview) item.overview_ar = arItem.overview;
      merged.push(item);
    });
    
    // Add Arabic-only results that weren't in English results
    arResults.forEach(item => {
      const key = `${item.id}_${item.media_type}`;
      if (!seen.has(key)) {
        merged.push(item);
        seen.add(key);
      }
    });
    
    return merged;
  },

  // Get homepage data in one go
  async getHomepageData() {
    const [
      trending, 
      trendingDay,
      netflixOriginals, 
      topRatedMovies, 
      actionMovies,
      comedyMovies,
      horrorMovies,
      romanceMovies,
      documentaries,
      popularTV,
      scienceFictionMovies,
      animationMovies,
      koreanTV,
      animeTV,
      arabicMovies,
      arabicTV,
      asianMovies,
      asianTV,
      upcomingMovies,
      nowPlayingMovies
    ] = await Promise.all([
      this.getTrending(),
      this.getTrendingDay(),
      this.getNetflixOriginals(),
      this.getMoviesByCategory('topRatedMovies', 4),
      this.getMoviesByCategory('actionMovies', 4),
      this.getMoviesByCategory('comedyMovies', 4),
      this.getMoviesByCategory('horrorMovies', 3),
      this.getMoviesByCategory('romanceMovies', 3),
      this.getMoviesByCategory('documentaries', 3),
      this.getMoviesByCategory('popularTV', 4),
      this.getMoviesByCategory('scienceFictionMovies', 3),
      this.getMoviesByCategory('animationMovies', 3),
      this.getMoviesByCategory('koreanTV', 4),
      this.getMoviesByCategory('animeTV', 4),
      this.getMoviesByCategory('arabicMovies', 4),
      this.getMoviesByCategory('arabicTV', 4),
      this.getMoviesByCategory('asianMovies', 4),
      this.getMoviesByCategory('asianTV', 4),
      this.getMoviesByCategory('upcomingMovies', 4),
      this.getMoviesByCategory('nowPlayingMovies', 4)
    ]);

    // Prevent duplicates across homepage rows
    return this.allocateUniqueRows([
      { key: 'trending', items: trending },
      { key: 'trendingDay', items: trendingDay },
      { key: 'netflixOriginals', items: netflixOriginals },
      { key: 'topRatedMovies', items: topRatedMovies },
      { key: 'nowPlayingMovies', items: nowPlayingMovies },
      { key: 'upcomingMovies', items: upcomingMovies },
      { key: 'actionMovies', items: actionMovies },
      { key: 'comedyMovies', items: comedyMovies },
      { key: 'scienceFictionMovies', items: scienceFictionMovies },
      { key: 'horrorMovies', items: horrorMovies },
      { key: 'romanceMovies', items: romanceMovies },
      { key: 'popularTV', items: popularTV },
      { key: 'arabicMovies', items: arabicMovies },
      { key: 'arabicTV', items: arabicTV },
      { key: 'asianMovies', items: asianMovies },
      { key: 'asianTV', items: asianTV },
      { key: 'koreanTV', items: koreanTV },
      { key: 'animeTV', items: animeTV },
      { key: 'animationMovies', items: animationMovies },
      { key: 'documentaries', items: documentaries }
    ], 28);
  }
};
