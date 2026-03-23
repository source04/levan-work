(function () {
  "use strict";

  var BREAKPOINT_MAX = 959;
  var RESIZE_TICK_MS = 50;
  var rafId = null;

  function isStackedLayout() {
    return window.matchMedia("(max-width: " + BREAKPOINT_MAX + "px)").matches;
  }

  function scrollToTopSmooth() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setAppViewportHeight() {
    var height = window.innerHeight;
    if (window.visualViewport && window.visualViewport.height) {
      height = window.visualViewport.height;
    }
    document.documentElement.style.setProperty("--app-height", height + "px");
  }

  function queueViewportHeightUpdate() {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(function () {
      rafId = null;
      setAppViewportHeight();
    });
  }

  function init() {
    var logo = document.querySelector(".logo");
    setAppViewportHeight();
    window.addEventListener("resize", queueViewportHeightUpdate, { passive: true });
    window.addEventListener("orientationchange", queueViewportHeightUpdate, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", queueViewportHeightUpdate, { passive: true });
      window.visualViewport.addEventListener("scroll", queueViewportHeightUpdate, { passive: true });
    }

    if (logo) {
      logo.addEventListener("click", function (e) {
        if (!isStackedLayout()) return;
        e.preventDefault();
        scrollToTopSmooth();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
