(function () {
  "use strict";

  var EMAIL = "me@levan.work";
  var LABEL_DEFAULT = "Email";
  var LABEL_COPIED = "Email copied";
  var FEEDBACK_MS = 3000;

  function init() {
    var btn = document.getElementById("contact-email-copy");
    var label = btn && btn.querySelector(".contact__email-label");
    if (!btn || !label) return;

    var resetTimer = null;

    btn.addEventListener("click", function () {
      if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = null;
      }

      function showCopied() {
        label.textContent = LABEL_COPIED;
        resetTimer = setTimeout(function () {
          label.textContent = LABEL_DEFAULT;
          resetTimer = null;
        }, FEEDBACK_MS);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL).then(showCopied).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        var ta = document.createElement("textarea");
        ta.value = EMAIL;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          showCopied();
        } catch (_) {}
        document.body.removeChild(ta);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
