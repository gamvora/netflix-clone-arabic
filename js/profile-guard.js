/**
 * NETFLIXY Profile Guard
 * Include this on every page that requires an active profile.
 * If no profile is active:
 *   - If intro hasn't been seen → redirect to intro.html?next=<current>
 *   - Otherwise → redirect to profiles.html
 *
 * Also exposes helpers on window.ProfileGuard for pages that need the active profile.
 */

(function () {
  'use strict';

  // Storage keys (must match profiles.js)
  const LS_PROFILES = 'netflixy_profiles';
  const LS_ACTIVE = 'netflixy_active_profile';
  const LS_INTRO_SEEN = 'netflixy_intro_seen';

  function getProfiles() {
    try {
      const raw = localStorage.getItem(LS_PROFILES);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function getActiveProfile() {
    const id = localStorage.getItem(LS_ACTIVE);
    if (!id) return null;
    return getProfiles().find(p => p.id === id) || null;
  }

  function currentPath() {
    // Path relative to site root, e.g. "index.html"
    const p = window.location.pathname.split('/').pop() || 'index.html';
    return p + (window.location.search || '');
  }

  function redirectToIntroOrProfiles() {
    const introSeen = localStorage.getItem(LS_INTRO_SEEN) === '1';
    const next = encodeURIComponent(currentPath());
    if (!introSeen) {
      window.location.replace('intro.html?next=' + encodeURIComponent('profiles.html'));
    } else {
      window.location.replace('profiles.html?next=' + next);
    }
  }

  function enforceProfile() {
    const active = getActiveProfile();
    if (!active) {
      redirectToIntroOrProfiles();
      return false;
    }
    return true;
  }

  /* ====================================================================
     NAVBAR PROFILE DROPDOWN
     Injects profile avatar + dropdown menu into existing nav
     ==================================================================== */
  function enhanceNavbar() {
    const profile = getActiveProfile();
    if (!profile) return;

    // Try common selectors used in the site
    const navProfile = document.querySelector('.nav-profile, .nav-avatar, .user-profile');
    if (!navProfile) return;

    // Replace with Netflixy-style dropdown
    navProfile.innerHTML = `
      <button class="np-btn" aria-label="حساب ${escapeHtml(profile.name)}" aria-haspopup="true">
        <img src="${escapeAttr(profile.avatar)}" alt="${escapeAttr(profile.name)}" class="np-avatar-img" onerror="this.style.display='none'">
        <span class="np-caret" aria-hidden="true">▾</span>
      </button>
      <div class="np-menu" role="menu" aria-hidden="true">
        <div class="np-menu-header">
          <img src="${escapeAttr(profile.avatar)}" alt="" class="np-menu-avatar">
          <div class="np-menu-name">${escapeHtml(profile.name)}${profile.kids ? ' <span class="np-kids-badge">أطفال</span>' : ''}</div>
        </div>

        <button class="np-menu-item" data-action="switch" role="menuitem">
          <i class="fas fa-exchange-alt"></i>
          <span>تبديل البروفايل</span>
        </button>

        <button class="np-menu-item" data-action="manage" role="menuitem">
          <i class="fas fa-user-edit"></i>
          <span>إدارة البروفايلات</span>
        </button>

        <button class="np-menu-item" data-action="mylist" role="menuitem">
          <i class="fas fa-heart"></i>
          <span>قائمتي</span>
        </button>

        <div class="np-menu-divider"></div>

        <button class="np-menu-item danger" data-action="signout" role="menuitem">
          <i class="fas fa-sign-out-alt"></i>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    `;

    // Make parent position relative if not already
    const cs = window.getComputedStyle(navProfile);
    if (cs.position === 'static') navProfile.style.position = 'relative';

    const btn = navProfile.querySelector('.np-btn');
    const menu = navProfile.querySelector('.np-menu');

    function closeMenu() {
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      navProfile.classList.remove('np-active');
    }
    function openMenu() {
      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
      navProfile.classList.add('np-active');
    }
    function toggleMenu(e) {
      e.preventDefault();
      e.stopPropagation();
      if (menu.classList.contains('open')) closeMenu(); else openMenu();
    }

    // Click the avatar to toggle (works on all devices including mobile)
    btn.addEventListener('click', toggleMenu);

    // Prevent clicks INSIDE the menu from bubbling up to document (would close it)
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = e.target.closest('.np-menu-item');
      if (!item) return;
      const action = item.dataset.action;

      switch (action) {
        case 'switch':
          window.location.href = 'profiles.html';
          break;
        case 'manage':
          window.location.href = 'profiles.html?view=manage';
          break;
        case 'mylist':
          window.location.href = 'mylist.html';
          break;
        case 'signout':
          localStorage.removeItem(LS_ACTIVE);
          window.location.href = 'profiles.html';
          break;
      }
      closeMenu();
    });

    // Close ONLY when clicking outside the entire profile area (avatar + menu)
    document.addEventListener('click', (e) => {
      if (!navProfile.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/`/g, '&#96;');
  }

  /* ====================================================================
     INJECT NAVBAR DROPDOWN STYLES (once)
     ==================================================================== */
  function injectNavStyles() {
    if (document.getElementById('np-styles')) return;
    const style = document.createElement('style');
    style.id = 'np-styles';
    style.textContent = `
      /* ============ NETFLIXY Profile Dropdown — Clear & Bold ============ */
      .nav-profile, .nav-avatar, .user-profile {
        position: relative !important;
        display: inline-flex;
        align-items: center;
      }

      .np-btn {
        background: transparent;
        border: 2px solid transparent;
        padding: 2px;
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #fff;
        font-family: inherit;
        transition: border-color 0.2s ease, background 0.2s ease;
      }
      .np-btn:hover,
      .np-btn:focus {
        border-color: rgba(255,255,255,0.3);
        background: rgba(255,255,255,0.05);
        outline: none;
      }
      .np-avatar-img {
        width: 38px;
        height: 38px;
        border-radius: 6px;
        object-fit: cover;
        background: linear-gradient(135deg, #e50914, #b20710);
        display: block;
        transition: transform 0.2s ease;
      }
      .np-btn:hover .np-avatar-img { transform: scale(1.08); }
      .np-caret {
        font-size: 11px;
        color: #fff;
        transition: transform 0.25s ease;
        display: inline-block;
      }
      .np-menu.open + .np-btn .np-caret,
      .np-btn.active .np-caret { transform: rotate(180deg); }

      /* ---------- Dropdown panel ---------- */
      .np-menu {
        position: absolute;
        top: calc(100% + 14px);
        /* Profile avatar is at LEFT edge of navbar in RTL,
           so align menu's LEFT edge with button and extend RIGHT */
        left: 0;
        right: auto;
        min-width: 260px;
        max-width: 300px;
        background: #0b0b0b;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 10px;
        box-shadow:
          0 20px 60px rgba(0,0,0,0.9),
          0 0 0 1px rgba(0,0,0,0.5);
        padding: 10px 0;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translateY(-8px) scale(0.96);
        transform-origin: top left;
        transition:
          opacity 0.2s ease,
          transform 0.2s ease,
          visibility 0s linear 0.2s;
        z-index: 99999;
        direction: rtl;
        text-align: right;
        overflow: hidden;
      }
      .np-menu.open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translateY(0) scale(1);
        transition:
          opacity 0.2s ease,
          transform 0.2s ease,
          visibility 0s linear 0s;
      }

      /* arrow pointing up — above left edge */
      .np-menu::before {
        content: '';
        position: absolute;
        top: -7px;
        left: 16px;
        right: auto;
        width: 12px;
        height: 12px;
        background: #0b0b0b;
        border-left: 1px solid rgba(255,255,255,0.18);
        border-top: 1px solid rgba(255,255,255,0.18);
        transform: rotate(45deg);
      }

      /* ---------- Header ---------- */
      .np-menu-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        margin-bottom: 8px;
        background: linear-gradient(180deg, rgba(229,9,20,0.08), transparent);
      }
      .np-menu-avatar {
        width: 44px;
        height: 44px;
        border-radius: 6px;
        background: linear-gradient(135deg, #e50914, #b20710);
        object-fit: cover;
        flex-shrink: 0;
      }
      .np-menu-name {
        font-weight: 700;
        font-size: 15px;
        color: #fff;
        line-height: 1.3;
        word-break: break-word;
      }
      .np-kids-badge {
        display: inline-block;
        background: #00b3ff;
        color: #fff;
        font-size: 10px;
        padding: 2px 7px;
        border-radius: 4px;
        margin-right: 6px;
        margin-left: 0;
        font-weight: 700;
        vertical-align: middle;
      }

      /* ---------- Menu items ---------- */
      .np-menu-item {
        width: 100%;
        background: transparent;
        border: none;
        color: #fff;
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        text-align: right;
        padding: 12px 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 14px;
        transition: background 0.15s ease, color 0.15s ease, padding 0.15s ease;
        direction: rtl;
      }
      .np-menu-item:hover,
      .np-menu-item:focus {
        background: rgba(229,9,20,0.25);
        color: #fff;
        outline: none;
        padding-right: 22px;
      }
      .np-menu-item i {
        width: 20px;
        text-align: center;
        font-size: 15px;
        color: #e50914;
        flex-shrink: 0;
      }
      .np-menu-item span {
        flex: 1;
      }
      .np-menu-item.danger {
        color: #ff6b6b;
      }
      .np-menu-item.danger i {
        color: #ff6b6b;
      }
      .np-menu-item.danger:hover,
      .np-menu-item.danger:focus {
        background: rgba(229,9,20,0.4);
        color: #fff;
      }
      .np-menu-item.danger:hover i {
        color: #fff;
      }

      .np-menu-divider {
        height: 1px;
        background: rgba(255,255,255,0.1);
        margin: 8px 0;
      }

      /* ---------- Mobile responsive ---------- */
      @media (max-width: 600px) {
        .nav-profile, .nav-avatar, .user-profile {
          position: static !important;
        }
        .np-menu {
          position: fixed;
          left: 12px !important;
          right: 12px !important;
          top: 72px !important;
          bottom: auto !important;
          width: auto;
          max-width: none;
          min-width: 0;
          max-height: calc(100vh - 92px);
          overflow-y: auto;
          border-radius: 12px;
          transform: translateY(-8px) scale(0.98);
          transform-origin: top center;
          padding: 10px 0 12px;
          z-index: 100000;
        }
        .np-menu.open {
          transform: translateY(0) scale(1);
        }
        .np-menu::before {
          display: none;
        }
        .np-menu-item {
          padding: 13px 18px;
          font-size: 14px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ====================================================================
     INIT
     ==================================================================== */
  // Run guard immediately (before DOMContentLoaded to prevent flash)
  if (!enforceProfile()) return;

  // Enhance navbar once DOM is ready
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }
  onReady(() => {
    injectNavStyles();
    enhanceNavbar();
  });

  // Public API
  window.ProfileGuard = {
    getActive: getActiveProfile,
    getProfiles,
    enforce: enforceProfile,
    enhanceNavbar
  };
})();
