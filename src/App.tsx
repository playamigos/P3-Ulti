import { useState } from 'react';
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

  return (
    <div className="app-container">
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
      />
      
      <div className="main-content">
        <header className="app-header">
          <h1 className="app-title">Ulti</h1>
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
          />
        </main>
      </div>
    </div>
  );
}

export default App;
