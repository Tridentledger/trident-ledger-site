/* Trident Ledger — navigation, motion, and the Formspree contact form. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");
  var main = document.querySelector("main");
  var footer = document.querySelector(".site-footer");

  function setMenu(open, returnFocus) {
    if (!toggle || !navLinks) return;
    navLinks.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    var label = toggle.querySelector(".nav-toggle-label");
    if (label) label.textContent = open ? "Close" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    if (returnFocus) toggle.focus();
    if (open) {
      var first = navLinks.querySelector("a");
      if (first) first.focus();
    }
  }

  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      setMenu(!navLinks.classList.contains("is-open"));
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });

    document.addEventListener("keydown", function (e) {
      if (!navLinks.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        setMenu(false, true);
        return;
      }
      if (e.key !== "Tab") return;
      var items = [toggle].concat(Array.prototype.slice.call(navLinks.querySelectorAll("a")));
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1080 && navLinks.classList.contains("is-open")) setMenu(false);
    });
  }

  if (header) {
    var ticking = false;
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
    onScroll();
  }

  var hero = document.querySelector(".hero");
  if (hero && !reduce && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", function (e) {
      var rect = hero.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty("--mx", x.toFixed(1) + "%");
      hero.style.setProperty("--my", y.toFixed(1) + "%");
    }, { passive: true });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
      if (history.pushState) history.pushState(null, "", href);
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  var sections = ["services", "who", "how-it-works", "about", "technology", "faq", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[href^='#']"));

  if ("IntersectionObserver" in window && sections.length) {
    var currentId = "";
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) currentId = entry.target.id;
      });
      navAnchors.forEach(function (link) {
        var on = link.getAttribute("href") === "#" + currentId;
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 });
    sections.forEach(function (section) { spy.observe(section); });
  }

  if (!reduce && "IntersectionObserver" in window) {
    var reveals = document.querySelectorAll(".reveal");
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        seen.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { seen.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  var form = document.querySelector(".contact-form");
  if (!form) return;

  var status = form.querySelector(".form-status");
  var submitBtn = form.querySelector(".btn-submit");

  function showStatus(message, kind) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("is-success", "is-error");
    status.classList.add(kind === "success" ? "is-success" : "is-error");
  }

  function setError(input, message) {
    var slot = document.getElementById(input.id + "-error");
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (slot) {
        slot.textContent = message;
        slot.hidden = false;
      }
      return false;
    }
    input.removeAttribute("aria-invalid");
    if (slot) {
      slot.textContent = "";
      slot.hidden = true;
    }
    return true;
  }

  function validateField(input) {
    var value = input.value.trim();
    if (!value) {
      return setError(input, input.id === "email"
        ? "Please enter your email so we can reply."
        : "Please enter your name.");
    }
    if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return setError(input, "That email address doesn’t look right — mind checking it?");
    }
    return setError(input, "");
  }

  var required = ["name", "email"]
    .map(function (id) { return form.querySelector("#" + id); })
    .filter(Boolean);

  required.forEach(function (input) {
    input.addEventListener("blur", function () { validateField(input); });
    input.addEventListener("input", function () {
      if (input.hasAttribute("aria-invalid")) validateField(input);
    });
  });

  form.addEventListener("submit", function (e) {
    var results = required.map(validateField);
    if (results.indexOf(false) !== -1) {
      e.preventDefault();
      var firstBad = required.filter(function (input) { return input.hasAttribute("aria-invalid"); })[0];
      if (firstBad) firstBad.focus();
      showStatus("Please fix the highlighted fields and try again.", "error");
      return;
    }

    if (!window.fetch) return;

    e.preventDefault();
    if (submitBtn) {
      submitBtn.setAttribute("aria-busy", "true");
      submitBtn.textContent = "Sending…";
    }

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    }).then(function (res) {
      if (!res.ok) throw new Error("Bad response");
      form.classList.add("is-sent");
      showStatus(
        "Thanks — your message is in. Ryan will get back to you within one business day. If it’s urgent, call (732) 322-7615.",
        "success"
      );
      if (status) {
        status.setAttribute("tabindex", "-1");
        status.focus({ preventScroll: true });
      }
      form.reset();
    }).catch(function () {
      showStatus(
        "Something went wrong sending that. Please email ryan@tridentledger.com or call (732) 322-7615 and we’ll pick it up straight away.",
        "error"
      );
    }).then(function () {
      if (submitBtn) {
        submitBtn.removeAttribute("aria-busy");
        submitBtn.textContent = "Send Message";
      }
    });
  });
})();
