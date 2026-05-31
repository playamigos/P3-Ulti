import React from 'react';
import { Eye, ZoomIn, Moon, Zap, AlignLeft, AlignCenter, AlignRight, AlignJustify, MoveVertical, ChevronsDown } from 'lucide-react';
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
  scrollSpeed: number;
  setScrollSpeed: (speed: number) => void;
}

const FloatingControls: React.FC<FloatingControlsProps> = ({ 
  focusRadius, setFocusRadius, 
  transitionSpeed, setTransitionSpeed,
  scaleAmplitude, setScaleAmplitude,
  fadeAmplitude, setFadeAmplitude,
  textAlign, setTextAlign,
  lineSpacing, setLineSpacing,
  scrollSpeed, setScrollSpeed
}) => {
  return (
    <div className="floating-controls">
      <div className="control-group" data-tooltip="Focus Width: Number of words highlighted">
        <div className="control-icon"><Eye size={16} /></div>
        <input 
          type="range" 
          className="horizontal-slider"
          min="0" 
          max="12" 
          step="1" 
          value={focusRadius} 
          onChange={(e) => setFocusRadius(Number(e.target.value))}
        />
        <div className="control-value">{focusRadius}</div>
      </div>

      <div className="control-divider" />

      <div className="control-group" data-tooltip="Scale Strength: Magnification of focused word">
        <div className="control-icon"><ZoomIn size={16} /></div>
        <input 
          type="range" 
          className="horizontal-slider"
          min="0.0" 
          max="3.0" 
          step="0.1" 
          value={scaleAmplitude} 
          onChange={(e) => setScaleAmplitude(Number(e.target.value))}
        />
        <div className="control-value">{scaleAmplitude.toFixed(1)}</div>
      </div>

      <div className="control-divider" />

      <div className="control-group" data-tooltip="Background Fade: Dimming of unfocused text">
        <div className="control-icon"><Moon size={16} /></div>
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

      <div className="control-group" data-tooltip="Smoothing Speed: Animation transition duration">
        <div className="control-icon"><Zap size={16} /></div>
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
        <button className={`icon-btn ${textAlign === 'left' ? 'active' : ''}`} onClick={() => setTextAlign('left')} data-tooltip="Align Left"><AlignLeft size={16} /></button>
        <button className={`icon-btn ${textAlign === 'center' ? 'active' : ''}`} onClick={() => setTextAlign('center')} data-tooltip="Align Center"><AlignCenter size={16} /></button>
        <button className={`icon-btn ${textAlign === 'right' ? 'active' : ''}`} onClick={() => setTextAlign('right')} data-tooltip="Align Right"><AlignRight size={16} /></button>
        <button className={`icon-btn ${textAlign === 'justify' ? 'active' : ''}`} onClick={() => setTextAlign('justify')} data-tooltip="Justify"><AlignJustify size={16} /></button>
      </div>

      <div className="control-divider" />

      <div className="control-group" data-tooltip="Line Spacing: Vertical distance between lines">
        <div className="control-icon"><MoveVertical size={16} /></div>
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

      <div className="control-divider" />

      <div className="control-group" data-tooltip="Auto-Scroll Speed: Smoothness of line transitions">
        <div className="control-icon"><ChevronsDown size={16} /></div>
        <input 
          type="range" 
          className="horizontal-slider"
          min="0.01" 
          max="0.20" 
          step="0.01" 
          value={scrollSpeed} 
          onChange={(e) => setScrollSpeed(Number(e.target.value))}
        />
        <div className="control-value">{scrollSpeed.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default FloatingControls;
