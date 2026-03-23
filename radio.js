(function () {
  "use strict";

  var STREAM_URL = "https://fjaartaf.zone/stream";

  function init() {
    var audio = document.getElementById("site-radio");
    var btn = document.getElementById("radio-toggle");
    var label = btn && btn.querySelector(".radio-toggle__label");
    if (!audio || !btn || !label) return;

    audio.preload = "none";
    audio.src = STREAM_URL;

    function setPlayingUi(playing) {
      if (playing) {
        btn.setAttribute("aria-pressed", "true");
        btn.classList.add("is-active");
        label.textContent = "- stop my radio";
      } else {
        btn.setAttribute("aria-pressed", "false");
        btn.classList.remove("is-active");
        label.textContent = "+ play my radio";
      }
    }

    btn.addEventListener("click", function () {
      if (audio.paused) {
        var playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(function () {
              setPlayingUi(true);
            })
            .catch(function () {});
        }
      } else {
        audio.pause();
        setPlayingUi(false);
      }
    });

    audio.addEventListener("ended", function () {
      setPlayingUi(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
