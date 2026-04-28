/* ================================================================
   NETFLIXY — ANDROID TV / SMART TV REMOTE NAVIGATION
   ----------------------------------------------------------------
   Features:
   • Auto-detect Android TV, Tizen, webOS, Fire TV → TV mode
   • Manual toggle: ?tv=1  OR  localStorage.netflixy_tv_mode='1'
   • Arrow-key spatial navigation (D-pad)
   • Row memory: UP from row 2 returns to same COLUMN in row 1
   • Centered-scroll: focused card centers in its row
   • Media keys: Play/Pause/Stop/FF/Rewind on watch page
   • Persistent last-focused across navigation (sessionStorage)
   • Back: modal → nav drawer → history.back()
   • Overscan safe area automatically activated
   ================================================================ */

(function () {
  'use strict';

  // ---------- Platform detection ----------
  function detectTVPlatform() {
    const ua = (navigator.userAgent || '').toLowerCase();
    const tvSignals = [
      'android tv',   // Android TV
      'googletv',
      'smart-tv',
      'smarttv',
      'tizen',        // Samsung TV
      'web0s',        // LG webOS
      'webos',
      'netcast',      // Older LG
      'hbbtv',
      'crkey',        // Chromecast
      'aftt',         // Amazon Fire TV
      'afts',
      'aftb',
      'aftm',
      'aftn',
      'philipstv',
      'viera',
      'bravia',       // Sony
      'roku',
      'appletv'
    ];
    if (tvSignals.some(s => ua.includes(s))) return true;
    // URL / storage overrides
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tv') === '1') return true;
      if (localStorage.getItem('netflixy_tv_mode') === '1') return true;
    } catch (_) {}
    return false;
  }

  const IS_TV = detectTVPlatform();

  const TVNav = {
    enabled: true,
    tvMode: IS_TV,
    lastFocused: null,
    scrollPadding: IS_TV ? 180 : 100,
    _lastRowMemory: new Map(), // rowEl -> last focused child
    _pendingScroll: null,

    FOCUSABLE: [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '.card',
      '.sim-card',
      '.nf-ep-card',
      '.nf-season-tab',
      '.nf-icon-btn',
      '.nf-tv-btn',
      '.continue-play',
      '.continue-remove',
      '.btn-icon',
      '.genre-chip',
      '.nav-link',
      '.logo',
      '.profile',
      '.search-btn',
      '.modal-ep-item',
      '.btn-play-modal',
      '.btn-resume',
      '.btn-list-modal',
      '.srv-picker-btn',
      '.profile-card',
      '.genre-card'
    ].join(','),

    // Elements that group horizontal rows (for row memory)
    ROW_CONTAINERS: '.row-content, .row, .nf-episodes-list, .nf-seasons-tabs, .continue-row, .similar-grid',

    init() {
      // Mark body
      document.body.classList.add('tv-nav-ready');
      if (this.tvMode) {
        document.body.classList.add('tv-mode');
      }

      this.makeElementsFocusable();
      this.observeChanges();
      this.observeModalAndFocusState();

      // Keyboard / remote listener (capture for TV reliability)
      document.addEventListener('keydown', (e) => this.handleKey(e), true);

      // Track focus
      document.addEventListener('focusin', (e) => {
        const target = e.target;
        if (!target || target === document.body) return;
        this.lastFocused = target;
        this.rememberRowPosition(target);
        this.scrollIntoView(target);
        this.saveFocusPath(target);
      });

      // Mouse activity switches to "mouse mode" (hide strong TV focus)
      let mouseTimer;
      document.addEventListener('mousemove', () => {
        if (!this.tvMode) return;
        document.body.classList.add('mouse-active');
        clearTimeout(mouseTimer);
        mouseTimer = setTimeout(() => {
          document.body.classList.remove('mouse-active');
        }, 2000);
      }, { passive: true });

      document.addEventListener('keydown', () => {
        if (!this.tvMode) return;
        document.body.classList.remove('mouse-active');
      }, true);

      // Restore last focus from sessionStorage OR focus first card
      setTimeout(() => this.restoreOrFocusInitial(), 500);
      setTimeout(() => this.restoreOrFocusInitial(), 1500);
    },

    makeElementsFocusable() {
      document.querySelectorAll(this.FOCUSABLE).forEach(el => {
        const tag = el.tagName;
        const needsTabindex = tag !== 'A' && tag !== 'BUTTON' &&
                              tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA';
        if (needsTabindex && !el.hasAttribute('tabindex')) {
          el.setAttribute('tabindex', '0');
        }
      });
    },

    observeChanges() {
      let rafId = null;
      const schedule = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          this.makeElementsFocusable();
        });
      };
      const observer = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.addedNodes && m.addedNodes.length > 0) { schedule(); break; }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    },

    observeModalAndFocusState() {
      const focusableSelector = this.FOCUSABLE;
      const observer = new MutationObserver(() => {
        const active = document.activeElement;
        const modal = this.getOpenModal();
        if (modal) {
          const modalFocusable = modal.querySelector(focusableSelector);
          if (modalFocusable && (!active || active === document.body || !modal.contains(active))) {
            try { modalFocusable.focus({ preventScroll: true }); } catch (_) {}
          }
          return;
        }
        if (!active || active === document.body || !document.contains(active)) {
          if (this.lastFocused && document.contains(this.lastFocused) && this.isVisible(this.lastFocused)) {
            try { this.lastFocused.focus({ preventScroll: true }); return; } catch (_) {}
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    },

    getOpenModal() {
      return document.querySelector(
        '.srv-picker-modal, .trailer-modal.active, .modal-overlay.active, .modal.active, .modal-overlay[style*="display: flex"]'
      );
    },

    // ---------- Row memory ----------
    rememberRowPosition(el) {
      if (!el) return;
      const row = el.closest(this.ROW_CONTAINERS);
      if (row) {
        this._lastRowMemory.set(row, el);
      }
    },

    // ---------- Focus persistence across pages ----------
    saveFocusPath(el) {
      try {
        const path = this.buildSelector(el);
        if (path) {
          sessionStorage.setItem('netflixy_last_focus', path);
          sessionStorage.setItem('netflixy_last_focus_page', location.pathname);
        }
      } catch (_) {}
    },
    buildSelector(el) {
      if (!el || !el.tagName) return null;
      if (el.id) return '#' + el.id;
      // Card with movie-id
      if (el.classList.contains('card') && el.dataset && el.dataset.id) {
        return `.card[data-id="${el.dataset.id}"][data-type="${el.dataset.type || ''}"]`;
      }
      // nav-link with href
      if (el.tagName === 'A' && el.getAttribute('href')) {
        const href = el.getAttribute('href');
        return `a[href="${href.replace(/"/g, '\\"')}"]`;
      }
      return null;
    },
    restoreOrFocusInitial() {
      const active = document.activeElement;
      if (active && active !== document.body && this.isVisible(active)) return;
      try {
        const path = sessionStorage.getItem('netflixy_last_focus');
        const page = sessionStorage.getItem('netflixy_last_focus_page');
        if (path && page === location.pathname) {
          const el = document.querySelector(path);
          if (el && this.isVisible(el)) {
            el.focus({ preventScroll: false });
            return;
          }
        }
      } catch (_) {}
      this.focusInitial();
    },

    focusInitial() {
      const active = document.activeElement;
      if (active && active !== document.body && this.isVisible(active)) return;
      const first = document.querySelector(
        '.hero-btn, .card, .nav-link, .genre-chip, .genre-card, .profile-card, button'
      );
      if (first) {
        try { first.focus({ preventScroll: false }); } catch (_) {}
      }
    },

    // ---------- Key handling ----------
    handleKey(e) {
      if (!this.enabled) return;
      const active = document.activeElement;
      const isTyping = active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.isContentEditable
      );
      const key = e.key;

      // ---------- Media keys (watch page) ----------
      if (location.pathname.endsWith('watch.html')) {
        // These keys are often fired by Android TV remotes
        if (key === 'MediaPlayPause' || key === 'MediaPlay' || key === 'MediaPause') {
          // Try to forward to player; iframe may handle itself
          e.preventDefault();
          return;
        }
        if (key === 'MediaStop') {
          e.preventDefault();
          window.location.href = 'index.html';
          return;
        }
      }

      // ---------- Enter / OK ----------
      if ((key === 'Enter' || key === 'Select') && active && active !== document.body && !isTyping) {
        e.preventDefault();
        try { active.click(); } catch (_) {}
        return;
      }

      // ---------- BACK ----------
      if (
        key === 'Escape' ||
        key === 'GoBack' ||
        key === 'BrowserBack' ||
        key === 'XF86Back' ||
        (key === 'Backspace' && !isTyping)
      ) {
        // Close open UI layers first
        const openModal = this.getOpenModal();
        if (openModal) {
          e.preventDefault();
          const closeBtn = openModal.querySelector('.modal-close, .srv-picker-close, [data-close]');
          if (closeBtn) { closeBtn.click(); }
          else {
            openModal.classList.remove('active');
            if (openModal.classList.contains('srv-picker-modal')) openModal.remove();
          }
          setTimeout(() => {
            if (this.lastFocused && document.contains(this.lastFocused)) {
              try { this.lastFocused.focus(); } catch (_) {}
            } else { this.focusInitial(); }
          }, 30);
          return;
        }

        // Close mobile nav drawer
        const navLinks = document.querySelector('.nav-links.active');
        if (navLinks) {
          e.preventDefault();
          navLinks.classList.remove('active');
          const menuBtn = document.querySelector('.menu-toggle');
          if (menuBtn) { try { menuBtn.focus(); } catch (_) {} }
          return;
        }

        // If not on home/intro, go back
        const isHome = /index\.html$|\/$/.test(location.pathname);
        const isIntro = /intro\.html$/.test(location.pathname);
        if (!isHome && !isIntro) {
          e.preventDefault();
          if (history.length > 1) history.back();
          else window.location.href = 'index.html';
          return;
        }
      }

      // ---------- Arrows ----------
      if (isTyping) return;
      const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key);
      if (!isArrow) return;

      const scope = this.getOpenModal() || null;
      e.preventDefault();
      this.moveFocus(key, scope);
    },

    // ---------- Spatial navigation ----------
    moveFocus(direction, scopeEl = null) {
      const current = document.activeElement;
      if (!current || current === document.body) {
        this.focusInitial();
        return;
      }

      const currentRect = current.getBoundingClientRect();
      if (currentRect.width === 0 && currentRect.height === 0) {
        this.focusInitial();
        return;
      }

      // ---------- ROW MEMORY: Up/Down ----------
      if (direction === 'ArrowUp' || direction === 'ArrowDown') {
        const jumpTarget = this.jumpBetweenRows(current, direction, scopeEl);
        if (jumpTarget) {
          this.focusEl(jumpTarget);
          return;
        }
      }

      // ---------- Generic spatial ----------
      const root = scopeEl || document;
      const candidates = Array.from(root.querySelectorAll(this.FOCUSABLE))
        .filter(el => el !== current && this.isVisible(el));

      let best = null;
      let bestScore = Infinity;
      const cx = currentRect.left + currentRect.width / 2;
      const cy = currentRect.top + currentRect.height / 2;

      candidates.forEach(el => {
        const r = el.getBoundingClientRect();
        const ex = r.left + r.width / 2;
        const ey = r.top + r.height / 2;
        const dx = ex - cx;
        const dy = ey - cy;

        let valid = false;
        let primary = 0, perp = 0;

        switch (direction) {
          case 'ArrowRight':
            if (dx > 5) { valid = true; primary = dx; perp = Math.abs(dy); }
            break;
          case 'ArrowLeft':
            if (dx < -5) { valid = true; primary = -dx; perp = Math.abs(dy); }
            break;
          case 'ArrowDown':
            if (dy > 5) { valid = true; primary = dy; perp = Math.abs(dx); }
            break;
          case 'ArrowUp':
            if (dy < -5) { valid = true; primary = -dy; perp = Math.abs(dx); }
            break;
        }
        if (!valid) return;

        // Favor alignment (perp distance weighted higher)
        const score = primary + perp * 2.2;
        if (score < bestScore) { bestScore = score; best = el; }
      });

      if (best) this.focusEl(best);
    },

    // Find the nearest row above/below and jump to remembered column
    jumpBetweenRows(current, direction, scopeEl) {
      const currentRow = current.closest(this.ROW_CONTAINERS);
      if (!currentRow) return null;

      const root = scopeEl || document;
      const allRows = Array.from(root.querySelectorAll(this.ROW_CONTAINERS))
        .filter(r => this.isVisible(r));
      if (allRows.length < 2) return null;

      const currentRowRect = currentRow.getBoundingClientRect();

      // Find next row in direction
      let target = null;
      let bestDistance = Infinity;
      allRows.forEach(r => {
        if (r === currentRow) return;
        const rr = r.getBoundingClientRect();
        const rowCenterY = rr.top + rr.height / 2;
        const curCenterY = currentRowRect.top + currentRowRect.height / 2;
        const dy = rowCenterY - curCenterY;
        if (direction === 'ArrowDown' && dy > 10 && dy < bestDistance) {
          bestDistance = dy; target = r;
        } else if (direction === 'ArrowUp' && dy < -10 && -dy < bestDistance) {
          bestDistance = -dy; target = r;
        }
      });
      if (!target) return null;

      // Prefer remembered card in that row
      const remembered = this._lastRowMemory.get(target);
      if (remembered && document.contains(remembered) && this.isVisible(remembered) && target.contains(remembered)) {
        return remembered;
      }

      // Otherwise pick the item whose horizontal center is closest to current
      const currentCenterX = current.getBoundingClientRect().left + current.getBoundingClientRect().width / 2;
      const rowItems = Array.from(target.querySelectorAll(this.FOCUSABLE))
        .filter(el => this.isVisible(el));
      if (rowItems.length === 0) {
        // Row has no focusable items in its direct tree — fall back to whole target
        const anyInside = target.querySelector(this.FOCUSABLE);
        return anyInside && this.isVisible(anyInside) ? anyInside : null;
      }
      let closest = rowItems[0];
      let bestDX = Infinity;
      rowItems.forEach(el => {
        const er = el.getBoundingClientRect();
        const ex = er.left + er.width / 2;
        const d = Math.abs(ex - currentCenterX);
        if (d < bestDX) { bestDX = d; closest = el; }
      });
      return closest;
    },

    focusEl(el) {
      if (!el) return;
      try { el.focus({ preventScroll: false }); } catch (_) {}
    },

    isVisible(el) {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const style = window.getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false;
      return true;
    },

    // ---------- Centered scrolling ----------
    scrollIntoView(el) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;

      // Vertical page scroll
      if (rect.top < this.scrollPadding) {
        window.scrollBy({ top: rect.top - this.scrollPadding, behavior: 'smooth' });
      } else if (rect.bottom > vh - this.scrollPadding) {
        window.scrollBy({ top: rect.bottom - vh + this.scrollPadding, behavior: 'smooth' });
      }

      // Horizontal row scroll → center the card
      const scrollContainer = el.closest('.row-content, .nf-episodes-list, .nf-seasons-tabs');
      if (scrollContainer) {
        const cRect = scrollContainer.getBoundingClientRect();
        const targetLeft = rect.left - cRect.left + scrollContainer.scrollLeft
                         - (cRect.width - rect.width) / 2;
        scrollContainer.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: 'smooth'
        });
      }
    },

    // ---------- Public API ----------
    enableTVMode() {
      this.tvMode = true;
      document.body.classList.add('tv-mode');
      try { localStorage.setItem('netflixy_tv_mode', '1'); } catch (_) {}
    },
    disableTVMode() {
      this.tvMode = false;
      document.body.classList.remove('tv-mode');
      try { localStorage.setItem('netflixy_tv_mode', '0'); } catch (_) {}
    },
    toggleTVMode() {
      if (this.tvMode) this.disableTVMode(); else this.enableTVMode();
    }
  };

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TVNav.init());
  } else {
    TVNav.init();
  }

  // Expose globally
  window.TVNav = TVNav;
})();
