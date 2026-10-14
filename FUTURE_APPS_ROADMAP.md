# IAMGREATER Future Apps & Digital Craft Roadmap

A strategic blueprint and technical backlog for future high-velocity applications across the **IAMGREATER** ecosystem (`iamgreater.net`, Google Play, XDA Developers, and F-Droid).

---

## 🎯 Core Brand Principles (The IAMGREATER Formula)

All future products follow the proven philosophy established by **QuickDraw Launcher** and **ChopTorch**:
1. **100% Offline & Zero Tracking:** Omit `android.permission.INTERNET` whenever possible. Zero telemetry, zero analytics, zero external network dependencies.
2. **Ultra-Low Battery & CPU Footprint:** Pure event-driven architectures. Zero idle background CPU draw, zero unnecessary wake-locks.
3. **Accessibility & Ergonomic Focus:** Built specifically to eliminate real physical or cognitive friction (single-handed tall screen ergonomics, dyslexia-friendly readability, neurodivergent focus).
4. **Fair & Respectful Software:** No aggressive ads, no dark patterns, no predatory monthly subscriptions. Direct APKs available on `iamgreater.net`, accompanied by Google Play listings.

---

## 📱 Phase 1: High-Velocity Android Power Utilities

### 1. EdgeVolume (SoundGlide)
* **Tagline:** Smooth edge-swipe volume control with haptic ticks.
* **Concept:** Slide a thumb vertically along the upper right or left screen border to smoothly adjust media, ring, or call volume.
* **Architecture & Reusability:**
  - Directly reuses QuickDraw’s `OverlayService` gesture detection zone and window manager parameters.
  - Connects to Android `AudioManager` with zero lag.
  - Custom haptic feedback engine (subtle vibration tick per volume step increment).
* **Target Audience:** Android power users, gamers, users with broken physical volume buttons, or tall phone users.

### 2. PieControls 2026 (Radial Thumb Menu)
* **Tagline:** The modern Material 3 revival of the legendary radial fan launcher.
* **Concept:** Swipe inward from the screen border or bottom edge to reveal a sleek, semi-circular radial pie menu of essential shortcuts (Back, Home, Recents, Flashlight, QuickDraw, Screenshot, Lock).
* **Architecture:**
  - Jetpack Compose floating overlay canvas with trigonometric touch-angle calculations.
  - Custom radial animations using Compose spring physics.
  - 100% offline, zero internet permission.

### 3. DoubleTapLock & PocketGuard
* **Tagline:** Intelligent, sensor-driven screen sleep with zero battery penalty.
* **Concept:** Lock the phone via double-tap on any empty edge zone, or automatically sleep the display when flipped face-down or placed in a pocket using proximity/light sensors.

---

## 👓 Phase 2: Accessibility & Dyslexia-Friendly Focus Tools

### 4. ReadRuler (TintGlide)
* **Tagline:** Floating reading guide and visual stress filter for Android.
* **Concept:** A semi-transparent overlay that places an adjustable highlight ruler across the active reading line in any app (Chrome, Kindle, PDF viewers, Teams), while subtly dimming or tinting the rest of the screen with dyslexia-friendly pastel overlays (Rose, Mint, Cream, Sky Blue).
* **Architecture:**
  - Full-screen pass-through overlay (`FLAG_NOT_TOUCHABLE` outside the drag handles).
  - Floating gesture handles to drag the ruler bar up and down the page.
  - Custom color matrix filters for chromatic tint adjustments.

### 5. CleanRead Web (Interactive Text Reformatter on `iamgreater.net`)
* **Tagline:** Instant dyslexia-friendly reader and clean text formatter.
* **Concept:** Web app where students or teachers paste dense, cluttered articles or homework text, and with one click reformat it into double-spaced, high-contrast, rounded typography (Nunito / Lexend) with custom color overlays.

---

## 🎵 Phase 3: Focus, Audio & 3D Interactive Web Tools

### 6. AmbientFlow (Lo-Fi & Study Soundscape Generator) — ✅ COMPLETED
* **Tagline:** Zero-bloat generative study beats and ambient noise generator.
* **Concept:** Standalone procedural Web Audio API mixer at `iamgreater.net/ambient/`. Features 6 procedural sound engines (Rain on Window with glass droplets, Distant Thunder, Vinyl Crackle, Cafe Hum, Lo-Fi Chords synth with tape warble, and Brown Noise), built-in study pomodoro & sleep timer, Solfeggio completion chime, presets, and audio visualizer. 100% offline, zero dependencies.

### 7. ShapeMorph 3D (Interactive Nets, Plans & Elevations)
* **Tagline:** 3D interactive geometry folding and architectural elevations.
* **Concept:** Evolution of `netfolding` into an interactive 3D Three.js/WebGL laboratory where learners can fold/unfold 3D polyhedra (cubes, cuboids, prisms, pyramids) with real-time sliders and toggle 2D orthographic projections (Plan, Front, Side elevations).
* **Distribution:** Hosted on `iamgreater.net/apps/shapemorph/` and packaged as an offline PWA / Android WebView app.

### 8. ShakeMemo (Instant Voice Sticky Note)
* **Tagline:** One-shake lockscreen audio capture.
* **Concept:** Shake the phone to immediately trigger a 15-second audio memo buffer without unlocking the phone, automatically saved to internal storage and synced to Nextcloud.

---

## 🗺️ Execution Matrix

| Project | Platform | Tech Stack | Estimated Build Time | Community Virality |
| :--- | :--- | :--- | :--- | :--- |
| **EdgeVolume** | Android App | Kotlin / Compose / Overlay | 1–2 Days | ⭐⭐⭐⭐⭐ (XDA / Reddit) |
| **ReadRuler** | Android App | Kotlin / WindowManager Overlay | 2 Days | ⭐⭐⭐⭐⭐ (EdTech / Accessibility) |
| **AmbientFlow** | Web App | Vanilla JS / Web Audio API | Completed | ⭐⭐⭐⭐ (Productivity / Web) |
| **PieControls 2026** | Android App | Kotlin / Compose Canvas | 3–4 Days | ⭐⭐⭐⭐⭐ (XDA Enthusiasts) |
| **ShapeMorph 3D** | Web / PWA | Three.js / WebGL / PWA | 3–5 Days | ⭐⭐⭐⭐ (Education / STEM) |
| **ShakeMemo** | Android App | Kotlin / SensorManager / Audio | 2 Days | ⭐⭐⭐⭐ (Everyday Utility) |

---

> [!NOTE]
> All projects are planned to integrate seamlessly with the existing **DarkNight** build pipeline, signing keystores, and GitHub/Nextcloud deployment workflows. When ready, invoke any project by name to start implementation.
