import { useEffect, useState } from 'react';
import { Play, Settings2 } from 'lucide-react';
import './App.css';
import TextViewer from './components/TextViewer';
import FloatingControls from './components/FloatingControls';
import { sampleText } from './data/sampleText';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [focusRadius, setFocusRadius] = useLocalStorage<number>('ulti-focusRadius', 6);
  const [transitionSpeed, setTransitionSpeed] = useLocalStorage<number>('ulti-transitionSpeed', 0.90);
  const [scaleAmplitude, setScaleAmplitude] = useLocalStorage<number>('ulti-scaleAmplitude', 0.5);
  const [fadeAmplitude, setFadeAmplitude] = useLocalStorage<number>('ulti-fadeAmplitude', 0.4);
  const [textAlign, setTextAlign] = useLocalStorage<string>('ulti-textAlign', 'center');
  const [lineSpacing, setLineSpacing] = useLocalStorage<number>('ulti-lineSpacing', 3.5);
  const [scrollSpeed, setScrollSpeed] = useLocalStorage<number>('ulti-scrollSpeed', 0.05);

  // Phase 3 Sensor Integrations States
  // Single Autopilot state triggers autoplay and speech recognition concurrently
  const [autopilotActive, setAutopilotActive] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  
  const [readingPaceWPM, setReadingPaceWPM] = useLocalStorage<number>('ulti-readingPaceWPM', 200);

  // Preemptively request microphone permission on load to make Autopilot completely frictionless
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // Instantly release it, browser will remember permission for later voice sync
          stream.getTracks().forEach(t => t.stop());
        })
        .catch(err => {
          console.warn("Microphone permission denied or unavailable on load:", err);
        });
    }
  }, []);

  return (
    <div className="app-container">
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
              className={`sensor-btn controls-btn ${showControls ? 'active' : ''}`} 
              onClick={() => setShowControls(!showControls)}
              title="Toggle Formatting Controls"
            >
              <Settings2 size={15} /> Controls
            </button>
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
          />
        </main>
      </div>
    </div>
  );
}

export default App;
