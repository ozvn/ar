(() => {
  "use strict";

  const statusEl = document.getElementById("status");
  const sceneEl = document.getElementById("ar-scene");

  if (window.AFRAME && !AFRAME.components["marker-smooth"]) {
    AFRAME.registerComponent("marker-smooth", {
      schema: {
        posLerp: { type: "number", default: 0.18, min: 0.01, max: 1 },
        rotLerp: { type: "number", default: 0.12, min: 0.01, max: 1 },
        scaleLerp: { type: "number", default: 0.2, min: 0.01, max: 1 }
      },
      init() {
        this.hasPose = false;
        this.rawPosition = new THREE.Vector3();
        this.rawQuaternion = new THREE.Quaternion();
        this.rawScale = new THREE.Vector3();
        this.smoothPosition = new THREE.Vector3();
        this.smoothQuaternion = new THREE.Quaternion();
        this.smoothScale = new THREE.Vector3();
      },
      tick() {
        const object3D = this.el.object3D;
        if (!object3D.visible) {
          this.hasPose = false;
          return;
        }

        this.rawPosition.copy(object3D.position);
        this.rawQuaternion.copy(object3D.quaternion);
        this.rawScale.copy(object3D.scale);

        if (!this.hasPose) {
          this.smoothPosition.copy(this.rawPosition);
          this.smoothQuaternion.copy(this.rawQuaternion);
          this.smoothScale.copy(this.rawScale);
          this.hasPose = true;
          return;
        }

        this.smoothPosition.lerp(this.rawPosition, this.data.posLerp);
        this.smoothQuaternion.slerp(this.rawQuaternion, this.data.rotLerp);
        this.smoothScale.lerp(this.rawScale, this.data.scaleLerp);

        object3D.position.copy(this.smoothPosition);
        object3D.quaternion.copy(this.smoothQuaternion);
        object3D.scale.copy(this.smoothScale);
      }
    });
  }

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
