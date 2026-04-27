// TMDB API Configuration
const CONFIG = {
  API_KEY: '3fd2be6f0c70a2a598f084ddfb75487c',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMG_URL: 'https://image.tmdb.org/t/p/original',
  IMG_URL_W500: 'https://image.tmdb.org/t/p/w500',
  IMG_URL_W300: 'https://image.tmdb.org/t/p/w300',
  LANGUAGE: 'en-US',           // English titles only (user request)
  LANGUAGE_FALLBACK: 'ar',     // Arabic for descriptions (fallback)
  REGION: 'SA',
  DEFAULT_BACKDROP: 'https://via.placeholder.com/1920x1080/141414/E50914?text=NETFLIX',
  DEFAULT_POSTER: 'https://via.placeholder.com/500x750/141414/E50914?text=No+Image'
};

// Helper to add language and sorted params
const L = `language=${CONFIG.LANGUAGE}`;
const LFB = `language=${CONFIG.LANGUAGE_FALLBACK}`;

// API Endpoints - All now include language + support random pages for fresh content
const ENDPOINTS = {
  // Trending
  trending: `/trending/all/week?api_key=${CONFIG.API_KEY}&${L}`,
  trendingDay: `/trending/all/day?api_key=${CONFIG.API_KEY}&${L}`,
  
  // Netflix Originals
  netflixOriginals: `/discover/tv?api_key=${CONFIG.API_KEY}&${L}&with_networks=213&sort_by=popularity.desc`,
  
  // Movies
  topRatedMovies: `/movie/top_rated?api_key=${CONFIG.API_KEY}&${L}`,
  popularMovies: `/movie/popular?api_key=${CONFIG.API_KEY}&${L}`,
  upcomingMovies: `/movie/upcoming?api_key=${CONFIG.API_KEY}&${L}`,
  nowPlayingMovies: `/movie/now_playing?api_key=${CONFIG.API_KEY}&${L}`,
  
  // Genre-based movies (now with language + sort by popularity)
  actionMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=28&sort_by=popularity.desc`,
  comedyMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=35&sort_by=popularity.desc`,
  horrorMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=27&sort_by=popularity.desc`,
  romanceMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=10749&sort_by=popularity.desc`,
  documentaries: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=99&sort_by=popularity.desc`,
  animationMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=16&sort_by=popularity.desc`,
  scienceFictionMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=878&sort_by=popularity.desc`,
  thrillerMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=53&sort_by=popularity.desc`,
  crimeMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=80&sort_by=popularity.desc`,
  fantasyMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=14&sort_by=popularity.desc`,
  mysteryMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=9648&sort_by=popularity.desc`,
  familyMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=10751&sort_by=popularity.desc`,
  adventureMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=12&sort_by=popularity.desc`,
  warMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_genres=10752&sort_by=popularity.desc`,
  
  // TV Shows
  popularTV: `/tv/popular?api_key=${CONFIG.API_KEY}&${L}`,
  topRatedTV: `/tv/top_rated?api_key=${CONFIG.API_KEY}&${L}`,
  onAirTV: `/tv/on_the_air?api_key=${CONFIG.API_KEY}&${L}`,
  airingTodayTV: `/tv/airing_today?api_key=${CONFIG.API_KEY}&${L}`,
  
  // TV by genre
  actionTV: `/discover/tv?api_key=${CONFIG.API_KEY}&${L}&with_genres=10759&sort_by=popularity.desc`,
  comedyTV: `/discover/tv?api_key=${CONFIG.API_KEY}&${L}&with_genres=35&sort_by=popularity.desc`,
  dramaTV: `/discover/tv?api_key=${CONFIG.API_KEY}&${L}&with_genres=18&sort_by=popularity.desc`,
  crimeTV: `/discover/tv?api_key=${CONFIG.API_KEY}&${L}&with_genres=80&sort_by=popularity.desc`,
  sciFiTV: `/discover/tv?api_key=${CONFIG.API_KEY}&${L}&with_genres=10765&sort_by=popularity.desc`,
  animeTV: `/discover/tv?api_key=${CONFIG.API_KEY}&${L}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`,
  koreanTV: `/discover/tv?api_key=${CONFIG.API_KEY}&${L}&with_original_language=ko&sort_by=popularity.desc`,
  arabicTV: `/discover/tv?api_key=${CONFIG.API_KEY}&${L}&with_original_language=ar&sort_by=popularity.desc`,
  
  // Details
  movieDetails: (id) => `/movie/${id}?api_key=${CONFIG.API_KEY}&append_to_response=videos,credits,similar,recommendations`,
  tvDetails: (id) => `/tv/${id}?api_key=${CONFIG.API_KEY}&append_to_response=videos,credits,similar,recommendations`,
  
  // Search
  searchMulti: (query) => `/search/multi?api_key=${CONFIG.API_KEY}&${L}&query=${encodeURIComponent(query)}&include_adult=false`
};

