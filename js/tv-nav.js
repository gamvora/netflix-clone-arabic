/* ================================================================
   ANDROID TV REMOTE NAVIGATION
   - Spatial arrow-key navigation (←↑→↓)
   - Enter/OK = click
   - Escape/Backspace = back
   - Works alongside mouse/touch (doesn't break desktop/mobile)
   - Auto-scrolls focused element into view
   ================================================================ */

(function() {
  'use strict';

  const TVNav = {
    enabled: true,
    lastFocused: null,
    scrollPadding: 100,

    // Selector for focusable elements
    FOCUSABLE: [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
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
      '.search-btn'
    ].join(','),

    init() {
      // Add tabindex="0" to any card/interactive element that is missing it
      this.makeElementsFocusable();

      // Re-scan whenever new content is added (rows are dynamic)
      this.observeChanges();

      // Keyboard listener
      document.addEventListener('keydown', (e) => this.handleKey(e), true);

      // Track focus
      document.addEventListener('focusin', (e) => {
        this.lastFocused = e.target;
        this.scrollIntoView(e.target);
      });

      // Mark body so CSS knows TV nav is active
      document.body.classList.add('tv-nav-ready');

      // Focus first element after page loads (helps TV remote)
      setTimeout(() => this.focusInitial(), 800);
    },

    makeElementsFocusable() {
      document.querySelectorAll(this.FOCUSABLE).forEach(el => {
        if (!el.hasAttribute('tabindex') && el.tagName !== 'A' && el.tagName !== 'BUTTON' && el.tagName !== 'INPUT' && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA') {
          el.setAttribute('tabindex', '0');
        }
      });
    },

    observeChanges() {
      const observer = new MutationObserver((mutations) => {
        let needsRescan = false;
        mutations.forEach(m => {
          if (m.addedNodes.length > 0) needsRescan = true;
        });
        if (needsRescan) {
          this.makeElementsFocusable();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    },

    focusInitial() {
      const active = document.activeElement;
      if (active && active !== document.body) return; // already focused
      // Try to focus the first card or nav link
      const first = document.querySelector('.card, .nav-link, .hero-btn, button');
      if (first) {
        try { first.focus({ preventScroll: false }); } catch (e) {}
      }
    },

    handleKey(e) {
      if (!this.enabled) return;

      // If user is typing in input/textarea, don't interfere
      const active = document.activeElement;
      const isTyping = active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.isContentEditable
      );

      const key = e.key;

      // ENTER / OK = click focused element
      if (key === 'Enter' && active && active !== document.body && !isTyping) {
        // Let native Enter work for links and buttons; only synthesize for other focusable elements
        if (active.tagName !== 'A' && active.tagName !== 'BUTTON' && active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA') {
          e.preventDefault();
          active.click();
        }
        return;
      }

      // BACK button (Escape or Browser Back)
      if (key === 'Escape' || key === 'GoBack' || key === 'BrowserBack') {
        // Close modals first
        const openModal = document.querySelector('.modal-overlay.active, .modal.active, .modal-overlay[style*="display: flex"]');
        if (openModal) {
          e.preventDefault();
          const closeBtn = openModal.querySelector('.modal-close, [data-close]');
          if (closeBtn) closeBtn.click();
          else openModal.classList.remove('active');
          return;
        }
      }

      // Arrow keys - spatial navigation
      if (isTyping) return; // arrows in inputs = cursor movement

      const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key);
      if (!isArrow) return;

      // Skip if focus is inside a horizontal scroll row and we're using left/right: allow native scroll
      // BUT we still do spatial nav to next card in that row, which is what the user wants

      e.preventDefault();
      this.moveFocus(key);
    },

    moveFocus(direction) {
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

      const candidates = Array.from(document.querySelectorAll(this.FOCUSABLE))
        .filter(el => el !== current && this.isVisible(el));

      let bestCandidate = null;
      let bestScore = Infinity;

      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      candidates.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elCenterX = rect.left + rect.width / 2;
        const elCenterY = rect.top + rect.height / 2;
        const dx = elCenterX - currentCenterX;
        const dy = elCenterY - currentCenterY;

        let valid = false;
        let primaryDist = 0;
        let perpDist = 0;

        switch (direction) {
          case 'ArrowRight':
            // Note: in RTL pages, visual "right" is actually lower x coordinate depending on dir attr
            // We use screen coordinates: right = positive dx
            if (dx > 5) {
              valid = true;
              primaryDist = dx;
              perpDist = Math.abs(dy);
            }
            break;
          case 'ArrowLeft':
            if (dx < -5) {
              valid = true;
              primaryDist = -dx;
              perpDist = Math.abs(dy);
            }
            break;
          case 'ArrowDown':
            if (dy > 5) {
              valid = true;
              primaryDist = dy;
              perpDist = Math.abs(dx);
            }
            break;
          case 'ArrowUp':
            if (dy < -5) {
              valid = true;
              primaryDist = -dy;
              perpDist = Math.abs(dx);
            }
            break;
        }

        if (!valid) return;

        // Heuristic: perpendicular distance matters more (we want elements roughly aligned)
        const score = primaryDist + perpDist * 2;
        if (score < bestScore) {
          bestScore = score;
          bestCandidate = el;
        }
      });

      if (bestCandidate) {
        try {
          bestCandidate.focus({ preventScroll: false });
        } catch (e) {}
      }
    },

    isVisible(el) {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      // Must be within or near the viewport (allow offscreen in horizontal rows)
      const style = window.getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false;
      return true;
    },

    scrollIntoView(el) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const viewportW = window.innerWidth;

      // Vertical scroll (page)
      if (rect.top < this.scrollPadding) {
        window.scrollBy({
          top: rect.top - this.scrollPadding,
          behavior: 'smooth'
        });
      } else if (rect.bottom > viewportH - this.scrollPadding) {
        window.scrollBy({
          top: rect.bottom - viewportH + this.scrollPadding,
          behavior: 'smooth'
        });
      }

      // Horizontal scroll (inside row-content carousels)
      const scrollContainer = el.closest('.row-content, .nf-episodes-list, .nf-seasons-tabs');
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        if (rect.left < containerRect.left + 20) {
          scrollContainer.scrollBy({
            left: rect.left - containerRect.left - 20,
            behavior: 'smooth'
          });
        } else if (rect.right > containerRect.right - 20) {
          scrollContainer.scrollBy({
            left: rect.right - containerRect.right + 20,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TVNav.init());
  } else {
    TVNav.init();
  }

  // Expose for debugging
  window.TVNav = TVNav;
})();
