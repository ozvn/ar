(() => {
  "use strict";

  const statusEl = document.getElementById("status");
  const sceneEl = document.getElementById("ar-scene");

  const setStatus = (message) => {
    if (statusEl) statusEl.textContent = message;
  };

  const preventGesture = (event) => {
    const multiTouch = event.touches && event.touches.length > 1;
    const scaled = typeof event.scale === "number" && event.scale !== 1;
    const ctrlZoom = event.ctrlKey || event.metaKey;
    if (multiTouch || scaled || ctrlZoom) event.preventDefault();
  };

  const options = { passive: false };
  document.addEventListener("touchmove", preventGesture, options);
  document.addEventListener("gesturestart", (e) => e.preventDefault(), options);
  document.addEventListener("wheel", preventGesture, options);

  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd < 300) event.preventDefault();
      lastTouchEnd = now;
    },
    options
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (event.key === "+" || event.key === "-" || event.key === "=") {
        event.preventDefault();
      }
    },
    options
  );

  if (!sceneEl) return;

  const targetEls = sceneEl.querySelectorAll("[mindar-image-target]");
  targetEls.forEach((targetEl) => {
    targetEl.addEventListener("targetFound", () => {
      setStatus("Hedef bulundu.");
    });
    targetEl.addEventListener("targetLost", () => {
      setStatus("Hedef kayboldu.");
    });
  });

  sceneEl.addEventListener("loaded", () => {
    setStatus("Sahne hazir. Kamerayi hedefe tut.");
  });

  sceneEl.addEventListener("arError", () => {
    setStatus("targets.mind bulunamadi. once compile-target.html kullan.");
  });
})();
