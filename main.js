/* ========================================
   TRIDENT LEDGER — MAIN JS
   Improved build, Jul 28 2026. See CHANGES.md.
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Dynamic Footer Year ---
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ----------------------------------------
     Mobile Nav
     Closes on Escape, on outside click, and on
     link activation. Focus returns to the toggle
     so keyboard users don't get dropped.
     ---------------------------------------- */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggle && navLinks) {
    const setNav = (open, returnFocus) => {
      navLinks.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => {
      setNav(!navLinks.classList.contains('open'));
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setNav(false));
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) setNav(false, true);
    });

    document.addEventListener('click', e => {
      if (!navLinks.classList.contains('open')) return;
      if (!navLinks.contains(e.target) && !toggle.contains(e.target)) setNav(false);
    });
  }

  /* ----------------------------------------
     Scroll-Triggered Animations
     ---------------------------------------- */
  const scrollElements = document.querySelectorAll('.anim-scroll');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    scrollElements.forEach(el => el.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = Array.from(entry.target.parentElement.querySelectorAll('.anim-scroll'));
        const delay = Math.min(siblings.indexOf(entry.target), 6) * 80;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    scrollElements.forEach(el => observer.observe(el));
  }

  /* ----------------------------------------
     Smooth Scroll
     Moves focus to the destination so keyboard
     and screen reader users land where sighted
     users land, and keeps the URL shareable.
     ---------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return; // let the browser handle it rather than swallowing the click

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });

      if (history.pushState) history.pushState(null, '', href);

      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ----------------------------------------
     Header Elevation
     Class toggle instead of writing inline
     styles on every scroll event.
     ---------------------------------------- */
  const header = document.querySelector('.site-header');
  if (header) {
    let ticking = false;
    const update = () => {
      header.classList.toggle('is-scrolled', window.pageYOffset > 50);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ----------------------------------------
     Contact Form
     Validates with real messages, submits over
     fetch so the visitor stays on the page, and
     falls back to a normal POST if fetch fails.
     ---------------------------------------- */
  const form = document.querySelector('.contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const submitBtn = form.querySelector('.btn-submit');

    const showStatus = (msg, kind) => {
      if (!status) return;
      status.textContent = msg;
      status.classList.remove('is-success', 'is-error');
      status.classList.add('is-visible', kind === 'success' ? 'is-success' : 'is-error');
    };

    const setError = (input, msg) => {
      const slot = document.getElementById(input.id + '-error');
      if (msg) {
        input.setAttribute('aria-invalid', 'true');
        if (slot) { slot.textContent = msg; slot.hidden = false; }
      } else {
        input.removeAttribute('aria-invalid');
        if (slot) { slot.textContent = ''; slot.hidden = true; }
      }
      return !msg;
    };

    const validateField = (input) => {
      const value = input.value.trim();
      if (!value) {
        return setError(input, input.id === 'email'
          ? 'Please enter your email so we can reply.'
          : 'Please enter your name.');
      }
      if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        return setError(input, 'That email address doesn’t look right — mind checking it?');
      }
      return setError(input, null);
    };

    const required = ['name', 'email']
      .map(id => form.querySelector('#' + id))
      .filter(Boolean);

    // Clear an error as soon as the visitor fixes it
    required.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.hasAttribute('aria-invalid')) validateField(input);
      });
    });

    form.addEventListener('submit', async (e) => {
      const results = required.map(validateField);

      if (results.includes(false)) {
        e.preventDefault();
        const firstBad = required.find(i => i.hasAttribute('aria-invalid'));
        if (firstBad) firstBad.focus();
        showStatus('Please fix the highlighted fields and try again.', 'error');
        return;
      }

      // No fetch support: let the browser do a normal POST to Formspree
      if (!window.fetch) return;

      e.preventDefault();
      if (submitBtn) {
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.textContent = 'Sending…';
      }

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });

        if (!res.ok) throw new Error('Bad response');

        form.classList.add('is-sent');
        showStatus(
          'Thanks — your message is in. Ryan will get back to you within one business day. ' +
          'If it’s urgent, call (732) 322-7615.',
          'success'
        );
        if (status) {
          status.setAttribute('tabindex', '-1');
          status.focus({ preventScroll: true });
        }
        form.reset();
      } catch (err) {
        showStatus(
          'Something went wrong sending that. Please email ryan@tridentledger.com ' +
          'or call (732) 322-7615 and we’ll pick it up straight away.',
          'error'
        );
      } finally {
        if (submitBtn) {
          submitBtn.removeAttribute('aria-busy');
          submitBtn.textContent = 'Send Message';
        }
      }
    });
  }

});
