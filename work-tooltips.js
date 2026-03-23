(function () {
  "use strict";

  function createTooltip() {
    var el = document.createElement("div");
    el.className = "work-tooltip";
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    return el;
  }

  function init() {
    var frames = document.querySelectorAll(".work-frame[data-work-tooltip]");
    if (!frames.length) return;

    var tooltip = createTooltip();

    function isInsideMedia(e, mediaEls) {
      for (var i = 0; i < mediaEls.length; i++) {
        var mediaEl = mediaEls[i];
        if (!mediaEl || !mediaEl.getBoundingClientRect) continue;
        var r = mediaEl.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        var inside =
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom;
        if (inside) return true;
      }
      return false;
    }

    function move(e) {
      tooltip.style.left = e.clientX + "px";
      tooltip.style.top = e.clientY + "px";
    }

    frames.forEach(function (frame) {
      var tooltipText = frame.getAttribute("data-work-tooltip") || "";
      var mediaEls = frame.querySelectorAll(".work-frame__media img, .work-frame__media video");

      frame.addEventListener("mousemove", function (e) {
        var inside = isInsideMedia(e, mediaEls);
        if (inside) {
          tooltip.textContent = tooltipText;
          move(e);
          frame.classList.add("work-frame--tooltip-hover");
          tooltip.classList.add("is-visible");
        } else {
          frame.classList.remove("work-frame--tooltip-hover");
          tooltip.classList.remove("is-visible");
        }
      });

      frame.addEventListener("mouseleave", function () {
        frame.classList.remove("work-frame--tooltip-hover");
        tooltip.classList.remove("is-visible");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