// Unified genre map: one key → movie filter + TV filter + Arabic label + icon
// Used by genre.html to show BOTH movies and TV shows of the chosen genre.
const GENRE_MAP = {
  action:      { ar: 'أكشن',          en: 'Action',          movie: 'with_genres=28',    tv: 'with_genres=10759', icon: 'fa-fist-raised' },
  comedy:      { ar: 'كوميدي',        en: 'Comedy',          movie: 'with_genres=35',    tv: 'with_genres=35',    icon: 'fa-laugh' },
  horror:      { ar: 'رعب',           en: 'Horror',          movie: 'with_genres=27',    tv: 'with_genres=9648',  icon: 'fa-ghost' },
  romance:     { ar: 'رومانسي',       en: 'Romance',         movie: 'with_genres=10749', tv: 'with_genres=18',    icon: 'fa-heart' },
  scifi:       { ar: 'خيال علمي',     en: 'Sci-Fi',          movie: 'with_genres=878',   tv: 'with_genres=10765', icon: 'fa-rocket' },
  thriller:    { ar: 'إثارة',         en: 'Thriller',        movie: 'with_genres=53',    tv: 'with_genres=80',    icon: 'fa-user-secret' },
  animation:   { ar: 'رسوم متحركة',   en: 'Animation',       movie: 'with_genres=16',    tv: 'with_genres=16',    icon: 'fa-magic' },
  documentary: { ar: 'وثائقي',        en: 'Documentary',     movie: 'with_genres=99',    tv: 'with_genres=99',    icon: 'fa-film' },
  crime:       { ar: 'جريمة',         en: 'Crime',           movie: 'with_genres=80',    tv: 'with_genres=80',    icon: 'fa-mask' },
  drama:       { ar: 'دراما',         en: 'Drama',           movie: 'with_genres=18',    tv: 'with_genres=18',    icon: 'fa-theater-masks' },
  fantasy:     { ar: 'خيال',          en: 'Fantasy',         movie: 'with_genres=14',    tv: 'with_genres=10765', icon: 'fa-hat-wizard' },
  adventure:   { ar: 'مغامرة',        en: 'Adventure',       movie: 'with_genres=12',    tv: 'with_genres=10759', icon: 'fa-compass' },
  family:      { ar: 'عائلي',         en: 'Family',          movie: 'with_genres=10751', tv: 'with_genres=10751', icon: 'fa-users' },
  mystery:     { ar: 'غموض',          en: 'Mystery',         movie: 'with_genres=9648',  tv: 'with_genres=9648',  icon: 'fa-search' },
  war:         { ar: 'حرب',           en: 'War',             movie: 'with_genres=10752', tv: 'with_genres=10768', icon: 'fa-shield-alt' },
  korean:      { ar: 'كوري',          en: 'Korean',          movie: 'with_original_language=ko', tv: 'with_original_language=ko', icon: 'fa-star' },
  anime:       { ar: 'أنمي',          en: 'Anime',           movie: 'with_genres=16&with_original_language=ja', tv: 'with_genres=16&with_original_language=ja', icon: 'fa-dragon' },
  arabic:      { ar: 'عربي',          en: 'Arabic',          movie: 'with_original_language=ar', tv: 'with_original_language=ar', icon: 'fa-mosque' }
};

// Build TMDB discover URL for a given genre key + media type
function buildGenreUrl(genreKey, mediaType /* 'movie' | 'tv' */) {
  const g = GENRE_MAP[genreKey];
  if (!g) return null;
  const filter = g[mediaType];
  if (!filter) return null;
  return `/discover/${mediaType}?api_key=${CONFIG.API_KEY}&${L}&${filter}&sort_by=popularity.desc`;
}
