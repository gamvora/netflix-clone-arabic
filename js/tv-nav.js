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

      // Restore focus when modals close or dynamic DOM rerenders happen
      this.observeModalAndFocusState();

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

    observeModalAndFocusState() {
      const focusableSelector = this.FOCUSABLE;
      const observer = new MutationObserver(() => {
        const active = document.activeElement;
        const hasOpenModal = !!document.querySelector('.modal-overlay.active, .modal.active, .trailer-modal.active, .srv-picker-modal');
        if (hasOpenModal) {
          const modalFocusable = document.querySelector('.modal.active button, .modal.active a, .modal.active [tabindex], .trailer-modal.active button, .trailer-modal.active a, .trailer-modal.active [tabindex], .srv-picker-modal button, .srv-picker-modal a, .srv-picker-modal [tabindex]');
          if (modalFocusable && (!active || active === document.body)) {
            try { modalFocusable.focus(); } catch (e) {}
          }
          return;
        }

        if (!active || active === document.body || !document.contains(active)) {
          if (this.lastFocused && document.contains(this.lastFocused) && this.isVisible(this.lastFocused)) {
            try { this.lastFocused.focus(); return; } catch (e) {}
          }
          const first = document.querySelector(focusableSelector);
          if (first) {
            try { first.focus(); } catch (e) {}
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
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
        e.preventDefault();
        // Always trigger click for TV remote consistency (including buttons in modals/server picker)
        try { active.click(); } catch (_) {}
        return;
      }

      // BACK button (Escape / Android TV back key aliases / Browser back)
      if (
        key === 'Escape' ||
        key === 'GoBack' ||
        key === 'BrowserBack' ||
        key === 'Backspace' ||
        key === 'XF86Back'
      ) {
        const tag = active?.tagName;
        const isEditable = !!active && (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          active.isContentEditable
        );

        // Don't hijack Backspace while typing
        if (key === 'Backspace' && isEditable) return;

        // Close open UI layers first
        const openModal = document.querySelector('.srv-picker-modal, .trailer-modal.active, .modal-overlay.active, .modal.active, .modal-overlay[style*="display: flex"]');
        if (openModal) {
          e.preventDefault();
          const closeBtn = openModal.querySelector('.modal-close, .srv-picker-close, [data-close]');
          if (closeBtn) {
            closeBtn.click();
          } else {
            openModal.classList.remove('active');
            if (openModal.classList.contains('srv-picker-modal')) openModal.remove();
          }

          // restore focus to last valid element
          setTimeout(() => {
            if (this.lastFocused && document.contains(this.lastFocused)) {
              try { this.lastFocused.focus(); } catch (err) {}
            } else {
              this.focusInitial();
            }
          }, 30);
          return;
        }

        // Close mobile nav drawer
        const navLinks = document.querySelector('.nav-links.active');
        if (navLinks) {
          e.preventDefault();
          navLinks.classList.remove('active');
          const menuBtn = document.querySelector('.menu-toggle');
          if (menuBtn) {
            try { menuBtn.focus(); } catch (err) {}
          }
          return;
        }
      }

      // Arrow keys - spatial navigation
      if (isTyping) return; // arrows in inputs = cursor movement

      const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key);
      if (!isArrow) return;

      // If a modal/sheet is open, keep navigation trapped inside it
      const activeLayer =
        document.querySelector('.srv-picker-modal') ||
        document.querySelector('.trailer-modal.active') ||
        document.querySelector('.modal.active') ||
        document.querySelector('.modal-overlay.active');

      e.preventDefault();
      this.moveFocus(key, activeLayer || null);
    },

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

      const root = scopeEl || document;
      const candidates = Array.from(root.querySelectorAll(this.FOCUSABLE))
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
