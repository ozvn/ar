(() => {
  "use strict";

  const statusEl = document.getElementById("status");
  const sceneEl = document.getElementById("ar-scene");
  const recordBtn = document.getElementById("record-btn");
  const timerEl = document.getElementById("record-timer");

  if (window.AFRAME && !AFRAME.components["marker-smooth"]) {
    AFRAME.registerComponent("marker-smooth", {
      schema: {
        preset: { type: "string", default: "balanced" },
        posLerp: { type: "number", default: 0.18, min: 0.01, max: 1 },
        slowRotLerp: { type: "number", default: 0.2, min: 0.01, max: 1 },
        fastRotLerp: { type: "number", default: 0.55, min: 0.01, max: 1 },
        fastRotThresholdDeg: { type: "number", default: 4, min: 0.1, max: 45 },
        rotDeadzoneDeg: { type: "number", default: 0.6, min: 0, max: 10 },
        scaleLerp: { type: "number", default: 0.2, min: 0.01, max: 1 }
      },
      getConfig() {
        if (this.data.preset === "stable") {
          return {
            posLerp: 0.12,
            slowRotLerp: 0.18,
            fastRotLerp: 1,
            fastRotThresholdDeg: 2.8,
            rotDeadzoneDeg: 0.8,
            scaleLerp: 0.14
          };
        }
        return this.data;
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
        const cfg = this.getConfig();
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

        this.smoothPosition.lerp(this.rawPosition, cfg.posLerp);
        this.smoothScale.lerp(this.rawScale, cfg.scaleLerp);

        // Keep micro jitter out. For larger deltas snap to tracker pose
        // to avoid "camera-facing" lag during fast camera movement.
        const dot = THREE.MathUtils.clamp(
          Math.abs(this.smoothQuaternion.dot(this.rawQuaternion)),
          -1,
          1
        );
        const deltaDeg = THREE.MathUtils.radToDeg(2 * Math.acos(dot));
        if (deltaDeg > cfg.rotDeadzoneDeg) {
          if (deltaDeg >= cfg.fastRotThresholdDeg) {
            this.smoothQuaternion.copy(this.rawQuaternion);
          } else {
            this.smoothQuaternion.slerp(this.rawQuaternion, cfg.slowRotLerp);
          }
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

  const setRecordUI = ({ visible, recording }) => {
    if (!recordBtn) return;
    recordBtn.hidden = !visible;
    recordBtn.classList.toggle("recording", Boolean(recording));
    recordBtn.textContent = recording ? "Kaydi Durdur" : "Video Kaydet";
  };

  const setTimerText = (seconds) => {
    if (!timerEl) return;
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const mm = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
    const ss = String(safeSeconds % 60).padStart(2, "0");
    timerEl.textContent = `REC ${mm}:${ss}`;
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

  let targetVisible = false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordTimerId = null;
  let recordStartAt = 0;

  const clearRecordTimer = () => {
    if (recordTimerId) window.clearInterval(recordTimerId);
    recordTimerId = null;
  };

  const updateTimerNow = () => {
    setTimerText((Date.now() - recordStartAt) / 1000);
  };

  const downloadBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    anchor.href = url;
    anchor.download = `ar-record-${stamp}.webm`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const stopRecording = () => {
    if (!mediaRecorder || mediaRecorder.state !== "recording") return;
    mediaRecorder.stop();
  };

  const startRecording = () => {
    if (typeof MediaRecorder === "undefined") {
      setStatus("Bu cihazda video kayit desteklenmiyor.");
      return;
    }
    const canvas = sceneEl.canvas || sceneEl.querySelector("canvas");
    if (!canvas || typeof canvas.captureStream !== "function") {
      setStatus("Video kayit desteklenmiyor.");
      return;
    }
    const stream = canvas.captureStream(30);
    recordedChunks = [];
    const mimeType =
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported &&
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType });
    } catch (error) {
      mediaRecorder = new MediaRecorder(stream);
    }
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) recordedChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      clearRecordTimer();
      if (timerEl) timerEl.classList.remove("active");
      setTimerText(0);
      setRecordUI({ visible: targetVisible, recording: false });
      if (recordedChunks.length) {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        downloadBlob(blob);
        setStatus("Kayit tamamlandi ve indirildi.");
      }
      stream.getTracks().forEach((track) => track.stop());
      mediaRecorder = null;
      recordedChunks = [];
    };
    mediaRecorder.start(100);
    recordStartAt = Date.now();
    updateTimerNow();
    clearRecordTimer();
    recordTimerId = window.setInterval(updateTimerNow, 250);
    if (timerEl) timerEl.classList.add("active");
    setRecordUI({ visible: true, recording: true });
    setStatus("Kayit basladi.");
  };

  if (recordBtn) {
    setRecordUI({ visible: false, recording: false });
    recordBtn.addEventListener("click", () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        stopRecording();
      } else {
        startRecording();
      }
    });
  }
  setTimerText(0);

  const targetEls = sceneEl.querySelectorAll("[mindar-image-target]");
  targetEls.forEach((targetEl) => {
    targetEl.addEventListener("targetFound", () => {
      targetVisible = true;
      setStatus("Hedef bulundu. Kayit baslatabilirsiniz.");
      if (!mediaRecorder || mediaRecorder.state !== "recording") {
        setRecordUI({ visible: true, recording: false });
      }
    });
    targetEl.addEventListener("targetLost", () => {
      targetVisible = false;
      setStatus("Hedef kayboldu.");
      if (!mediaRecorder || mediaRecorder.state !== "recording") {
        setRecordUI({ visible: false, recording: false });
      }
    });
  });

  sceneEl.addEventListener("loaded", () => {
    setStatus("Sahne hazir. Kamerayi hedefe tut.");
  });

  sceneEl.addEventListener("arError", () => {
    setStatus("targets.mind bulunamadi. once compile-target.html kullan.");
  });
})();
