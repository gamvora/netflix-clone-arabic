# NETFLIXY - Android TV + Mobile Compatibility

## Plan Approval
- [x] User approved Android TV + Mobile optimization plan

## 1) Audit Existing UI/Control Files
- [x] Review `css/style.css`
- [x] Review `css/responsive.css`
- [x] Review `css/player.css`
- [x] Review `js/tv-nav.js`
- [x] Review `js/player.js`
- [x] Review key pages (`index/movies/tvshows/search/mylist/watch/genre/profiles`)

## 2) Android TV Improvements
- [x] Unify remote navigation (Arrow keys + Enter + Back/Escape)
- [x] Improve focus rings for all interactive controls
- [x] Ensure predictable focus order between nav/rows/modals
- [x] Prevent focus loss when opening/closing dropdowns and modals

## 3) Mobile Improvements
- [x] Ensure touch target size >= 44px for controls
- [x] Improve navbar usability on narrow screens
- [x] Improve row/card horizontal scrolling behavior
- [x] Fix text overflow/cutoff issues for Arabic and mixed content

## 4) Watch Player Improvements (TV + Mobile)
- [x] Increase control button size and spacing
- [x] Improve subtitles readability (Arabic)
- [ ] Improve fullscreen/orientation behavior
- [x] Keep controls easy with remote and touch

## 5) Verification
- [ ] Run JS syntax checks
- [ ] Review for CSS regressions
- [ ] Update cache version if needed
- [ ] Final pass summary

## 6) New Comprehensive Pass (Requested)
- [x] User requested: comprehensive improvement + TV usability
- [ ] Improve TV focus visuals and keyboard clarity
- [ ] Improve dynamic focus reliability in carousels/modals
- [ ] Optimize performance hotspots (event handlers / focus scans)
- [ ] Re-test key flow after improvements

## 7) New Task: Expand Arabic + Asian Content
- [x] Plan approved
- [ ] Update `js/config.js` with `arabicMovies`, `asianMovies`, `asianTV` endpoints
- [ ] Update `js/api.js` homepage payload with new categories
- [ ] Update `index.html` with Arabic + Asian homepage rows
- [ ] Update `js/main.js` to render new homepage rows
- [ ] Update `movies.html` rows (Arabic movies + Asian movies)
- [ ] Update `js/movies.js` fetch/render for new movie rows
- [ ] Update `tvshows.html` rows (Asian series)
- [ ] Update `js/tvshows.js` fetch/render for new tv rows
- [ ] Run syntax checks for updated JS files
- [ ] Quick browser verification
- [ ] Commit and push to GitHub
