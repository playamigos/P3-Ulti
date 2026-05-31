import React from 'react';
import './FloatingControls.css';

interface FloatingControlsProps {
  focusRadius: number;
  setFocusRadius: (radius: number) => void;
  transitionSpeed: number;
  setTransitionSpeed: (speed: number) => void;
  scaleAmplitude: number;
  setScaleAmplitude: (amp: number) => void;
  fadeAmplitude: number;
  setFadeAmplitude: (amp: number) => void;
  textAlign: string;
  setTextAlign: (align: string) => void;
  lineSpacing: number;
  setLineSpacing: (spacing: number) => void;
}

const FloatingControls: React.FC<FloatingControlsProps> = ({ 
  focusRadius, setFocusRadius, 
  transitionSpeed, setTransitionSpeed,
  scaleAmplitude, setScaleAmplitude,
  fadeAmplitude, setFadeAmplitude,
  textAlign, setTextAlign,
  lineSpacing, setLineSpacing
}) => {
  return (
    <div className="floating-controls">
      <div className="control-group">
        <div className="control-icon" title="Focus Width">👁️</div>
        <input 
          type="range" 
          className="horizontal-slider"
          min="0" 
          max="6" 
          step="1" 
          value={focusRadius} 
          onChange={(e) => setFocusRadius(Number(e.target.value))}
        />
        <div className="control-value">{focusRadius}</div>
      </div>

      <div className="control-divider" />

      <div className="control-group">
        <div className="control-icon" title="Scale Strength">🔍</div>
        <input 
          type="range" 
          className="horizontal-slider"
          min="0.5" 
          max="3.0" 
          step="0.1" 
          value={scaleAmplitude} 
          onChange={(e) => setScaleAmplitude(Number(e.target.value))}
        />
        <div className="control-value">{scaleAmplitude.toFixed(1)}</div>
      </div>

      <div className="control-divider" />

      <div className="control-group">
        <div className="control-icon" title="Background Fade">🌗</div>
        <input 
          type="range" 
          className="horizontal-slider"
          min="0.0" 
          max="0.95" 
          step="0.05" 
          value={fadeAmplitude} 
          onChange={(e) => setFadeAmplitude(Number(e.target.value))}
        />
        <div className="control-value">{(fadeAmplitude * 100).toFixed(0)}%</div>
      </div>

      <div className="control-divider" />

      <div className="control-group">
        <div className="control-icon" title="Smoothing Speed">⚡</div>
        <input 
          type="range" 
          className="horizontal-slider"
          min="0.05" 
          max="1.5" 
          step="0.05" 
          value={transitionSpeed} 
          onChange={(e) => setTransitionSpeed(Number(e.target.value))}
        />
        <div className="control-value">{transitionSpeed.toFixed(2)}s</div>
      </div>

      <div className="control-divider" />

      <div className="control-group">
        <button className={`icon-btn ${textAlign === 'left' ? 'active' : ''}`} onClick={() => setTextAlign('left')} title="Align Left">⬅️</button>
        <button className={`icon-btn ${textAlign === 'center' ? 'active' : ''}`} onClick={() => setTextAlign('center')} title="Align Center">↔️</button>
        <button className={`icon-btn ${textAlign === 'right' ? 'active' : ''}`} onClick={() => setTextAlign('right')} title="Align Right">➡️</button>
        <button className={`icon-btn ${textAlign === 'justify' ? 'active' : ''}`} onClick={() => setTextAlign('justify')} title="Justify">🔠</button>
      </div>

      <div className="control-divider" />

      <div className="control-group">
        <div className="control-icon" title="Line Spacing">↕️</div>
        <input 
          type="range" 
          className="horizontal-slider"
          min="2.5" 
          max="6.0" 
          step="0.5" 
          value={lineSpacing} 
          onChange={(e) => setLineSpacing(Number(e.target.value))}
        />
        <div className="control-value">{lineSpacing.toFixed(1)}</div>
      </div>
    </div>
  );
};

export default FloatingControls;
