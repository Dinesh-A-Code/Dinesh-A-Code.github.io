/**
 * Dinesh — Software Developer Portfolio
 * Vanilla JS: intro, navigation, mobile menu, hero typewriter and tilt,
 * swinging ID badge, skill filter, live stats, form validation, scroll reveals.
 */

(function () {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EMAIL = 'adinesh09092005@gmail.com';

  /* ------------------------------------------------------------------
   * 1. Intro Preloader (once per session) → releases the hero entrance
   * ------------------------------------------------------------------ */
  function initIntro() {
    const INTRO_MS = 1700;
    let seen = false;

    try {
      seen = sessionStorage.getItem('intro-seen') === '1';
      sessionStorage.setItem('intro-seen', '1');
    } catch (error) {
      // Storage unavailable (private mode): the intro simply plays each time.
    }

    if (seen || reduceMotion) {
      root.classList.add('skip-intro', 'is-ready');
      return;
    }

    window.setTimeout(() => root.classList.add('is-ready'), INTRO_MS);
  }

  /* ------------------------------------------------------------------
   * 2. Header Scrolled State
   * ------------------------------------------------------------------ */
  function initHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ------------------------------------------------------------------
   * 3. Mobile Navigation Menu
   * ------------------------------------------------------------------ */
  function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('mobile-menu');
    const main = document.getElementById('main');
    const footer = document.querySelector('.site-footer');
    if (!toggle || !menu) return;

    let isOpen = false;

    function setOpen(open, { restoreFocus = true } = {}) {
      if (open === isOpen) return;
      isOpen = open;

      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      document.body.classList.toggle('menu-open', open);
      [main, footer].forEach((el) => el && (el.inert = open));

      if (open) {
        menu.hidden = false;
        requestAnimationFrame(() => menu.classList.add('is-open'));
        const firstLink = menu.querySelector('a');
        if (firstLink) firstLink.focus({ preventScroll: true });
      } else {
        menu.classList.remove('is-open');
        window.setTimeout(() => {
          if (!isOpen) menu.hidden = true;
        }, 400);
        if (restoreFocus) toggle.focus({ preventScroll: true });
      }
    }

    toggle.addEventListener('click', () => setOpen(!isOpen));

    menu.querySelectorAll('[data-menu-link]').forEach((link) => {
      link.addEventListener('click', () => setOpen(false, { restoreFocus: false }));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });

    // Leaving the mobile breakpoint closes the sheet so nothing stays inert.
    window.matchMedia('(min-width: 1101px)').addEventListener('change', (event) => {
      if (event.matches) setOpen(false, { restoreFocus: false });
    });
  }

  /* ------------------------------------------------------------------
   * 4. Active Navigation State Tracking
   * ------------------------------------------------------------------ */
  function initActiveNav() {
    const header = document.getElementById('site-header');
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const allLinks = Array.from(document.querySelectorAll('[data-nav-link]'));

    if (!sections.length || !allLinks.length) return;

    let manualOverrideId = null;
    let manualReleaseTimer = null;
    let currentActiveId = null;

    function setActive(id) {
      if (id === currentActiveId) return;
      currentActiveId = id;
      allLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-active', active);
        if (active) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    function recalcActive() {
      if (manualOverrideId) return;

      const probeLine = (header ? header.offsetHeight : 0) + 40;
      let active = sections[0];

      for (const section of sections) {
        if (section.getBoundingClientRect().top - probeLine <= 0) {
          active = section;
        } else {
          break;
        }
      }

      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10;
      if (atBottom) {
        active = sections[sections.length - 1];
      }

      setActive(active.id);
    }

    function holdManual() {
      window.clearTimeout(manualReleaseTimer);
      manualReleaseTimer = window.setTimeout(() => {
        manualOverrideId = null;
        recalcActive();
      }, 200);
    }

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          recalcActive();
          ticking = false;
        });
        ticking = true;
      }
      if (manualOverrideId) holdManual();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', recalcActive);

    allLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const id = (link.getAttribute('href') || '').slice(1);
        if (!id || !document.getElementById(id)) return;

        manualOverrideId = id;
        setActive(id);
        holdManual();
      });
    });

    recalcActive();
  }

  /* ------------------------------------------------------------------
   * 5. Hero Role Typewriter
   * ------------------------------------------------------------------ */
  function initTypewriter() {
    const el = document.getElementById('typed-role');
    if (!el || reduceMotion) return;

    const roles = (el.dataset.roles || '').split('|').filter(Boolean);
    if (roles.length < 2) return;

    const TYPE_MS = 65;
    const DELETE_MS = 34;
    const HOLD_MS = 1900;

    let roleIndex = 0;
    let length = roles[0].length;
    let deleting = true;

    function step() {
      const role = roles[roleIndex];
      length += deleting ? -1 : 1;
      el.textContent = role.slice(0, length);

      let delay = deleting ? DELETE_MS : TYPE_MS;
      if (!deleting && length === role.length) {
        deleting = true;
        delay = HOLD_MS;
      } else if (deleting && length === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        delay = 320;
      }

      window.setTimeout(step, delay);
    }

    window.setTimeout(step, HOLD_MS + 1600);
  }

  /* ------------------------------------------------------------------
   * 6. Hero Monitor Pointer Tilt
   * ------------------------------------------------------------------ */
  function initTilt() {
    const stage = document.querySelector('[data-tilt]');
    const target = stage && stage.querySelector('.tv');
    if (!target || reduceMotion || !finePointer) return;

    const MAX_DEG = 6;
    let frame = null;

    stage.addEventListener('pointermove', (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        target.style.setProperty('--tilt-y', `${(x * MAX_DEG * 2).toFixed(2)}deg`);
        target.style.setProperty('--tilt-x', `${(-y * MAX_DEG * 2).toFixed(2)}deg`);
        frame = null;
      });
    });

    stage.addEventListener('pointerleave', () => {
      target.style.setProperty('--tilt-x', '0deg');
      target.style.setProperty('--tilt-y', '0deg');
    });
  }

  /* ------------------------------------------------------------------
   * 6b. Hero Monitor Video (plays once per page load, then holds the cover)
   * ------------------------------------------------------------------ */
  function initHeroVideo() {
    const screen = document.querySelector('.tv-screen');
    const video = screen && screen.querySelector('video.tv-media');
    if (!video) return;

    const playBtn = screen.querySelector('.tv-play');
    const soundBtn = screen.querySelector('.tv-sound');
    const START_RATIO = 0.5; // screen must be at least half visible to start
    const STOP_RATIO = 0.25; // below this the viewer has scrolled away

    let attempted = false; // the single automatic start has been used
    let started = false;   // playback is running or pending
    let finished = false;  // played through or scrolled away: never starts again
    let inView = !('IntersectionObserver' in window);
    let viewObserver = null;
    let readyObserver = null;

    const showCover = () => screen.classList.remove('is-playing');

    const offerPlay = () => {
      if (playBtn && !finished) playBtn.hidden = false;
    };

    const syncSound = () => {
      if (!soundBtn) return;
      const on = !video.muted && video.volume > 0;
      soundBtn.setAttribute('aria-pressed', String(on));
      soundBtn.title = on ? 'Turn sound off' : 'Turn sound on';
    };

    // Back to the cover for the rest of this page visit.
    function finish() {
      if (finished) return;
      finished = true;
      showCover();
      video.pause();
      try {
        video.currentTime = 0;
      } catch (error) {
        // Nothing loaded yet: the position is already zero.
      }
      if (playBtn) playBtn.hidden = true;
      if (soundBtn) soundBtn.hidden = true;
      if (viewObserver) viewObserver.disconnect();
      if (readyObserver) readyObserver.disconnect();
    }

    function start() {
      if (finished) return;
      started = true;
      if (playBtn) playBtn.hidden = true;
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        // Autoplay refused: stay on the cover and let the viewer start it.
        attempt.catch(() => {
          started = false;
          showCover();
          offerPlay();
        });
      }
    }

    // One automatic start, once the intro has cleared and the screen is on view.
    function autoStart() {
      if (attempted || finished || !inView || !root.classList.contains('is-ready')) return;
      attempted = true;
      if (reduceMotion) {
        offerPlay();
        return;
      }
      start();
    }

    video.loop = false;
    video.muted = true; // always begin muted; sound is the viewer's choice
    syncSound();
    if (soundBtn) soundBtn.hidden = false;

    video.addEventListener('playing', () => {
      if (finished) {
        video.pause();
        return;
      }
      if (playBtn) playBtn.hidden = true;
      screen.classList.add('is-playing');
    });
    video.addEventListener('ended', finish);
    video.addEventListener('error', finish);
    video.addEventListener('pause', () => {
      // Paused by the browser mid-clip (e.g. power saving): offer to resume.
      if (finished || video.ended) return;
      started = false;
      showCover();
      offerPlay();
    });
    video.addEventListener('volumechange', syncSound);

    const source = video.querySelector('source');
    if (source) source.addEventListener('error', finish);

    if (playBtn) playBtn.addEventListener('click', start);
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        if (!video.muted && video.volume === 0) video.volume = 1;
        syncSound();
      });
    }

    if ('IntersectionObserver' in window) {
      viewObserver = new IntersectionObserver((entries) => {
        const ratio = entries[entries.length - 1].intersectionRatio;
        inView = ratio >= START_RATIO;
        if (started && ratio < STOP_RATIO) {
          finish();
        } else {
          autoStart();
        }
      }, { threshold: [0, STOP_RATIO, START_RATIO] });
      viewObserver.observe(screen);
    }

    if (!root.classList.contains('is-ready')) {
      readyObserver = new MutationObserver(() => {
        if (!root.classList.contains('is-ready')) return;
        readyObserver.disconnect();
        autoStart();
      });
      readyObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
    }

    autoStart();
  }

  /* ------------------------------------------------------------------
   * 7. Swinging ID Badge (damped pendulum, runs only while moving)
   * ------------------------------------------------------------------ */
  function initBadge() {
    const badge = document.getElementById('id-badge');
    if (!badge || reduceMotion) return;

    const STIFFNESS = 0.012;
    const DAMPING = 0.03;
    const MAX_VELOCITY = 1.6;

    let angle = 0;
    let velocity = 0;
    let frame = null;
    let lastX = null;

    function tick() {
      velocity += -STIFFNESS * angle - DAMPING * velocity;
      angle += velocity;

      if (Math.abs(angle) < 0.03 && Math.abs(velocity) < 0.03) {
        angle = 0;
        velocity = 0;
        frame = null;
      } else {
        frame = requestAnimationFrame(tick);
      }

      badge.style.setProperty('--swing', `${angle.toFixed(2)}deg`);
    }

    function push(amount) {
      velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity + amount));
      if (!frame) frame = requestAnimationFrame(tick);
    }

    badge.addEventListener('pointermove', (event) => {
      if (lastX !== null) push((lastX - event.clientX) * 0.02);
      lastX = event.clientX;
    });
    badge.addEventListener('pointerleave', () => { lastX = null; });
    badge.addEventListener('click', () => push(velocity >= 0 ? 1.1 : -1.1));

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          push(1.2);
          observer.disconnect();
        }
      }, { threshold: 0.4 });
      observer.observe(badge);
    }
  }

  /* ------------------------------------------------------------------
   * 8. Skill Category Filter
   * ------------------------------------------------------------------ */
  function initSkillFilter() {
    const chips = Array.from(document.querySelectorAll('.filter-chip'));
    const tiles = Array.from(document.querySelectorAll('.skill-tile'));
    if (!chips.length || !tiles.length) return;

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.filter;
        chips.forEach((other) => other.setAttribute('aria-pressed', String(other === chip)));
        tiles.forEach((tile) => {
          tile.classList.toggle('is-dim', filter !== 'all' && tile.dataset.cat !== filter);
        });
      });
    });
  }

  /* ------------------------------------------------------------------
   * 9. Live LeetCode & GitHub Stats + Animated Counter
   * ------------------------------------------------------------------ */
  function animateValue(element, end, duration) {
    if (reduceMotion || end === 0) {
      element.textContent = String(end);
      return;
    }
    const startTime = performance.now();

    function update(time) {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      element.textContent = String(Math.floor(end * eased));

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = String(end);
      }
    }

    requestAnimationFrame(update);
  }

  async function initLiveStats() {
    const statEls = Array.from(document.querySelectorAll('[data-stat]'));
    if (!statEls.length) return;

    // Fallback mirrors the values rendered in the HTML.
    let statsData = {
      leetcode: { solved: 181, easy: 86, medium: 73, hard: 22 },
      github: { repositories: 12, followers: 9 }
    };

    try {
      const response = await fetch('assets/data/stats.json');
      if (response.ok) {
        const json = await response.json();
        if (json?.leetcode) statsData.leetcode = json.leetcode;
        if (json?.github) statsData.github = json.github;
      }
    } catch (error) {
      // Fallback to initial stats
    }

    // Difficulty bar segments are sized by their share of solved problems.
    document.querySelectorAll('#difficulty-bar [data-share]').forEach((segment) => {
      const value = statsData.leetcode?.[segment.dataset.share];
      if (typeof value === 'number' && value > 0) segment.style.flexGrow = String(value);
    });

    function play(el) {
      const [section, field] = el.dataset.stat.split('-');
      const targetVal = statsData?.[section]?.[field];
      if (typeof targetVal === 'number') animateValue(el, targetVal, 1200);
    }

    if (!('IntersectionObserver' in window)) {
      statEls.forEach(play);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          play(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    statEls.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------
   * 10. Scroll Reveal Observer
   * ------------------------------------------------------------------ */
  function initScrollReveal() {
    const revealElements = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!revealElements.length) return;

    const STAGGER_MS = 70;
    const SETTLE_MS = 900;

    document.querySelectorAll('[data-stagger]').forEach((group) => {
      Array.from(group.children).forEach((child, index) => {
        // Cap the cascade so long grids never feel slow.
        child.style.setProperty('--reveal-delay', `${Math.min(index, 8) * STAGGER_MS}ms`);
      });
    });

    function reveal(el) {
      el.classList.add('is-revealed');
      const delay = parseFloat(el.style.getPropertyValue('--reveal-delay')) || 0;
      // Hand the element back to its own hover transitions once it has settled.
      window.setTimeout(() => {
        el.removeAttribute('data-reveal');
        el.style.removeProperty('--reveal-delay');
      }, SETTLE_MS + delay);
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    revealElements.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------
   * 11. Contact Form Validation
   * ------------------------------------------------------------------ */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    const messageField = document.getElementById('message');
    const status = document.getElementById('form-status');

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setError(field, message) {
      const wrapper = field.closest('.form-group');
      const errorEl = document.getElementById(`${field.id}-error`);
      if (errorEl) errorEl.textContent = message;
      if (wrapper) wrapper.classList.toggle('has-error', Boolean(message));
      field.setAttribute('aria-invalid', String(Boolean(message)));
      return !message;
    }

    function setStatus(message, state) {
      status.textContent = message;
      status.classList.toggle('is-error', state === 'error');
      status.classList.toggle('is-success', state === 'success');
    }

    function validateName() {
      return setError(nameField, nameField.value.trim() ? '' : 'Please enter your name.');
    }

    function validateEmail() {
      const value = emailField.value.trim();
      if (!value) return setError(emailField, 'Please enter your email address.');
      if (!emailPattern.test(value)) return setError(emailField, 'Please enter a valid email address.');
      return setError(emailField, '');
    }

    function validateMessage() {
      const value = messageField.value.trim();
      if (!value) return setError(messageField, 'Please enter your message.');
      if (value.length < 10) return setError(messageField, 'Message should be at least 10 characters.');
      return setError(messageField, '');
    }

    nameField.addEventListener('blur', validateName);
    emailField.addEventListener('blur', validateEmail);
    messageField.addEventListener('blur', validateMessage);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const isNameValid = validateName();
      const isEmailValid = validateEmail();
      const isMessageValid = validateMessage();

      if (!isNameValid || !isEmailValid || !isMessageValid) {
        setStatus('Please review and fill the required fields.', 'error');
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      setStatus('Preparing email draft...', 'success');

      const name = nameField.value.trim();
      const mailtoSubject = encodeURIComponent(`Portfolio Inquiry from ${name}`);
      const mailtoBody = encodeURIComponent(
        `${messageField.value.trim()}\n\n---\nFrom: ${name} (${emailField.value.trim()})`
      );

      window.setTimeout(() => {
        window.location.href = `mailto:${EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;
        setStatus(`Email client opened! You can also contact ${EMAIL} directly.`, 'success');
        form.reset();
      }, 500);
    });
  }

  /* ------------------------------------------------------------------
   * 12. Copy Email Utility
   * ------------------------------------------------------------------ */
  function initCopyEmail() {
    document.querySelectorAll('[data-copy-email]').forEach((btn) => {
      btn.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
          await navigator.clipboard.writeText(EMAIL);
          const valEl = btn.querySelector('.contact-method-val');
          if (valEl && !valEl.classList.contains('is-copied')) {
            const original = valEl.textContent;
            valEl.textContent = 'Copied to Clipboard! ✓';
            valEl.classList.add('is-copied');
            window.setTimeout(() => {
              valEl.textContent = original;
              valEl.classList.remove('is-copied');
            }, 2500);
          }
        } catch (error) {
          window.location.href = `mailto:${EMAIL}`;
        }
      });
    });
  }

  /* ------------------------------------------------------------------
   * 13. Initialization
   * ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    initIntro();
    initHeader();
    initMobileMenu();
    initActiveNav();
    initTypewriter();
    initTilt();
    initHeroVideo();
    initBadge();
    initSkillFilter();
    initLiveStats();
    initScrollReveal();
    initContactForm();
    initCopyEmail();
  });
})();
