/**
 * NETFLIXY - Profiles Manager
 * Handles all profile CRUD operations + avatar gallery + PIN lock.
 * Storage:
 *   netflixy_profiles         - Array of profile objects
 *   netflixy_active_profile   - ID of currently selected profile
 *   netflixy_intro_seen       - '1' once intro has been played
 */

const ProfilesManager = (function () {
  'use strict';

  const LS_PROFILES = 'netflixy_profiles';
  const LS_ACTIVE = 'netflixy_active_profile';
  const LS_INTRO_SEEN = 'netflixy_intro_seen';
  const MAX_PROFILES = 5;

  /* ====================================================================
     AVATAR GALLERY — 28 Netflix-style character avatars
     Uses DiceBear API (free, reliable, SVG, no key required).
     Mix of heroes, villains, kids, robots, fantasy characters.
     ==================================================================== */
  const AVATAR_GALLERY = [
    // ===== HEROES (avataaars) =====
    { id: 'av1',  url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=e50914', label: 'البطل' },
    { id: 'av2',  url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ff9800', label: 'لونا' },
    { id: 'av3',  url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=4caf50', label: 'ماكس' },
    { id: 'av4',  url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zara&backgroundColor=9c27b0', label: 'زارا' },
    { id: 'av5',  url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar&backgroundColor=00acc1', label: 'عمر' },
    { id: 'av6',  url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lina&backgroundColor=ec407a', label: 'لينا' },

    // ===== COOL PERSONAS =====
    { id: 'av7',  url: 'https://api.dicebear.com/7.x/personas/svg?seed=Nova&backgroundColor=e50914', label: 'نوفا' },
    { id: 'av8',  url: 'https://api.dicebear.com/7.x/personas/svg?seed=Leo&backgroundColor=00bcd4', label: 'ليو' },
    { id: 'av9',  url: 'https://api.dicebear.com/7.x/personas/svg?seed=Mia&backgroundColor=f06292', label: 'ميا' },
    { id: 'av10', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Kai&backgroundColor=ffc107', label: 'كاي' },

    // ===== ROBOTS (great for kids) =====
    { id: 'av11', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=RoboAlpha&backgroundColor=1976d2', label: 'روبو ألفا' },
    { id: 'av12', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=RoboRed&backgroundColor=d32f2f', label: 'روبو أحمر' },
    { id: 'av13', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=RoboGreen&backgroundColor=388e3c', label: 'روبو أخضر' },
    { id: 'av14', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=RoboPurple&backgroundColor=7b1fa2', label: 'روبو بنفسجي' },

    // ===== FANTASY (adventurer) =====
    { id: 'av15', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Knight&backgroundColor=e50914', label: 'الفارس' },
    { id: 'av16', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mage&backgroundColor=3f51b5', label: 'الساحر' },
    { id: 'av17', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Warrior&backgroundColor=ff6f00', label: 'المحارب' },
    { id: 'av18', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ranger&backgroundColor=00695c', label: 'الرامي' },

    // ===== LORELEI — soft cute style =====
    { id: 'av19', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Aria&backgroundColor=ff5722', label: 'آريا' },
    { id: 'av20', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sam&backgroundColor=009688', label: 'سام' },
    { id: 'av21', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Yasmin&backgroundColor=c2185b', label: 'ياسمين' },

    // ===== BIG SMILE — kid-friendly =====
    { id: 'av22', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=KidHappy&backgroundColor=ffeb3b', label: 'طفل مبتسم' },
    { id: 'av23', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=KidBrave&backgroundColor=ff1744', label: 'طفل شجاع' },
    { id: 'av24', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=KidStar&backgroundColor=2196f3', label: 'نجم صغير' },

    // ===== NOTIONISTS — stylish portraits =====
    { id: 'av25', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Cooper&backgroundColor=212121', label: 'كوبر' },
    { id: 'av26', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Jade&backgroundColor=8bc34a', label: 'جاد' },

    // ===== FUN EMOJI — playful =====
    { id: 'av27', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Smile&backgroundColor=ffeb3b', label: 'بسمة' },
    { id: 'av28', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool&backgroundColor=607d8b', label: 'هادئ' }
  ];

  function getDefaultAvatar() {
    return AVATAR_GALLERY[0].url;
  }

  /* ====================================================================
     STORAGE OPERATIONS
     ==================================================================== */
  function loadProfiles() {
    try {
      const raw = localStorage.getItem(LS_PROFILES);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function saveProfiles(profiles) {
    try {
      localStorage.setItem(LS_PROFILES, JSON.stringify(profiles));
      return true;
    } catch (err) {
      console.error('[profiles] saveProfiles failed:', err);
      return false;
    }
  }

  function generateId() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /* ====================================================================
     PUBLIC API
     ==================================================================== */

  function getAll() {
    return loadProfiles();
  }

  function getById(id) {
    return loadProfiles().find(p => p.id === id) || null;
  }

  function getActive() {
    const id = localStorage.getItem(LS_ACTIVE);
    if (!id) return null;
    return getById(id);
  }

  function setActive(id) {
    const p = getById(id);
    if (!p) return false;
    localStorage.setItem(LS_ACTIVE, id);
    return true;
  }

  function clearActive() {
    localStorage.removeItem(LS_ACTIVE);
  }

  function create({ name, avatar, pin, kids }) {
    const profiles = loadProfiles();
    if (profiles.length >= MAX_PROFILES) {
      return { success: false, error: `الحد الأقصى ${MAX_PROFILES} بروفايلات` };
    }
    if (!name || !name.trim()) {
      return { success: false, error: 'الاسم مطلوب' };
    }
    const newProfile = {
      id: generateId(),
      name: name.trim().slice(0, 20),
      avatar: avatar || getDefaultAvatar(),
      pin: pin && /^\d{4}$/.test(pin) ? pin : null,
      kids: !!kids,
      createdAt: Date.now()
    };
    profiles.push(newProfile);
    if (saveProfiles(profiles)) {
      return { success: true, profile: newProfile };
    }
    return { success: false, error: 'فشل الحفظ' };
  }

  function update(id, updates) {
    const profiles = loadProfiles();
    const idx = profiles.findIndex(p => p.id === id);
    if (idx === -1) return { success: false, error: 'البروفايل غير موجود' };

    const current = profiles[idx];
    const updated = {
      ...current,
      name: updates.name !== undefined ? (updates.name || '').trim().slice(0, 20) || current.name : current.name,
      avatar: updates.avatar !== undefined ? updates.avatar : current.avatar,
      kids: updates.kids !== undefined ? !!updates.kids : current.kids
    };

    // PIN handling (null/empty string removes, valid 4-digits sets)
    if (updates.pin !== undefined) {
      if (updates.pin === null || updates.pin === '') {
        updated.pin = null;
      } else if (/^\d{4}$/.test(updates.pin)) {
        updated.pin = updates.pin;
      }
    }

    profiles[idx] = updated;
    saveProfiles(profiles);
    return { success: true, profile: updated };
  }

  function remove(id) {
    let profiles = loadProfiles();
    const existed = profiles.some(p => p.id === id);
    if (!existed) return { success: false, error: 'البروفايل غير موجود' };
    profiles = profiles.filter(p => p.id !== id);
    saveProfiles(profiles);
    // If the deleted profile was active, clear it
    if (localStorage.getItem(LS_ACTIVE) === id) {
      clearActive();
    }
    return { success: true };
  }

  function canCreateMore() {
    return loadProfiles().length < MAX_PROFILES;
  }

  function verifyPin(id, pin) {
    const p = getById(id);
    if (!p) return false;
    if (!p.pin) return true; // no pin set, any call succeeds
    return p.pin === pin;
  }

  function hasPin(id) {
    const p = getById(id);
    return !!(p && p.pin);
  }

  function isIntroSeen() {
    return localStorage.getItem(LS_INTRO_SEEN) === '1';
  }

  function markIntroSeen() {
    localStorage.setItem(LS_INTRO_SEEN, '1');
  }

  function signOut() {
    clearActive();
  }

  return {
    AVATAR_GALLERY,
    MAX_PROFILES,
    getDefaultAvatar,
    getAll,
    getById,
    getActive,
    setActive,
    clearActive,
    create,
    update,
    remove,
    canCreateMore,
    verifyPin,
    hasPin,
    isIntroSeen,
    markIntroSeen,
    signOut
  };
})();

// Expose globally
window.ProfilesManager = ProfilesManager;
