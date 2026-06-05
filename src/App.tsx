import { useEffect, useState } from 'react';
import { Mic, Settings2, Sliders, Plus, Minus, ArrowLeft, Volume2 } from 'lucide-react';
import './App.css';
import TextViewer from './components/TextViewer';
import FloatingControls from './components/FloatingControls';
import AutopilotControls from './components/AutopilotControls';
import OnboardingModal from './components/OnboardingModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Dashboard } from './components/Dashboard';
import { type EpubBook, learningBooks } from './data/learningBooks';

function App() {
  const [focusRadius, setFocusRadius] = useLocalStorage<number>('ulti-focusRadius', 12);
  const [transitionSpeed, setTransitionSpeed] = useLocalStorage<number>('ulti-transitionSpeed', 1.50);
  const [scaleAmplitude, setScaleAmplitude] = useLocalStorage<number>('ulti-scaleAmplitude', 0.2);
  const [fadeAmplitude, setFadeAmplitude] = useLocalStorage<number>('ulti-fadeAmplitude', 0.3);
  const [textAlign, setTextAlign] = useLocalStorage<string>('ulti-textAlign', 'left');
  const [lineSpacing, setLineSpacing] = useLocalStorage<number>('ulti-lineSpacing', 2.5);
  const [scrollSpeed, setScrollSpeed] = useLocalStorage<number>('ulti-scrollSpeed', 0.01);

  // Phase 3 Sensor Integrations States
  const [autopilotActive, setAutopilotActive] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showAutopilotControls, setShowAutopilotControls] = useState<boolean>(false);
  
  const [readingPaceWPM, setReadingPaceWPM] = useLocalStorage<number>('ulti-readingPaceWPM', 200);

  // New Autopilot Tuning Params
  const [speechOffset, setSpeechOffset] = useLocalStorage<number>('ulti-speechOffset', 2);
  const [smoothingWindow, setSmoothingWindow] = useLocalStorage<number>('ulti-smoothingWindow', 8);
  const [jumpThreshold, setJumpThreshold] = useLocalStorage<number>('ulti-jumpThreshold', 10);
  const [confidenceThreshold, setConfidenceThreshold] = useLocalStorage<number>('ulti-confidenceThreshold', 0.7);
  const [snapPhraseLength, setSnapPhraseLength] = useLocalStorage<number>('ulti-snapPhraseLength', 5);

  const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage<boolean>('ulti-hasSeenOnboarding', false);

  // Dashboard & Books state
  const [viewMode, setViewMode] = useState<'dashboard' | 'reader'>('dashboard');
  const [currentBook, setCurrentBook] = useState<EpubBook | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const books = learningBooks;

  // Speak Out Mode
  const [speakOutActive, setSpeakOutActive] = useState<boolean>(false);
  const [selectedVoiceName, setSelectedVoiceName] = useLocalStorage<string>('ulti-selectedVoiceName', 'en_US-hfc_female-medium');

  // Persist reading progress to localStorage
  useEffect(() => {
    if (currentBook && viewMode === 'reader') {
      const totalChapters = currentBook.chapters.length;
      const isCompleted = currentChapterIndex === totalChapters - 1;
      
      localStorage.setItem(
        `ulti-progress-${currentBook.id}`,
        JSON.stringify({
          chapterIndex: currentChapterIndex,
          completed: isCompleted && totalChapters > 1 // mark completed when reaching the end of multi-chapter books
        })
      );
    }
  }, [currentBook, currentChapterIndex, viewMode]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.floating-controls') && !target.closest('.app-header')) {
        setShowControls(false);
        setShowAutopilotControls(false);
      }
    };
    
    if (showControls || showAutopilotControls) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showControls, showAutopilotControls]);

  const handleSelectBook = (book: EpubBook) => {
    // Load existing progress from localStorage
    try {
      const progress = localStorage.getItem(`ulti-progress-${book.id}`);
      if (progress) {
        const { chapterIndex } = JSON.parse(progress);
        setCurrentChapterIndex(chapterIndex || 0);
      } else {
        setCurrentChapterIndex(0);
      }
    } catch (e) {
      setCurrentChapterIndex(0);
    }
    
    setCurrentBook(book);
    setViewMode('reader');
    setAutopilotActive(false);
    setSpeakOutActive(false);
  };

  return (
    <div className="app-container">
      {!hasSeenOnboarding && (
        <OnboardingModal onComplete={() => setHasSeenOnboarding(true)} />
      )}

      {viewMode === 'reader' && currentBook !== null ? (
        <>
          {showControls && (
            <FloatingControls 
              focusRadius={focusRadius} 
              setFocusRadius={setFocusRadius} 
              transitionSpeed={transitionSpeed}
              setTransitionSpeed={setTransitionSpeed}
              scaleAmplitude={scaleAmplitude}
              setScaleAmplitude={setScaleAmplitude}
              fadeAmplitude={fadeAmplitude}
              setFadeAmplitude={setFadeAmplitude}
              textAlign={textAlign}
              setTextAlign={setTextAlign}
              lineSpacing={lineSpacing}
              setLineSpacing={setLineSpacing}
              scrollSpeed={scrollSpeed}
              setScrollSpeed={setScrollSpeed}
            />
          )}

          {showAutopilotControls && (
            <AutopilotControls
              speechOffset={speechOffset}
              setSpeechOffset={setSpeechOffset}
              smoothingWindow={smoothingWindow}
              setSmoothingWindow={setSmoothingWindow}
              jumpThreshold={jumpThreshold}
              setJumpThreshold={setJumpThreshold}
              confidenceThreshold={confidenceThreshold}
              setConfidenceThreshold={setConfidenceThreshold}
              snapPhraseLength={snapPhraseLength}
              setSnapPhraseLength={setSnapPhraseLength}
            />
          )}
          
          <div className="main-content animate-fade-in">
            <header className="app-header">
              {/* Group 1: Navigation */}
              <div className="header-group nav-group">
                <button 
                  className="sensor-btn nav-btn"
                  onClick={() => {
                    setViewMode('dashboard');
                    setAutopilotActive(false);
                    setSpeakOutActive(false);
                  }}
                  title="Back to Library"
                >
                  <ArrowLeft size={16} />
                </button>
              </div>

              <div className="header-divider" />

              {/* Book title / Chapter Selector */}
              <div className="header-title-container">
                {currentBook.chapters.length > 1 ? (
                  <select 
                    className="chapter-select"
                    value={currentChapterIndex}
                    onChange={(e) => {
                      setCurrentChapterIndex(Number(e.target.value));
                      setAutopilotActive(false);
                      setSpeakOutActive(false);
                    }}
                    title="Select Chapter"
                  >
                    {currentBook.chapters.map((ch, idx) => (
                      <option key={idx} value={idx}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <h1 className="app-title" title={currentBook.title}>Ulti</h1>
                )}
              </div>

              <div className="header-divider" />

              {/* Group 2: Sync controls (Mic Autopilot / Speak Out TTS) */}
              <div className="header-group sync-group">
                <button 
                  className={`sensor-btn sync-btn ${autopilotActive && !speakOutActive ? 'active' : ''}`} 
                  onClick={() => {
                    setAutopilotActive(!autopilotActive);
                    setSpeakOutActive(false);
                  }}
                  title="Toggle Voice Autopilot (Speech Sync)"
                >
                  <Mic size={16} />
                </button>

                 <button 
                  className={`sensor-btn sync-btn speak-out-btn ${speakOutActive ? 'active' : ''}`} 
                  onClick={() => {
                    // Unlock audio stream synchronously during the user click gesture
                    const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA');
                    silent.play().catch(() => {});

                    const nextSpeakState = !speakOutActive;
                    setSpeakOutActive(nextSpeakState);
                    setAutopilotActive(nextSpeakState);
                  }}
                  title="Speak Out Aloud (Text-to-Speech)"
                >
                  <Volume2 size={16} />
                </button>
              </div>

              <div className="header-divider" />

              {/* Group 3: Settings Panels */}
              <div className="header-group settings-group">
                <button 
                  className={`sensor-btn settings-btn tuning-btn ${showAutopilotControls ? 'active' : ''}`} 
                  onClick={() => {
                    setShowAutopilotControls(!showAutopilotControls);
                    if (!showAutopilotControls) setShowControls(false);
                  }}
                  title="Autopilot Tuning Parameters"
                >
                  <Sliders size={16} />
                </button>

                <button 
                  className={`sensor-btn settings-btn format-btn ${showControls ? 'active' : ''}`} 
                  onClick={() => {
                    setShowControls(!showControls);
                    if (!showControls) setShowAutopilotControls(false);
                  }}
                  title="Visual Formatting Controls"
                >
                  <Settings2 size={16} />
                </button>
              </div>

              <div className="header-divider" />

              {/* Group 4: Pace / WPM control */}
              <div className="header-group wpm-group">
                <div className="wpm-control" title="Adjust Reading Pace (WPM)">
                  <button className="wpm-btn" onClick={() => setReadingPaceWPM(Math.max(50, readingPaceWPM - 5))}>
                    <Minus size={12} />
                  </button>
                  <span className="wpm-display">{readingPaceWPM} WPM</span>
                  <button className="wpm-btn" onClick={() => setReadingPaceWPM(Math.min(500, readingPaceWPM + 5))}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </header>
            
            <main className="app-main">
              <TextViewer 
                text={currentBook.chapters[currentChapterIndex].text} 
                focusRadius={focusRadius} 
                transitionSpeed={transitionSpeed}
                scaleAmplitude={scaleAmplitude}
                fadeAmplitude={fadeAmplitude}
                textAlign={textAlign}
                lineSpacing={lineSpacing}
                scrollSpeed={scrollSpeed}

                autoplayActive={autopilotActive} 
                setAutoplayActive={setAutopilotActive}
                voiceSyncActive={autopilotActive && !speakOutActive} // Mic disabled during Speech Synthesis
                readingPaceWPM={readingPaceWPM}
                setReadingPaceWPM={setReadingPaceWPM}
                speechOffset={speechOffset}
                smoothingWindow={smoothingWindow}
                jumpThreshold={jumpThreshold}
                confidenceThreshold={confidenceThreshold}
                snapPhraseLength={snapPhraseLength}

                speakOutActive={speakOutActive}
                setSpeakOutActive={setSpeakOutActive}
                selectedVoiceName={selectedVoiceName}
              />
            </main>
          </div>
        </>
      ) : (
        <div className="main-content">
          <Dashboard 
            books={books} 
            onSelectBook={handleSelectBook} 
            selectedVoice={selectedVoiceName}
            onSelectVoice={setSelectedVoiceName}
          />
        </div>
      )}
    </div>
  );
}

export default App;
