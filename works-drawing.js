(function () {
  "use strict";

  var MOBILE_MAX = 768;
  var STROKE_COLOR = "#ffffff";
  var LINE_WIDTH = 0.6;
  var JITTER = 0.4;

  function isDrawingDisabled() {
    return window.matchMedia("(max-width: " + MOBILE_MAX + "px)").matches;
  }

  function jitterPoint(x, y) {
    return {
      x: x + (Math.random() - 0.5) * 2 * JITTER,
      y: y + (Math.random() - 0.5) * 2 * JITTER,
    };
  }

  function pointInImage(clientX, clientY, mediaEl) {
    if (!mediaEl || !mediaEl.getBoundingClientRect) return false;
    var r = mediaEl.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    return (
      clientX >= r.left &&
      clientX <= r.right &&
      clientY >= r.top &&
      clientY <= r.bottom
    );
  }

  function pointInAnyMedia(clientX, clientY, mediaEls) {
    if (!mediaEls || mediaEls.length === 0) return false;
    for (var i = 0; i < mediaEls.length; i++) {
      if (pointInImage(clientX, clientY, mediaEls[i])) return true;
    }
    return false;
  }

  function clientToCanvas(clientX, clientY, frame) {
    var fr = frame.getBoundingClientRect();
    return { x: clientX - fr.left, y: clientY - fr.top };
  }

  function pointInFrame(p, frame) {
    var w = frame.clientWidth;
    var h = frame.clientHeight;
    if (w < 1 || h < 1) return false;
    return (
      p.x >= -0.5 &&
      p.y >= -0.5 &&
      p.x <= w + 0.5 &&
      p.y <= h + 0.5
    );
  }

  function setDrawingUi(active) {
    document.documentElement.classList.toggle("drawing-enabled", active);
  }

  var frameApis = [];

  function redraw(ctx, segments, frameW, frameH) {
    var dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (var s = 0; s < segments.length; s++) {
      var seg = segments[s];
      if (!seg || seg.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(seg[0].x, seg[0].y);
      for (var i = 1; i < seg.length; i++) {
        ctx.lineTo(seg[i].x, seg[i].y);
      }
      ctx.stroke();
    }
  }

  function breakSegment(segments, ctx, frame) {
    if (segments.length && segments[segments.length - 1].length > 0) {
      segments.push([]);
    }
    redraw(ctx, segments, frame.clientWidth, frame.clientHeight);
  }

  function initFrame(frame, canvas, mediaEls) {
    var ctx = canvas.getContext("2d");
    var segments = [];
    var lastSize = { w: 0, h: 0 };
    var prevInsideImage = false;

    var api = {
      onDocumentPointerLeave: function () {
        prevInsideImage = false;
        setDrawingUi(false);
        breakSegment(segments, ctx, frame);
      },
    };

    frameApis.push(api);

    function doResize() {
      var dpr = window.devicePixelRatio || 1;
      var w = frame.clientWidth;
      var h = frame.clientHeight;
      var oldW = lastSize.w;
      var oldH = lastSize.h;

      if (oldW > 0 && oldH > 0 && w > 0 && h > 0 && (w !== oldW || h !== oldH)) {
        var sx = w / oldW;
        var sy = h / oldH;
        for (var si = 0; si < segments.length; si++) {
          var seg = segments[si];
          if (!seg) continue;
          for (var pi = 0; pi < seg.length; pi++) {
            seg[pi].x *= sx;
            seg[pi].y *= sy;
          }
        }
      }

      lastSize.w = w;
      lastSize.h = h;

      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));

      redraw(ctx, segments, w, h);
    }

    var ro = new ResizeObserver(doResize);
    ro.observe(frame);

    function scheduleResize() {
      requestAnimationFrame(function () {
        doResize();
        requestAnimationFrame(doResize);
      });
    }

    scheduleResize();
    window.addEventListener("load", scheduleResize);

    function onPointerDown(e) {
      if (e.button !== 0 || isDrawingDisabled()) return;
      if (e.currentTarget !== canvas) return;

      segments = [];
      prevInsideImage = false;
      redraw(ctx, segments, frame.clientWidth, frame.clientHeight);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (isDrawingDisabled()) return;

      var inside = pointInAnyMedia(e.clientX, e.clientY, mediaEls);
      var p = clientToCanvas(e.clientX, e.clientY, frame);

      if (!pointInFrame(p, frame)) {
        return;
      }

      if (inside) {
        prevInsideImage = true;
        return;
      }

      var j = jitterPoint(p.x, p.y);

      if (prevInsideImage) {
        segments.push([j]);
        prevInsideImage = false;
      } else {
        if (segments.length === 0) segments.push([]);
        segments[segments.length - 1].push(j);
      }

      setDrawingUi(true);
      redraw(ctx, segments, frame.clientWidth, frame.clientHeight);
    }

    function onPointerLeaveCanvas() {
      prevInsideImage = false;
      setDrawingUi(false);
      breakSegment(segments, ctx, frame);
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeaveCanvas);

    doResize();

    return api;
  }

  function onDocumentPointerLeave() {
    for (var i = 0; i < frameApis.length; i++) {
      frameApis[i].onDocumentPointerLeave();
    }
  }

  function enforceWorkVideosMuted() {
    document
      .querySelectorAll(".work-frame__media video")
      .forEach(function (v) {
        function apply() {
          v.defaultMuted = true;
          v.muted = true;
          v.volume = 0;
        }
        apply();
        v.addEventListener("loadedmetadata", apply);
        v.addEventListener("volumechange", function () {
          if (!v.muted || v.volume > 0) apply();
        });
      });
  }

  function boot() {
    if (isDrawingDisabled()) return;

    document.querySelectorAll(".work-frame").forEach(function (frame) {
      var canvas = document.createElement("canvas");
      canvas.className = "work-frame__canvas";
      canvas.setAttribute("aria-hidden", "true");
      frame.appendChild(canvas);

      var mediaEls = frame.querySelectorAll(
        ".work-frame__media img, .work-frame__media video"
      );
      initFrame(frame, canvas, mediaEls);
    });

    document.documentElement.addEventListener(
      "pointerleave",
      onDocumentPointerLeave
    );
  }

  function init() {
    enforceWorkVideosMuted();
    boot();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
