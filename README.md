# 🎬 Netflix Clone - Arabic Edition

موقع شبيه بـ Netflix كامل بواجهة عربية RTL مع دعم الترجمة العربية في مشغل الفيديو.

A complete Netflix-style streaming site with Arabic RTL interface and Arabic subtitle support.

## 🌐 Live Demo

🔗 **[View Live Site](https://alaazimmo.github.io/netflix-clone-arabic/)**

## ✨ Features

- 🎨 **Netflix-accurate UI** - Dark theme, red accents, smooth animations
- 🇸🇦 **Full Arabic RTL support** - Arabic interface with English original titles
- 🎥 **Video Player** with Arabic subtitles (auto-selected)
- 📺 **Movies & TV Shows** - Browsing, categories, details modals
- 🔍 **Live Search** - Search across all movies and TV shows
- ❤️ **My List** - Save favorites (localStorage)
- ⏯️ **Continue Watching** - Netflix-style resume feature
- 📱 **Fully Responsive** - Mobile, tablet, desktop
- 📺 **Android TV Remote** support (focusable cards, keyboard navigation)
- 🎞️ **Episode Picker** - Netflix-style season/episode selection for TV shows
- 🔥 **HD Badges, Ratings, Similar content recommendations**

## 🛠️ Tech Stack

- **Pure HTML / CSS / JavaScript** - No build tools needed
- **TMDB API** - Real movie & show data (Arabic + English fallback)
- **HTML5 Video + VTT subtitles** - Native player with Arabic tracks
- **Font Awesome + Google Fonts** (Cairo + Bebas Neue)

## 📁 Project Structure

```
├── index.html          # Homepage with hero + rows
├── movies.html         # Movies page
├── tvshows.html        # TV shows page
├── search.html         # Search page
├── mylist.html         # My favorites list
├── watch.html          # Video player page
├── css/
│   ├── style.css       # Main Netflix design
│   ├── player.css      # Video player styles
│   └── responsive.css  # Mobile responsive
├── js/
│   ├── config.js       # TMDB API config
│   ├── api.js          # API calls
│   ├── utils.js        # Helpers + localStorage
│   ├── main.js         # Homepage logic
│   ├── movies.js       # Movies page
│   ├── tvshows.js      # TV shows page
│   ├── search.js       # Search
│   ├── mylist.js       # My list
│   └── player.js       # Video player + subtitles
├── subtitles/
│   ├── sample-ar.vtt   # Arabic subtitles
│   └── sample-en.vtt   # English subtitles
└── videos/             # Local demo videos
```

## 🚀 Run Locally

Just open `index.html` in your browser - no build steps needed!

Or use a local server:

```bash
python server.py
# Then visit http://localhost:8000
```

## 📝 Notes

- Movie data is fetched from [TMDB](https://www.themoviedb.org/) API
- This is an educational clone/demo — not affiliated with Netflix
- Streaming sample videos are public demo MP4s

## 📄 License

MIT - Use freely for learning.

---

Made with ❤️ for Arabic-speaking movie lovers
