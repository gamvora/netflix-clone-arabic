/**
 * NETFLIXY Intro Animation
 * - Plays the "ta-dum" sound (WebAudio synthesized)
 * - Runs the N animation
 * - Redirects to profiles.html (or destination from query param) after ~5s
 * - Supports Skip button + Mute button
 */

(function () {
  'use strict';

  const INTRO_DURATION_MS = 5000; // total animation length
  const DEST_DEFAULT = 'profiles.html';
  const LS_MUTE_KEY = 'netflixy_intro_muted';
  const LS_SEEN_KEY = 'netflixy_intro_seen';
  const SS_SESSION_KEY = 'netflixy_intro_session';

  // ---------- Mark intro as seen IMMEDIATELY ----------
  // This ensures the intro never plays again, even if user refreshes / navigates back.
  // We mark it on page load — not after animation — so it's persistent from first visit.
  try {
    localStorage.setItem(LS_SEEN_KEY, '1');
    sessionStorage.setItem(SS_SESSION_KEY, '1');
  } catch (_) {}

  // ---------- Elements ----------
  const container = document.getElementById('introContainer');
  const skipBtn = document.getElementById('skipBtn');
  const muteBtn = document.getElementById('muteBtn');
  const iconSound = muteBtn.querySelector('.icon-sound');
  const iconMuted = muteBtn.querySelector('.icon-muted');

  // ---------- State ----------
  let muted = localStorage.getItem(LS_MUTE_KEY) === '1';
  let redirected = false;
  let audioCtx = null;
  let soundPlayed = false;

  updateMuteIcon();

  // ---------- Get destination from URL (?next=index.html) ----------
  function getDestination() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && /^[a-zA-Z0-9_\-\.]+\.html(\?.*)?$/.test(next)) {
      return next;
    }
    return DEST_DEFAULT;
  }

  // ---------- Ta-Dum sound (synthesized with WebAudio) ----------
  // Recreates Netflix's famous two-note "ta-dum" using oscillators + envelope
  function playTaDum() {
    if (muted || soundPlayed) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();

      // If context is suspended (autoplay policy), try to resume
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const now = audioCtx.currentTime;
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(audioCtx.destination);

      // Low-pass filter for warmth
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;
      filter.connect(masterGain);

      // ---- First note: "ta" (C3 ~ 130Hz thump) ----
      createNote(82, now + 0.0, 0.18, 'sine', filter);       // E2 low
      createNote(164, now + 0.0, 0.18, 'triangle', filter);  // E3
      createNote(329, now + 0.02, 0.15, 'sine', filter, 0.6); // E4 harmonic

      // ---- Second note: "dum" (lower, sustained) ----
      createNote(55, now + 0.25, 0.7, 'sine', filter, 1.2);   // A1
      createNote(110, now + 0.25, 0.7, 'triangle', filter);   // A2
      createNote(220, now + 0.27, 0.6, 'sine', filter, 0.5);  // A3

      // Kick/percussion layer for punch
      addKick(now + 0.0, filter);
      addKick(now + 0.25, filter);

      soundPlayed = true;
    } catch (err) {
      console.warn('[intro] Audio playback failed:', err);
    }
  }

  function createNote(freq, startTime, duration, type, destination, gainFactor = 1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type || 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.5 * gainFactor, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  function addKick(startTime, destination) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(35, startTime + 0.1);

    gain.gain.setValueAtTime(0.8, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + 0.22);
  }

  // ---------- Mute toggle ----------
  function updateMuteIcon() {
    if (muted) {
      iconSound.style.display = 'none';
      iconMuted.style.display = 'block';
      muteBtn.title = 'الصوت مكتوم';
    } else {
      iconSound.style.display = 'block';
      iconMuted.style.display = 'none';
      muteBtn.title = 'كتم الصوت';
    }
  }

  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    muted = !muted;
    localStorage.setItem(LS_MUTE_KEY, muted ? '1' : '0');
    updateMuteIcon();
  });

  // ---------- Skip ----------
  skipBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    goToDestination();
  });

  // ---------- Autoplay redirect ----------
  function goToDestination() {
    if (redirected) return;
    redirected = true;

    // Mark intro as seen
    try { localStorage.setItem(LS_SEEN_KEY, '1'); } catch (_) {}

    container.classList.add('fading-out');

    setTimeout(() => {
      window.location.replace(getDestination());
    }, 500);
  }

  // ---------- Click anywhere to start sound (browsers require user gesture) ----------
  // We also try to autoplay via silent audio unlock
  function attemptAutoplay() {
    // Try immediately
    playTaDum();

    // If sound didn't play (context suspended), play on first interaction
    if (!soundPlayed) {
      const unlock = () => {
        playTaDum();
        document.removeEventListener('click', unlock);
        document.removeEventListener('keydown', unlock);
        document.removeEventListener('touchstart', unlock);
      };
      document.addEventListener('click', unlock, { once: true });
      document.addEventListener('keydown', unlock, { once: true });
      document.addEventListener('touchstart', unlock, { once: true });
    }
  }

  // Start sound slightly after the N begins appearing (~800ms in)
  setTimeout(attemptAutoplay, 900);

  // Auto-redirect after full animation
  const redirectTimer = setTimeout(goToDestination, INTRO_DURATION_MS);

  // Allow Enter/Space/Escape to skip
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      clearTimeout(redirectTimer);
      goToDestination();
    } else if (e.key.toLowerCase() === 'm') {
      muteBtn.click();
    }
  });

  // Safety: if something goes wrong, make sure we still redirect
  window.addEventListener('error', () => {
    setTimeout(goToDestination, 1000);
  });
})();
