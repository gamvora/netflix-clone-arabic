# Netflix Clone - Improvements Phase

## User Requirements
- [x] Continue Watching shows "الموسم X - الحلقة Y" in Arabic
- [x] Genre dropdown in navbar
- [ ] **ALL movie titles in English only** (no Chinese/Korean scripts)
- [ ] **ALL descriptions in Arabic ONLY** (no English underneath)
- [ ] **Trailer button for every movie/show** (hero + modal)
- [ ] **Mobile: episode thumbnails visible** (fix current tight grid)
- [ ] **Better UI** matching Netflix exactly
- [ ] Genre dropdown routes to scrolled+highlighted row
- [ ] No server changes (keep videasy player)

## Implementation Steps

### 1. Data Layer - Arabic overviews in list endpoints
- [ ] `js/api.js`: Modify `fetchMultiPage` to fetch both en-US + ar versions and merge overviews as `overview_ar`
- [ ] `js/api.js`: Keep `getTrending`, `getMoviesByCategory` etc. using the enhanced function

### 2. Utils - Display helpers
- [ ] `js/utils.js`: Add `getOverview(item)` → returns Arabic overview only (fallback to English only if Arabic missing)
- [ ] `js/utils.js`: Stricter `getTitle` — always Latin (English), never Chinese/Korean
- [ ] `js/utils.js`: `openDetailsModal` — remove English overview line, use `getOverview` only
- [ ] `js/utils.js`: `openDetailsModal` — always show trailer button (fallback YouTube search if no TMDB trailer)
- [ ] `js/utils.js`: Add hero trailer button helper

### 3. Hero & Pages - Arabic descriptions
- [ ] `js/main.js`: Use `getOverview` for hero overview + add trailer button in hero actions
- [ ] `js/movies.js`: Use `getOverview` for page hero + add trailer button + handle `?genre=` param
- [ ] `js/tvshows.js`: Same as movies

### 4. Mobile Fixes
- [ ] `css/player.css`: Ensure `.nf-ep-thumb` visible on small screens (wider + cleaner)
- [ ] `css/responsive.css`: Audit mobile nav, rows, cards

### 5. UI Polish (Netflix-accurate)
- [ ] `css/style.css`: Tighter hero meta, refined dropdown, smoother transitions
- [ ] Trailer button styling (icon + text)
- [ ] Genre highlighting animation

### 6. Cache Bust
- [ ] Bump all `?v=140` → `?v=150` in all HTML files
