// API Service - Handles all TMDB API calls
const API = {
  
  // Generic fetch function
  async fetchData(endpoint) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error, endpoint);
      return { results: [] };
    }
  },

  // Fetch multiple pages and combine (for freshness + more content)
  async fetchMultiPage(endpoint, pages = 1) {
    const promises = [];
    for (let p = 1; p <= pages; p++) {
      const separator = endpoint.includes('?') ? '&' : '?';
      promises.push(this.fetchData(`${endpoint}${separator}page=${p}`));
    }
    const results = await Promise.all(promises);
    const all = [];
    results.forEach(r => {
      if (r && r.results) all.push(...r.results);
    });
    // Deduplicate by id+media_type
    const seen = new Set();
    return all.filter(item => {
      const key = `${item.id}_${item.media_type || 'x'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  // Get trending
  async getTrending() {
    return this.fetchMultiPage(ENDPOINTS.trending, 2);
  },

  async getTrendingDay() {
    const data = await this.fetchData(ENDPOINTS.trendingDay);
    return data.results || [];
  },

  // Netflix Originals
  async getNetflixOriginals() {
    return this.fetchMultiPage(ENDPOINTS.netflixOriginals, 2);
  },

  // Get content by category (with multi-page)
  async getMoviesByCategory(category, pages = 2) {
    if (!ENDPOINTS[category]) return [];
    return this.fetchMultiPage(ENDPOINTS[category], pages);
  },

  // Movie details (Arabic with English fallback for overview AND videos)
  async getMovieDetails(id) {
    const arData = await this.fetchData(`${ENDPOINTS.movieDetails(id)}&language=${CONFIG.LANGUAGE}`);
    const needsOverview = arData && (!arData.overview || arData.overview.trim() === '');
    const needsVideos = arData && (!arData.videos || !arData.videos.results || arData.videos.results.length === 0);
    if (needsOverview || needsVideos) {
      const enData = await this.fetchData(`${ENDPOINTS.movieDetails(id)}&language=${CONFIG.LANGUAGE_FALLBACK}`);
      if (enData) {
        if (needsOverview && enData.overview) {
          arData.overview = enData.overview;
          if (!arData.title || arData.title === arData.original_title) arData.title = enData.title || arData.title;
        }
        if (needsVideos && enData.videos && enData.videos.results) {
          arData.videos = enData.videos;
        }
      }
    }
    return arData;
  },

  // TV details (Arabic with English fallback for overview AND videos)
  async getTVDetails(id) {
    const arData = await this.fetchData(`${ENDPOINTS.tvDetails(id)}&language=${CONFIG.LANGUAGE}`);
    const needsOverview = arData && (!arData.overview || arData.overview.trim() === '');
    const needsVideos = arData && (!arData.videos || !arData.videos.results || arData.videos.results.length === 0);
    if (needsOverview || needsVideos) {
      const enData = await this.fetchData(`${ENDPOINTS.tvDetails(id)}&language=${CONFIG.LANGUAGE_FALLBACK}`);
      if (enData) {
        if (needsOverview && enData.overview) {
          arData.overview = enData.overview;
          if (!arData.name || arData.name === arData.original_name) arData.name = enData.name || arData.name;
        }
        if (needsVideos && enData.videos && enData.videos.results) {
          arData.videos = enData.videos;
        }
      }
    }
    return arData;
  },

  // Season details
  async getSeasonDetails(tvId, seasonNumber) {
    const ar = await this.fetchData(`/tv/${tvId}/season/${seasonNumber}?api_key=${CONFIG.API_KEY}&language=${CONFIG.LANGUAGE}`);
    if (ar && ar.episodes && ar.episodes.some(e => !e.overview)) {
      const en = await this.fetchData(`/tv/${tvId}/season/${seasonNumber}?api_key=${CONFIG.API_KEY}&language=${CONFIG.LANGUAGE_FALLBACK}`);
      if (en && en.episodes) {
        ar.episodes = ar.episodes.map(ep => {
          const enEp = en.episodes.find(e => e.episode_number === ep.episode_number);
          if (enEp && !ep.overview) ep.overview = enEp.overview;
          return ep;
        });
      }
    }
    return ar;
  },

  // Search
  async search(query) {
    if (!query || query.trim() === '') return [];
    const data = await this.fetchData(ENDPOINTS.searchMulti(query));
    return (data.results || []).filter(item => 
      item.media_type !== 'person' && (item.poster_path || item.backdrop_path)
    );
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
      upcomingMovies,
      nowPlayingMovies
    ] = await Promise.all([
      this.getTrending(),
      this.getTrendingDay(),
      this.getNetflixOriginals(),
      this.getMoviesByCategory('topRatedMovies'),
      this.getMoviesByCategory('actionMovies'),
      this.getMoviesByCategory('comedyMovies'),
      this.getMoviesByCategory('horrorMovies'),
      this.getMoviesByCategory('romanceMovies'),
      this.getMoviesByCategory('documentaries'),
      this.getMoviesByCategory('popularTV'),
      this.getMoviesByCategory('scienceFictionMovies'),
      this.getMoviesByCategory('animationMovies'),
      this.getMoviesByCategory('koreanTV'),
      this.getMoviesByCategory('animeTV'),
      this.getMoviesByCategory('upcomingMovies'),
      this.getMoviesByCategory('nowPlayingMovies')
    ]);

    return {
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
      upcomingMovies,
      nowPlayingMovies
    };
  }
};
