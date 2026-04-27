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
// =================================================================
//  🛡️  ADULT / PORNOGRAPHIC CONTENT BLOCKING — HARD FILTER
// =================================================================
// Layer 1 (server-side): include_adult=false + without_keywords (TMDB blocks these before sending)
// Layer 2 (server-side): without_genres=10749 for movies flagged "Romance+Erotic" combos is too aggressive → NOT used
// Layer 3 (client-side): isSafeContent() removes anything that slips through
//
// TMDB keyword IDs blocked (comprehensive list — ALL sexual/adult keywords):
//   158718=erotic movie         190370=erotica              1501=erotic film
//   5627=adult-film             9799=sex scene              267103=pornography
//   246466=hentai               13141=softcore              210024=nudity
//   289068=hentai-anime         4344=erotic drama           165531=sexploitation
//   162846=adult animation      190150=exploitation film    9673=sex
//   1813=sensuality             10928=nude                  6152=nudity (female)
//   6054=nudity (male)          8201=nudity (full)          12339=sex comedy
//   245197=gore                 240740=lewd                 155027=fetish
//   158130=bdsm                 254480=explicit sex         252104=sexual fantasy
//   270569=porn-parody          188961=pinku eiga           188961=roman porno
//   — Additional sex keywords (user request: block ALL "sex" keywords) —
//   2383=sexual relationship    162365=sexual awakening     169007=sexual tension
//   217055=sexual predator      1706=sexual abuse           234213=sexual assault
//   168362=sexual harassment    163057=sexual identity      245505=sexual violence
//   15103=virginity             3730=prostitute             10843=prostitution
//   3701=promiscuity            224241=polyamory            206559=swinging
//   3682=brothel                162369=one night stand      162372=adultery
//   9880=infidelity             10139=affair                161159=seduction
//   6075=lust                   233107=sex worker           180546=escort
//   163074=group sex            5565=homoerotic             7377=homosexuality
//   169349=sexy                 6270=sex and the city       244925=sex education
const BLOCKED_KEYWORDS = [
  // Core adult/porn
  '158718','190370','1501','5627','9799','267103','246466','13141','210024','289068',
  '4344','165531','162846','190150','9673','1813','10928','6152','6054','8201',
  '12339','240740','155027','158130','254480','252104','270569','188961',
  // Sex-related (blocked per user request)
  '2383','162365','169007','217055','1706','234213','168362','163057','245505',
  '15103','3730','10843','3701','224241','206559','3682','162369','162372',
  '9880','10139','161159','6075','233107','180546','163074','169349','244925'
].join(',');
const SAFE = `include_adult=false&without_keywords=${BLOCKED_KEYWORDS}`;
const L = `language=${CONFIG.LANGUAGE}&${SAFE}`;
const LFB = `language=${CONFIG.LANGUAGE_FALLBACK}&${SAFE}`;

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
  arabicMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_original_language=ar&sort_by=popularity.desc`,
  asianMovies: `/discover/movie?api_key=${CONFIG.API_KEY}&${L}&with_origin_country=AS&sort_by=popularity.desc`,
  
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
  asianTV: `/discover/tv?api_key=${CONFIG.API_KEY}&${L}&with_origin_country=AS&sort_by=popularity.desc`,
  
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
  // L already includes include_adult=false + without_keywords
  return `/discover/${mediaType}?api_key=${CONFIG.API_KEY}&${L}&${filter}&sort_by=popularity.desc`;
}

// =================================================================
//  🛡️  CLIENT-SIDE SAFETY FILTER
//  Final defense: removes ANY adult/pornographic item that slipped
//  past the TMDB server-side filters. Korean/Asian/Anime NOT affected.
// =================================================================
const BLOCKED_KEYWORD_SET = new Set(BLOCKED_KEYWORDS.split(',').map(x => parseInt(x, 10)));

// Expanded blocked terms list (English + Japanese + Arabic + transliterations)
// Any item whose title / overview / tagline contains ANY of these is blocked.
const BLOCKED_TERMS = [
  // === "SEX" root — catches sex, sexy, sexual, sexuality, sexism, bisexual, etc. ===
  'sex',
  // === Explicit English ===
  'hentai', 'porno', 'pornograph', 'porn ', ' porn', 'xxx', 'erotic', 'erotica',
  'softcore', 'hardcore', 'nudity', 'nude ', ' nude', 'naked ', ' naked',
  'pinku', 'roman porno', 'sexploitation', 'adult film', 'adult movie',
  'fetish', 'bdsm', 'orgy', 'orgasm', 'milf', 'dilf', 'stepmom', 'stepsis',
  'intercourse', 'masturbat', 'fellatio', 'cunnilingus', 'lewd', 'lascivious',
  'raunchy', 'threesome', 'foursome', 'gangbang', 'bukkake', 'incest',
  'camgirl', 'stripper', 'striptease', 'lap dance', 'whorehouse', 'brothel',
  'prostitute', 'prostitution', 'hooker', 'escort ', 'call girl', 'gigolo',
  'promiscuous', 'promiscuity', 'lust ', ' lust', 'seduction', 'seductress',
  'sensual', 'sensuality', 'arousal', 'aroused', 'virginity', 'deflower',
  'affair ', 'adultery', 'infidelity', 'swinger', 'polyamory',
  // === Arabic explicit ===
  'اباحي', 'إباحي', 'جنسي', 'جنس ', ' جنس', 'عاري', 'عريان', 'شاذ', 'بورنو',
  'سكس', 'اباحية', 'إباحية', 'عري', 'فضيحة جنس', 'دعارة', 'عاهرة', 'زنا',
  'مومس', 'خيانة زوجية', 'إغراء', 'شهوة', 'شاذة', 'مثلي',
  // === Japanese romaji (adult anime/movie titles) ===
  'ecchi', 'oppai', 'yaoi', 'yuri ', ' yuri', 'futanari', 'ahegao', 'eroge',
  'paizuri', 'netorare', 'netori', 'nukige', 'pinku eiga'
];

// Adult production companies on TMDB (known porn studios) — blocked by name match
const BLOCKED_COMPANIES = [
  'brazzers', 'bangbros', 'naughty america', 'reality kings', 'mofos',
  'vixen', 'blacked', 'tushy', 'evil angel', 'wicked pictures',
  'vivid entertainment', 'digital playground', 'hustler video',
  'private media', 'mindgeek', 'pornhub', 'xvideos', 'xhamster'
];

function isSafeContent(item) {
  if (!item) return false;

  // 1. TMDB adult flag — hard block
  if (item.adult === true) return false;

  // 2. Keyword IDs — block if item lists any blocked keyword
  if (item.keywords && Array.isArray(item.keywords.keywords)) {
    if (item.keywords.keywords.some(k => BLOCKED_KEYWORD_SET.has(k.id))) return false;
  }
  // Some API variants return keywords as item.keywords.results (TV)
  if (item.keywords && Array.isArray(item.keywords.results)) {
    if (item.keywords.results.some(k => BLOCKED_KEYWORD_SET.has(k.id))) return false;
  }

  // 3. Text matching on titles/overview (catches anything keyword-free)
  const text = [
    item.title, item.name, item.original_title, item.original_name,
    item.overview, item.tagline
  ].filter(Boolean).join(' ').toLowerCase();

  if (BLOCKED_TERMS.some(t => text.includes(t))) return false;

  // 4. Production company blacklist
  if (item.production_companies && Array.isArray(item.production_companies)) {
    const companyNames = item.production_companies
      .map(c => (c.name || '').toLowerCase())
      .join(' ');
    if (BLOCKED_COMPANIES.some(c => companyNames.includes(c))) return false;
  }

  // 5. NC-17 / X / adult certification (when available)
  if (item.release_dates && item.release_dates.results) {
    const ratings = item.release_dates.results.flatMap(r =>
      (r.release_dates || []).map(rd => (rd.certification || '').toUpperCase())
    );
    if (ratings.some(r => r === 'NC-17' || r === 'X' || r === 'XXX' || r === 'AO')) return false;
  }

  return true;
}
