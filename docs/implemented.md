# Implemented Features

## Phase 1: Basic Viewer
- Scaffolded a Vite + React + TypeScript web application.
- Implemented a premium light mode aesthetic (glassmorphism header, white backdrop, high contrast) using Vanilla CSS.
- Added `Anton` (sans-serif) for high-impact UI elements and `Lora` (serif) for highly readable body text.
- Created `TextViewer` component and preloaded it with a sample text (Alice in Wonderland).

## Phase 2: Visual Focus
- **Text Magnifier (macOS Dock-Style):** Implemented a dynamic lens scale and fade effect applied at the word level for intense focus.
- **Physical Line Locking:** Implemented a two-pass render system. First renders invisibly to let the browser break lines naturally. Then measures the layout offsets of all words and locks them into dedicated horizontal flexbox `<div class="line">` containers with `white-space: nowrap`. This completely prevents chaotic line wrapping when text is scaled.
- **Stationary Anchor Translation Math:** Added a custom $O(N)$ recurrence solver to compute pixel-perfect visual translations (`translateX`) for adjacent words. The word closest to the cursor is designated as anchor $A$ and remains stationary ($T_A = 0$) so the reader's eye focus never jumps, while surrounding words seamlessly slide outwards on the GPU to make space.
- **GPU-Accelerated Transitions:** Replaced CPU-heavy `font-size` transitions with hardware-accelerated `transform` scale and translation operations to guarantee 60fps/120fps butter-smooth animations with absolute zero jitter.
- **Session Persistence:** Integrated local-storage persistence for all slider control parameters (radius, amplitude, line spacing, text alignment, speed).
- **Responsive Handling:** Hooked into window resize events to automatically reset and recompute physical line measurements instantly.

## Phase 3: Sensor Integration (Zero-Calibration Autopilot Engine)
- **Auto-Advance Focus Engine (Core):** Implemented a baseline autoplay ticker inside the `TextViewer` component that automatically glides the active focus pointer forward word-by-word at the user's estimated reading speed (WPM), completely eliminating sensor jitter during auto-scrolling.
- **Viewport Auto-Scrolling:** Integrated smooth viewport vertical centering logic that automatically scrolls the reader view to keep the active word line perfectly centered in the reader's view.
- **Single-Button Autopilot:** Replaced bulky individual sliders and controls with a single premium `✨ Autopilot` toggle button in our single-row glassmorphic dock. Toggling this boots autoplay and speech recognition concurrently.
- **Voice Synchronization (Web Speech API):** Hooked up a continuous `SpeechRecognition` listener that captures transcripts as the user reads out loud. Uses phrase-matching across a wide scrolling window to detect the exact spoken word and intelligently snaps the `activeWordIndex` backwards/forwards without interrupting the visual flow, while dynamically adjusting the Autoplay WPM pace.
