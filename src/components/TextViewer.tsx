import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import * as tts from '@mintplex-labs/piper-tts-web';
import './TextViewer.css';
import { parseTextToWords, type ParsedWord } from '../utils/textParser';
import { useVoiceSync } from '../hooks/useVoiceSync';

interface TextViewerProps {
  text: string;
  focusRadius: number;
  transitionSpeed: number;
  scaleAmplitude: number;
  fadeAmplitude: number;
  textAlign: string;
  lineSpacing: number;
  scrollSpeed: number;

  // Sensor Bindings
  autoplayActive: boolean;
  setAutoplayActive: (active: boolean) => void;
  voiceSyncActive: boolean;
  readingPaceWPM: number;
  setReadingPaceWPM: (wpm: number) => void;

  // Autopilot Engine Params
  speechOffset: number;
  smoothingWindow: number;
  jumpThreshold: number;
  confidenceThreshold: number;
  snapPhraseLength: number;

  // Speak Out Mode
  speakOutActive: boolean;
  setSpeakOutActive: (active: boolean) => void;
  selectedVoiceName: string;
}

interface MeasuredWord extends ParsedWord {
  width: number;
}

const TextViewer: React.FC<TextViewerProps> = ({ 
  text, focusRadius, transitionSpeed, scaleAmplitude, fadeAmplitude, textAlign, lineSpacing, scrollSpeed,
  autoplayActive, setAutoplayActive, voiceSyncActive, readingPaceWPM, setReadingPaceWPM,
  speechOffset, smoothingWindow, jumpThreshold, confidenceThreshold, snapPhraseLength,
  speakOutActive, setSpeakOutActive, selectedVoiceName
}) => {
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [structuredParagraphs, setStructuredParagraphs] = useState<{ id: string, lines: MeasuredWord[][] }[] | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  // Visual Telemetry Debug states
  const [lastDetectedSpeechWord, setLastDetectedSpeechWord] = useState<string>('');
  
  // Auto-hide the detected speech word after 2 seconds
  useEffect(() => {
    if (lastDetectedSpeechWord) {
      const timer = setTimeout(() => {
        setLastDetectedSpeechWord('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastDetectedSpeechWord]);

  const parsedParagraphs = useMemo(() => parseTextToWords(text), [text]);

  // Handle window resize and font loading by forcing a re-measure
  useEffect(() => {
    const handleResize = () => setStructuredParagraphs(null);
    window.addEventListener('resize', handleResize);

    let active = true;
    if (document.fonts) {
      document.fonts.ready.then(() => {
        // A minor timeout ensures Safari finishes its initial layout pass with the custom font
        setTimeout(() => {
          if (active) {
            setStructuredParagraphs(null);
          }
        }, 50);
      });
    }

    return () => {
      active = false;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Reset layout measurements and reading pointer when text or chapter changes
  useEffect(() => {
    setStructuredParagraphs(null);
    setActiveWordIndex(0);
  }, [text]);

  // Measurement effect
  useEffect(() => {
    if (structuredParagraphs !== null || !containerRef.current) return;

    const pElements = containerRef.current.querySelectorAll('.reader-paragraph-measure');
    const newStructured: { id: string, lines: MeasuredWord[][] }[] = [];
    
    pElements.forEach((pEl, pIndex) => {
      const pData = parsedParagraphs[pIndex];
      if (!pData) return;
      const wordElements = pEl.querySelectorAll('.word-measure');
      
      const linesMap: { [offsetTop: number]: MeasuredWord[] } = {};
      
      wordElements.forEach((wordEl, wIndex) => {
        const top = (wordEl as HTMLElement).offsetTop;
        const width = (wordEl as HTMLElement).offsetWidth;
        const wordData = pData.words[wIndex];
        if (!wordData) return;

        if (!linesMap[top]) linesMap[top] = [];
        linesMap[top].push({
          ...wordData,
          width
        });
      });
      
      const sortedTops = Object.keys(linesMap).map(Number).sort((a, b) => a - b);
      const lines = sortedTops.map(top => linesMap[top]);
      
      newStructured.push({ id: pData.id, lines });
    });
    
    setStructuredParagraphs(newStructured);
  }, [structuredParagraphs, parsedParagraphs]);

  // Initial active state once structured
  useEffect(() => {
    if (activeWordIndex === null && structuredParagraphs && structuredParagraphs.length > 0) {
      if (structuredParagraphs[0].lines.length > 0 && structuredParagraphs[0].lines[0].length > 0) {
        setActiveWordIndex(0);
      }
    }
  }, [structuredParagraphs, activeWordIndex]);

  // Total words count for bounds checking
  const totalWordsCount = useMemo(() => {
    if (!structuredParagraphs) return 0;
    let count = 0;
    structuredParagraphs.forEach(p => {
      p.lines.forEach(l => {
        count += l.length;
      });
    });
    return count;
  }, [structuredParagraphs]);

  // Keep a stable ref for readingPaceWPM so updating it doesn't restart the tick loop
  const readingPaceWPMRef = useRef(readingPaceWPM);
  useEffect(() => {
    readingPaceWPMRef.current = readingPaceWPM;
  }, [readingPaceWPM]);

  // 1. Baseline Auto-Advance Autoplay Engine (rAF-based for perfect timing, without drift)
  const autoplayRef = useRef<{ lastTime: number; accumulated: number } | null>(null);

  useEffect(() => {
    if (!autoplayActive || speakOutActive || structuredParagraphs === null || totalWordsCount === 0) {
      autoplayRef.current = null;
      return;
    }

    let rafId: number;

    const tick = (now: number) => {
      if (!autoplayRef.current) {
        autoplayRef.current = { lastTime: now, accumulated: 0 };
      }

      const delta = now - autoplayRef.current.lastTime;
      autoplayRef.current.lastTime = now;
      autoplayRef.current.accumulated += delta;

      const intervalMs = (60 / readingPaceWPMRef.current) * 1000;

      if (autoplayRef.current.accumulated >= intervalMs) {
        // Only deduct intervalMs once per tick, if it lagged multiple intervals we just snap
        autoplayRef.current.accumulated %= intervalMs;

        setActiveWordIndex((prev) => {
          if (prev === null) return 0;
          if (prev >= totalWordsCount - 1) {
            setAutoplayActive(false);
            return 0;
          }
          return prev + 1;
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      autoplayRef.current = null;
    };
  }, [autoplayActive, speakOutActive, structuredParagraphs, totalWordsCount, setAutoplayActive]);

  const lastScrollYRef = useRef<number | null>(null);
  const targetScrollYRef = useRef<number | null>(null);

  // 2. Viewport Smooth Auto-Scrolling to keep active focus centered vertically
  useEffect(() => {
    if (activeWordIndex === null || !containerRef.current || structuredParagraphs === null || !autoplayActive) return;
    
    const activeEl = containerRef.current.querySelector(`[data-global-index="${activeWordIndex}"]`) as HTMLElement;
    if (activeEl) {
      const offsetTop = activeEl.offsetTop;
      
      // Only trigger a new smooth scroll if we moved to a new line (offsetTop changed significantly)
      if (lastScrollYRef.current === null || Math.abs(lastScrollYRef.current - offsetTop) > 20) {
        lastScrollYRef.current = offsetTop;
        
        // Calculate the absolute Y position to center the line
        const elementRect = activeEl.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.scrollY;
        targetScrollYRef.current = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
      }
    }
  }, [activeWordIndex, structuredParagraphs, autoplayActive]);

  // Continuously lerp window scroll towards target for buttery smoothness using Spring Physics
  useEffect(() => {
    let rafId: number;
    let isUserScrolling = false;
    let scrollTimeout: any;

    const handleManualScroll = () => {
       isUserScrolling = true;
       targetScrollYRef.current = null; 
       clearTimeout(scrollTimeout);
       scrollTimeout = setTimeout(() => {
         isUserScrolling = false;
       }, 500);
    };

    window.addEventListener('wheel', handleManualScroll, { passive: true });
    window.addEventListener('touchmove', handleManualScroll, { passive: true });

    let velocity = 0;

    const tick = () => {
      if (!isUserScrolling && targetScrollYRef.current !== null) {
        const currentY = window.scrollY;
        const diff = targetScrollYRef.current - currentY;
        
        // Spring Physics parameters
        // Tension controls acceleration (pull strength), derived from user's scrollSpeed setting
        const tension = scrollSpeed * 0.5; 
        // Friction heavily damps the spring so it gracefully glides to a halt without bouncing
        const friction = 0.85; 
        
        velocity += diff * tension;
        velocity *= friction;
        
        if (Math.abs(velocity) > 0.1 || Math.abs(diff) > 0.5) {
          window.scrollTo(0, currentY + velocity);
        } else {
          window.scrollTo(0, targetScrollYRef.current);
          targetScrollYRef.current = null;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('wheel', handleManualScroll);
      window.removeEventListener('touchmove', handleManualScroll);
    };
  }, [scrollSpeed]);

  // 3. Voice Synchronization Sensor integration
  useVoiceSync({
    active: voiceSyncActive,
    activeWordIndex,
    setActiveWordIndex,
    readingPaceWPM,
    setReadingPaceWPM,
    structuredParagraphs,
    onSpeechDetected: setLastDetectedSpeechWord,
    speechOffset,
    smoothingWindow,
    jumpThreshold,
    confidenceThreshold,
    snapPhraseLength
  });

  // Reset telemetry stats if Autopilot is toggled off
  useEffect(() => {
    if (!autoplayActive) {
      setLastDetectedSpeechWord('');
    }
  }, [autoplayActive]);

  // Pre-warm the TTS session in the background on mount / voice changes
  useEffect(() => {
    const prewarm = async () => {
      try {
        const voiceId = selectedVoiceName || 'en_US-hfc_female-medium';
        const stored = await tts.stored();
        if (stored.includes(voiceId)) {
          // If the active instance is for a different voice, reset it so we load the new voice
          const activeSession = (tts.TtsSession as any)._instance;
          if (activeSession && activeSession.voiceId !== voiceId) {
            (tts.TtsSession as any)._instance = null;
          }
          await tts.TtsSession.create({
            voiceId,
            wasmPaths: {
              onnxWasm: window.location.origin + '/',
              piperData: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data',
              piperWasm: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm'
            }
          });
          console.log(`[TTS Pre-warm] Preloaded voice session for ${voiceId}`);
        }
      } catch (e) {
        console.error("[TTS Pre-warm] Failed to pre-warm session:", e);
      }
    };
    prewarm();
  }, [selectedVoiceName]);

  // 4. Text-to-Speech (Speak Out) Integration using Piper WASM
  const speakOutActiveRef = useRef(speakOutActive);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentParagraphIndexRef = useRef<number>(0);

  useEffect(() => {
    speakOutActiveRef.current = speakOutActive;
  }, [speakOutActive]);

  // Sync speed rate to reading WPM: 200 WPM = playbackRate 1.0
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = readingPaceWPM / 200;
    }
  }, [readingPaceWPM]);

  // Sync play/pause updates between audio playback and visual autoplay
  useEffect(() => {
    if (!speakOutActive || !audioRef.current) return;
    if (autoplayActive) {
      audioRef.current.play().catch(e => console.error("Error resuming audio:", e));
    } else {
      audioRef.current.pause();
    }
  }, [autoplayActive, speakOutActive]);

  useEffect(() => {
    if (!speakOutActive) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setDownloadProgress(null);
      return;
    }

    let active = true;
    let localRafId: number;

    // Determine starting paragraph index based on activeWordIndex
    let pIdx = 0;
    if (activeWordIndex !== null && parsedParagraphs) {
      const idx = parsedParagraphs.findIndex(p => 
        p.words.some(w => w.globalIndex === activeWordIndex)
      );
      if (idx !== -1) pIdx = idx;
    }
    currentParagraphIndexRef.current = pIdx;

    const playSpeechForParagraph = async (index: number) => {
      if (!active || !speakOutActiveRef.current || !parsedParagraphs || index >= parsedParagraphs.length) {
        setSpeakOutActive(false);
        return;
      }

      currentParagraphIndexRef.current = index;

      try {
        // Voice selection - default to Samantha if empty
        const voiceId = selectedVoiceName || 'en_US-hfc_female-medium';

        // Check if voice is stored offline. If not, trigger in-place download
        const stored = await tts.stored();
        if (!stored.includes(voiceId)) {
          setDownloadProgress(0);
          await tts.download(voiceId, (progress) => {
            if (!active) return;
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setDownloadProgress(percent);
          });
          setDownloadProgress(null);
        }

        if (!active || !speakOutActiveRef.current) return;

        const words = parsedParagraphs[index].words;
        const pText = words.map(w => w.text).join(' ');

        // Synthesize text to WAV blob using local Piper WASM with custom same-origin assets configuration
        const activeSession = (tts.TtsSession as any)._instance;
        if (activeSession && activeSession.voiceId !== voiceId) {
          (tts.TtsSession as any)._instance = null;
        }
        
        const session = await tts.TtsSession.create({
          voiceId,
          wasmPaths: {
            onnxWasm: window.location.origin + '/',
            piperData: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data',
            piperWasm: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm'
          }
        });
        const wavBlob = await session.predict(pText);

        if (!active || !speakOutActiveRef.current) return;

        const audioUrl = URL.createObjectURL(wavBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        // Apply pace speed
        audio.playbackRate = readingPaceWPM / 200;

        // Calculate length-weighted duration timings
        let totalDuration = 0;
        let wordTimings: { start: number; end: number; globalIndex: number }[] = [];

        audio.onloadedmetadata = () => {
          if (!active) return;
          totalDuration = audio.duration;
          
          const totalChars = words.reduce((acc, w) => acc + w.text.length, 0);
          let elapsed = 0;
          wordTimings = words.map(w => {
            const wordLen = w.text.length;
            const duration = totalDuration * (wordLen / totalChars);
            const start = elapsed;
            const end = elapsed + duration;
            elapsed = end;
            return { start, end, globalIndex: w.globalIndex };
          });

          // Run highlight animation loop
          const runHighlightLoop = () => {
            if (!active || !audioRef.current || audio.paused) return;
            const curTime = audio.currentTime;
            const match = wordTimings.find(wt => curTime >= wt.start && curTime <= wt.end);
            if (match) {
              setActiveWordIndex(match.globalIndex);
            }
            localRafId = requestAnimationFrame(runHighlightLoop);
          };

          audio.onplay = () => {
            localRafId = requestAnimationFrame(runHighlightLoop);
          };

          // Start playing if autoplay is active
          if (autoplayActive) {
            audio.play().catch(err => console.error("Play failed:", err));
          }
        };

        audio.onended = () => {
          if (!active) return;
          cancelAnimationFrame(localRafId);
          URL.revokeObjectURL(audioUrl);
          
          const nextIndex = index + 1;
          if (nextIndex < parsedParagraphs.length) {
            // Move highlight to the first word of the next paragraph
            const firstWord = parsedParagraphs[nextIndex].words[0];
            if (firstWord) {
              setActiveWordIndex(firstWord.globalIndex);
            }
            setTimeout(() => {
              if (active && speakOutActiveRef.current) {
                playSpeechForParagraph(nextIndex);
              }
            }, 300);
          } else {
            setSpeakOutActive(false);
          }
        };

        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          if (active) {
            setSpeakOutActive(false);
          }
        };

      } catch (err) {
        console.error("Piper TTS synthesis failed:", err);
        if (active) {
          setSpeakOutActive(false);
        }
      }
    };

    playSpeechForParagraph(pIdx);

    return () => {
      active = false;
      cancelAnimationFrame(localRafId);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [speakOutActive, selectedVoiceName, parsedParagraphs]);

  // Measurement Render Pass (Invisible)
  if (structuredParagraphs === null) {
    return (
      <div className="text-viewer" ref={containerRef} style={{ visibility: 'hidden' }}>
        <div className="reader-container">
          {parsedParagraphs.map((paragraph) => (
            <p key={paragraph.id} className="reader-paragraph-measure" style={{ marginBottom: `${lineSpacing}rem`, lineHeight: `${lineSpacing / 1.5}` }}>
              {paragraph.words.map((word, i) => (
                <React.Fragment key={word.id}>
                  <span className="word-measure">{word.text}</span>
                  {i < paragraph.words.length - 1 ? ' ' : ''}
                </React.Fragment>
              ))}
            </p>
          ))}
        </div>
      </div>
    );
  }

  // Final Render Pass (Visible, Locked Lines)
  return (
    <div 
      className="text-viewer" 
      ref={containerRef}
      onPointerDown={(e) => {
        // Prevent double tap from interfering with potential interactive children
        // if we ever add links, but for now we just want robust double-tap.
        const now = performance.now();
        if (now - lastTapRef.current < 350) { // 350ms window for double tap
          // Unlock audio stream synchronously during the user click/tap gesture
          const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA');
          silent.play().catch(() => {});

          setAutoplayActive(!autoplayActive);
          lastTapRef.current = 0; // reset
          e.preventDefault(); // Prevent accidental zoom on some browsers
        } else {
          lastTapRef.current = now;
        }
      }}
    >
      <div className="reader-container">
        {structuredParagraphs.map((paragraph) => (
          <div key={paragraph.id} className="reader-paragraph">
            {paragraph.lines.map((line, lIdx) => {
              let justifyContent = 'center';
              if (textAlign === 'left') justifyContent = 'flex-start';
              if (textAlign === 'right') justifyContent = 'flex-end';
              if (textAlign === 'justify') justifyContent = 'space-between';

              // Calculate scales for each word in the line
              const lineWithStyles = line.map((word) => {
                const intervalMs = (60 / readingPaceWPM) * 1000;
                
                // Use perfectly matched linear transition during autoplay for seamless continuous sliding
                const dynamicTransitionDuration = autoplayActive ? `${intervalMs}ms` : `${transitionSpeed}s`;
                const dynamicTransitionTiming = autoplayActive ? 'linear' : 'cubic-bezier(0.2, 0.8, 0.2, 1)';

                const baseStyle: Record<string, any> = { 
                  color: 'var(--text-primary)',
                  transitionDuration: dynamicTransitionDuration,
                  transitionTimingFunction: dynamicTransitionTiming
                };
                
                const baselineOpacity = 1 - fadeAmplitude;
                let scale = 1;
                let opacity = baselineOpacity;
                let textStroke = 0;

                if (activeWordIndex !== null) {
                  const distance = Math.abs(word.globalIndex - activeWordIndex);
                  
                  if (distance === 0) {
                    scale = 1 + (0.7 * scaleAmplitude);
                    opacity = 1;
                    textStroke = 0.65;
                  } else if (distance <= focusRadius) {
                    const ratio = 1 - (distance / (focusRadius + 1));
                    scale = 1 + (0.7 * scaleAmplitude * ratio);
                    opacity = baselineOpacity + ((1 - baselineOpacity) * ratio);
                    textStroke = 0.65 * ratio;
                  }
                }

                return {
                  word,
                  scale,
                  opacity,
                  textStroke,
                  baseStyle
                };
              });

              // Find the index of the word with the maximum scale
              let maxScaleIndex = 0;
              let maxScale = 0;
              lineWithStyles.forEach((item, idx) => {
                if (item.scale > maxScale) {
                  maxScale = item.scale;
                  maxScaleIndex = idx;
                }
              });

              const A = maxScaleIndex;

              // Calculate shifts (translations) for each word
              const shifts = new Array(line.length).fill(0);
              
              if (activeWordIndex !== null && maxScale > 1) {
                shifts[A] = 0;

                // Words to the right
                for (let i = A + 1; i < line.length; i++) {
                  const prevItem = lineWithStyles[i - 1];
                  const currentItem = lineWithStyles[i];
                  shifts[i] = shifts[i - 1] + 
                    0.5 * (prevItem.scale - 1) * prevItem.word.width + 
                    0.5 * (currentItem.scale - 1) * currentItem.word.width;
                }

                // Words to the left
                for (let i = A - 1; i >= 0; i--) {
                  const nextItem = lineWithStyles[i + 1];
                  const currentItem = lineWithStyles[i];
                  shifts[i] = shifts[i + 1] - 
                    0.5 * (nextItem.scale - 1) * nextItem.word.width - 
                    0.5 * (currentItem.scale - 1) * currentItem.word.width;
                }
              }

              return (
                <div key={lIdx} className="line" style={{ justifyContent, height: `${lineSpacing}rem` }}>
                  {lineWithStyles.map((item, idx) => {
                    const shift = shifts[idx];
                    const style = {
                      ...item.baseStyle,
                      opacity: item.opacity,
                      WebkitTextStroke: `${item.textStroke}px currentColor`,
                      transform: `translateX(${shift}px) scale(${item.scale})`
                    };

                    return (
                      <span
                        key={item.word.id}
                        className="word"
                        data-global-index={item.word.globalIndex}
                        style={style}
                      >
                        {item.word.text}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Minimal Word Detected HUD Overlay */}
      {autoplayActive && lastDetectedSpeechWord && (
        <div className="telemetry-debug-hud">
          <div className="telemetry-hud-group">
            <span className="telemetry-label">Heard:</span>
            <span className="telemetry-value speech-match">"{lastDetectedSpeechWord}"</span>
          </div>
        </div>
      )}

      {/* In-place download overlay */}
      {downloadProgress !== null && (
        <div className="voice-download-overlay">
          <div className="voice-download-modal">
            <Loader2 className="animate-spin text-indigo" size={32} />
            <h3 className="download-title">Downloading Premium Voice</h3>
            <p className="download-subtitle">Caching voice assets offline. This will take a moment...</p>
            <div className="download-progress-bar">
              <div className="download-progress-fill" style={{ width: `${downloadProgress}%` }} />
            </div>
            <span className="download-percentage">{downloadProgress}%</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default TextViewer;
