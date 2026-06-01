import React from 'react';
import { Mic, Activity, FastForward, ShieldCheck, Ruler } from 'lucide-react';
import './FloatingControls.css';

interface AutopilotControlsProps {
  speechOffset: number;
  setSpeechOffset: (v: number) => void;
  smoothingWindow: number;
  setSmoothingWindow: (v: number) => void;
  jumpThreshold: number;
  setJumpThreshold: (v: number) => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (v: number) => void;
  snapPhraseLength: number;
  setSnapPhraseLength: (v: number) => void;
}

const AutopilotControls: React.FC<AutopilotControlsProps> = ({
  speechOffset, setSpeechOffset,
  smoothingWindow, setSmoothingWindow,
  jumpThreshold, setJumpThreshold,
  confidenceThreshold, setConfidenceThreshold,
  snapPhraseLength, setSnapPhraseLength
}) => {
  return (
    <div className="floating-controls autopilot-controls">
      <div className="control-group" data-tooltip="Speech Offset: Words ahead to compensate for voice delay">
        <div className="control-icon"><Mic size={16} /></div>
        <input 
          type="range" className="horizontal-slider"
          min="0" max="5" step="1"
          value={speechOffset} onChange={(e) => setSpeechOffset(Number(e.target.value))}
        />
        <div className="control-value">{speechOffset}</div>
      </div>

      <div className="control-divider" />

      <div className="control-group" data-tooltip="Pace Smoothing: Average WPM over this many matches">
        <div className="control-icon"><Activity size={16} /></div>
        <input 
          type="range" className="horizontal-slider"
          min="1" max="20" step="1"
          value={smoothingWindow} onChange={(e) => setSmoothingWindow(Number(e.target.value))}
        />
        <div className="control-value">{smoothingWindow}</div>
      </div>

      <div className="control-divider" />

      <div className="control-group" data-tooltip="Jump Threshold: Max words allowed out of sync before hard snapping">
        <div className="control-icon"><FastForward size={16} /></div>
        <input 
          type="range" className="horizontal-slider"
          min="2" max="20" step="1"
          value={jumpThreshold} onChange={(e) => setJumpThreshold(Number(e.target.value))}
        />
        <div className="control-value">{jumpThreshold}</div>
      </div>

      <div className="control-divider" />

      <div className="control-group" data-tooltip="Confidence Level: Required probability to trust speech match">
        <div className="control-icon"><ShieldCheck size={16} /></div>
        <input 
          type="range" className="horizontal-slider"
          min="0.1" max="1.0" step="0.1"
          value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
        />
        <div className="control-value">{confidenceThreshold.toFixed(1)}</div>
      </div>

      <div className="control-divider" />

      <div className="control-group" data-tooltip="Snap Phrase: Required matching words to allow a hard jump">
        <div className="control-icon"><Ruler size={16} /></div>
        <input 
          type="range" className="horizontal-slider"
          min="1" max="10" step="1"
          value={snapPhraseLength} onChange={(e) => setSnapPhraseLength(Number(e.target.value))}
        />
        <div className="control-value">{snapPhraseLength}</div>
      </div>
    </div>
  );
};

export default AutopilotControls;
