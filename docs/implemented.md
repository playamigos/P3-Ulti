# Implemented Features

## Phase 1: Basic Viewer
- Scaffolded a Vite + React + TypeScript web application.
- Implemented a premium light mode aesthetic (glassmorphism header, white backdrop, high contrast) using Vanilla CSS.
- Added `Anton` (sans-serif) for high-impact UI elements and `Lora` (serif) for highly readable body text.
- Created `TextViewer` component and preloaded it with a sample text (Alice in Wonderland).

## Phase 2: Visual Focus
- Added a `textParser` utility that uses regex to robustly chunk raw text blocks into semantic sentences.
- Implemented hovered-based visual tracking mock: moving the mouse over any sentence instantly sets it as the "active" sentence.
- Styled sentences to be heavily dimmed (`opacity: 0.25`) by default, with smooth CSS transitions that bump the active sentence to full opacity and add a subtle drop-shadow to pop it off the page.
