import { useEffect, useState } from 'react';
import { Play, Settings2, Sliders, Plus, Minus } from 'lucide-react';
import './App.css';
import TextViewer from './components/TextViewer';
import FloatingControls from './components/FloatingControls';
import AutopilotControls from './components/AutopilotControls';
import OnboardingModal from './components/OnboardingModal';
import { sampleText } from './data/sampleText';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [focusRadius, setFocusRadius] = useLocalStorage<number>('ulti-focusRadius', 12);
  const [transitionSpeed, setTransitionSpeed] = useLocalStorage<number>('ulti-transitionSpeed', 1.50);
  const [scaleAmplitude, setScaleAmplitude] = useLocalStorage<number>('ulti-scaleAmplitude', 0.2);
  const [fadeAmplitude, setFadeAmplitude] = useLocalStorage<number>('ulti-fadeAmplitude', 0.3);
  const [textAlign, setTextAlign] = useLocalStorage<string>('ulti-textAlign', 'left');
  const [lineSpacing, setLineSpacing] = useLocalStorage<number>('ulti-lineSpacing', 2.5);
  const [scrollSpeed, setScrollSpeed] = useLocalStorage<number>('ulti-scrollSpeed', 0.01);

  // Phase 3 Sensor Integrations States
  // Single Autopilot state triggers autoplay and speech recognition concurrently
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

  return (
    <div className="app-container">
      {!hasSeenOnboarding && (
        <OnboardingModal onComplete={() => setHasSeenOnboarding(true)} />
      )}

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
      
      <div className="main-content">
        <header className="app-header">
          <h1 className="app-title">Ulti</h1>
          <div className="header-actions">
            <button 
              className={`sensor-btn autopilot-btn ${autopilotActive ? 'active' : ''}`} 
              onClick={() => setAutopilotActive(!autopilotActive)}
              title="Toggle Voice Autopilot"
            >
              <Play size={15} fill={autopilotActive ? "currentColor" : "none"} /> {autopilotActive ? 'Autopilot On' : 'Autopilot'}
            </button>
            <button 
              className={`sensor-btn controls-btn ${showAutopilotControls ? 'active' : ''}`} 
              style={{ padding: '0.5rem 0.6rem', marginLeft: '-0.25rem' }}
              onClick={() => {
                setShowAutopilotControls(!showAutopilotControls);
                if (!showAutopilotControls) setShowControls(false);
              }}
              title="Autopilot Settings"
            >
              <Sliders size={16} />
            </button>
            <button 
              className={`sensor-btn controls-btn ${showControls ? 'active' : ''}`} 
              onClick={() => {
                setShowControls(!showControls);
                if (!showControls) setShowAutopilotControls(false);
              }}
              title="Toggle Formatting Controls"
            >
              <Settings2 size={15} /> Controls
            </button>

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
            text={sampleText} 
            focusRadius={focusRadius} 
            transitionSpeed={transitionSpeed}
            scaleAmplitude={scaleAmplitude}
            fadeAmplitude={fadeAmplitude}
            textAlign={textAlign}
            lineSpacing={lineSpacing}
            scrollSpeed={scrollSpeed}

            // Sync all sensors and auto-advance engines directly to autopilot state
            autoplayActive={autopilotActive}
            setAutoplayActive={setAutopilotActive}
            voiceSyncActive={autopilotActive}
            readingPaceWPM={readingPaceWPM}
            setReadingPaceWPM={setReadingPaceWPM}
            speechOffset={speechOffset}
            smoothingWindow={smoothingWindow}
            jumpThreshold={jumpThreshold}
            confidenceThreshold={confidenceThreshold}
            snapPhraseLength={snapPhraseLength}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
