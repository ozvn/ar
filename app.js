(() => {
  "use strict";

  const statusEl = document.getElementById("status");
  const sceneEl = document.getElementById("ar-scene");
  const SMOOTH_PRESETS = {
    balanced: {
      posLerp: 0.18,
      slowRotLerp: 0.2,
      fastRotLerp: 0.55,
      fastRotThresholdDeg: 4,
      rotDeadzoneDeg: 0.6,
      scaleLerp: 0.2
    },
    stable: {
      posLerp: 0.12,
      slowRotLerp: 0.12,
      fastRotLerp: 0.34,
      fastRotThresholdDeg: 7,
      rotDeadzoneDeg: 1.2,
      scaleLerp: 0.14
    }
  };

  if (window.AFRAME && !AFRAME.components["marker-smooth"]) {
    AFRAME.registerComponent("marker-smooth", {
      schema: {
        preset: { type: "string", default: "stable" },
        posLerp: { type: "number", default: 0.18, min: 0.01, max: 1 },
        slowRotLerp: { type: "number", default: 0.2, min: 0.01, max: 1 },
        fastRotLerp: { type: "number", default: 0.55, min: 0.01, max: 1 },
        fastRotThresholdDeg: { type: "number", default: 4, min: 0.1, max: 45 },
        rotDeadzoneDeg: { type: "number", default: 0.6, min: 0, max: 10 },
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
        this.active = SMOOTH_PRESETS.stable;
      },
      update() {
        const selected = this.data.preset || "stable";
        this.active = SMOOTH_PRESETS[selected] || SMOOTH_PRESETS.stable;
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

        this.smoothPosition.lerp(this.rawPosition, this.active.posLerp);
        this.smoothScale.lerp(this.rawScale, this.active.scaleLerp);

        // Keep micro jitter out, but react quickly to real camera movement.
        const dot = THREE.MathUtils.clamp(
          Math.abs(this.smoothQuaternion.dot(this.rawQuaternion)),
          -1,
          1
        );
        const deltaDeg = THREE.MathUtils.radToDeg(2 * Math.acos(dot));
        if (deltaDeg > this.active.rotDeadzoneDeg) {
          const rotLerp =
            deltaDeg >= this.active.fastRotThresholdDeg
              ? this.active.fastRotLerp
              : this.active.slowRotLerp;
          this.smoothQuaternion.slerp(this.rawQuaternion, rotLerp);
        }

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
