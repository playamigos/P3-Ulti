import React from 'react';
import { Mic, Shield, Sparkles, X } from 'lucide-react';
import './OnboardingModal.css';

interface OnboardingModalProps {
  onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const requestMicAndClose = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop()); // Instantly release it
      } catch (err) {
        console.warn("Microphone permission denied or unavailable:", err);
      }
    }
    onComplete();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onComplete} title="Close"><X size={20} /></button>
        <div className="modal-icon-header">
          <Sparkles size={32} color="var(--accent-color)" />
        </div>
        <h2>Welcome to Ulti</h2>
        <p className="modal-subtitle">Your intelligent voice-synced teleprompter.</p>
        
        <div className="modal-features">
          <div className="feature-item">
            <Mic size={24} className="feature-icon" />
            <div className="feature-text">
              <h3>Read at your own pace</h3>
              <p>Turn on <strong>Autopilot</strong> and read aloud. Ulti uses your microphone to listen and seamlessly syncs the text to your voice.</p>
            </div>
          </div>
          
          <div className="feature-item">
            <Shield size={24} className="feature-icon" />
            <div className="feature-text">
              <h3>100% Private</h3>
              <p>Everything runs strictly on your device. We do not collect, store, or send any audio data anywhere. Your voice is yours alone.</p>
            </div>
          </div>
        </div>

        <button className="modal-cta" onClick={requestMicAndClose}>
          Allow Microphone & Start
        </button>
      </div>
    </div>
  );
};

export default OnboardingModal;
