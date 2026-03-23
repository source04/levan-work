(function () {
  "use strict";

  var BREAKPOINT_MAX = 959;

  function isStackedLayout() {
    return window.matchMedia("(max-width: " + BREAKPOINT_MAX + "px)").matches;
  }

  function scrollToTopSmooth() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function init() {
    var logo = document.querySelector(".logo");
    if (!logo) return;

    logo.addEventListener("click", function (e) {
      if (!isStackedLayout()) return;
      e.preventDefault();
      scrollToTopSmooth();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
