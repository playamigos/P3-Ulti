# Tech Stack

- **Frontend Framework:** Vite + React (TypeScript)
- **Styling:** Vanilla CSS (Premium Dark Mode Aesthetic)
- **Fonts:** Inter (UI), Lora (Reading Text), and Adumu (Logo) via local assets

- **Text-to-Speech Engine:** Piper TTS WASM (`@mintplex-labs/piper-tts-web`) + ONNX Runtime Web
- **Voice Tracking:** Web Speech API (Continuous SpeechRecognition for Autopilot sync)
- **State Persistence:** LocalStorage API custom hooks & browser Origin Private File System (OPFS) for caching voice models offline
- **Build & Dev Configurations:** Dev-server HTTP headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`) for WebAssembly multi-threading isolation.

