/* ========================================
   TRIDENT LEDGER — MAIN JS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Dynamic Footer Year ---
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Mobile Nav Toggle ---
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    // Close nav when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Scroll-Triggered Animations ---
  const scrollElements = document.querySelectorAll('.anim-scroll');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger siblings slightly
          const siblings = Array.from(entry.target.parentElement.querySelectorAll('.anim-scroll'));
          const siblingIndex = siblings.indexOf(entry.target);
          const delay = siblingIndex * 80;

          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);

          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    scrollElements.forEach(el => observer.observe(el));
  } else {
    // Fallback: show everything immediately
    scrollElements.forEach(el => el.classList.add('visible'));
  }

  // --- Smooth Scroll for Anchor Links (fallback for browsers without CSS smooth scroll) ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Header Background on Scroll ---
  const header = document.querySelector('.site-header');
  if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 50) {
        header.style.boxShadow = '0 1px 10px rgba(0,0,0,0.05)';
      } else {
        header.style.boxShadow = 'none';
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // --- Simple Form Validation Feedback ---
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      let valid = true;

      [name, email].forEach(input => {
        if (input && !input.value.trim()) {
          input.style.borderColor = '#c0392b';
          valid = false;
        } else if (input) {
          input.style.borderColor = '';
        }
      });

      if (email && email.value && !email.value.includes('@')) {
        email.style.borderColor = '#c0392b';
        valid = false;
      }

      if (!valid) {
        e.preventDefault();
      }
    });
  }

});
