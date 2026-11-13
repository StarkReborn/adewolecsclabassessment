/**
 * main.js — shared interactions for all pages.
 *
 * Responsibilities:
 *   1. Toggle the mobile navigation with correct aria-expanded state.
 *   2. Mark the current page in the primary nav (aria-current="page").
 *   3. Set the current year in the footer.
 *
 * No frameworks. No build step.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    markActivePage();
    setYear();
  });

  /**
   * Mobile navigation toggle.
   * The button controls #primary-nav; the .is-open class controls visibility
   * via CSS. aria-expanded mirrors the state.
   */
  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      setNavOpen(!open);
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setNavOpen(false);
        toggle.focus();
      }
    });

    // Close when a nav link is clicked (useful on mobile)
    nav.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.tagName === 'A' && nav.classList.contains('is-open')) {
        setNavOpen(false);
      }
    });

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setNavOpen(false);
    });

    function setNavOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
    }
  }

  /**
   * Compare each nav link's href against the current pathname and set
   * aria-current="page" on the match. Works for "index.html" and "/" alike.
   */
  function markActivePage() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.site-nav a');
    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var target = href.split('/').pop();
      if (target === path) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /** Set the footer year. */
  function setYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }
})();