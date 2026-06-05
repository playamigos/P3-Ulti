import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Check, Trash2, Loader2, Volume2 } from 'lucide-react';
import type { EpubBook } from '../data/learningBooks';
import { PIPER_VOICES } from '../data/learningBooks';
import * as tts from '@mintplex-labs/piper-tts-web';
import './Dashboard.css';

interface DashboardProps {
  books: EpubBook[];
  onSelectBook: (book: EpubBook) => void;
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  books,
  onSelectBook,
  selectedVoice,
  onSelectVoice
}) => {
  const [storedVoices, setStoredVoices] = useState<string[]>([]);
  const [downloadingVoices, setDownloadingVoices] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadStored = async () => {
      try {
        const stored = await tts.stored();
        setStoredVoices(stored);
      } catch (e) {
        console.error('Error loading stored voices:', e);
      }
    };
    loadStored();
  }, []);

  const handleDownload = async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingVoices[voiceId] !== undefined) return;
    
    setDownloadingVoices(prev => ({ ...prev, [voiceId]: 0 }));
    
    try {
      await tts.download(voiceId, (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        setDownloadingVoices(prev => ({ ...prev, [voiceId]: percent }));
      });
      const stored = await tts.stored();
      setStoredVoices(stored);
    } catch (err) {
      console.error(`Error downloading voice ${voiceId}:`, err);
      alert(`Download failed for ${voiceId}. Check your connection and try again.`);
    } finally {
      setDownloadingVoices(prev => {
        const copy = { ...prev };
        delete copy[voiceId];
        return copy;
      });
    }
  };

  const handleDelete = async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this offline cached voice model?')) return;
    try {
      const root = await navigator.storage.getDirectory();
      const dir = await root.getDirectoryHandle("piper");
      try {
        await dir.removeEntry(`${voiceId}.onnx`);
      } catch (err) {
        console.warn(`Could not delete ONNX file for ${voiceId}:`, err);
      }
      try {
        await dir.removeEntry(`${voiceId}.onnx.json`);
      } catch (err) {
        console.warn(`Could not delete JSON file for ${voiceId}:`, err);
      }
      
      const stored = await tts.stored();
      setStoredVoices(stored);
    } catch (err) {
      console.error(`Error removing voice ${voiceId}:`, err);
    }
  };

  const handleSelectVoice = (voiceId: string) => {
    onSelectVoice(voiceId);
  };

  // Generate a distinct visual cover gradient based on the book's title
  const getGradientForTitle = (title: string): string => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 50) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 60%, 45%) 0%, hsl(${hue2}, 70%, 25%) 100%)`;
  };

  // Get reading progress for a book from localStorage
  const getBookProgress = (bookId: string, totalChapters: number) => {
    try {
      const stored = localStorage.getItem(`ulti-progress-${bookId}`);
      if (stored) {
        const { chapterIndex, completed } = JSON.parse(stored);
        if (completed) {
          return { percent: 100, text: 'Completed 100%' };
        }
        // Progress as percentage of chapters completed
        // (e.g. if on chapter 2 of 3, 1 chapter is completed = 33%)
        const percent = Math.round((chapterIndex / totalChapters) * 100);
        return { 
          percent, 
          text: `Chapter ${chapterIndex + 1} of ${totalChapters} (${percent}% read)` 
        };
      }
    } catch (e) {}
    return { percent: 0, text: 'Not started (0% read)' };
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header animate-fade-in">
        <h1 className="logo-title">Ulti</h1>
        <p className="dashboard-subtitle">Select an educational course or book from your library to begin focused training.</p>
      </div>

      <div className="dashboard-content">
        <div className="library-section">
          <div className="library-grid">
            {books.map((book) => {
              const { percent, text } = getBookProgress(book.id, book.chapters.length);
              
              return (
                <div key={book.id} className="book-card" onClick={() => onSelectBook(book)}>
                  <div className="book-cover" style={{ background: getGradientForTitle(book.title) }}>
                    <div className="book-cover-overlay">
                      <BookOpen size={24} className="cover-icon" />
                      <div className="cover-title">{book.title}</div>
                    </div>
                  </div>
                  <div className="book-info">
                    <div className="book-meta">
                      <h3 className="book-title" title={book.title}>{book.title}</h3>
                      <p className="book-author">{book.author}</p>
                      
                      <div className="progress-container">
                        <div className="progress-bar-wrapper">
                          <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="progress-text">{text}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="voice-manager-section animate-fade-in">
          <div className="voice-manager-header">
            <Volume2 className="voice-header-icon" size={24} />
            <div className="voice-header-text">
              <h2 className="voice-manager-title">Speech Voice Manager</h2>
              <p className="voice-manager-subtitle">
                Download premium neural voices to read your books entirely offline.
                Downloaded files are cached locally in your browser's private storage.
              </p>
            </div>
          </div>

          <div className="voices-grid">
            {PIPER_VOICES.map((voice) => {
              const isDownloaded = storedVoices.includes(voice.id);
              const downloadPercent = downloadingVoices[voice.id];
              const isDownloading = downloadPercent !== undefined;
              const isSelected = selectedVoice === voice.id;

              return (
                <div 
                  key={voice.id} 
                  className={`voice-card ${isSelected ? 'selected' : ''} ${isDownloaded ? 'ready' : ''}`}
                  onClick={() => handleSelectVoice(voice.id)}
                >
                  <div className="voice-card-body">
                    <div className="voice-card-info">
                      <div className="voice-name-row">
                        <h4 className="voice-name">{voice.name}</h4>
                        <span className={`voice-gender-tag ${voice.gender.toLowerCase()}`}>
                          {voice.gender}
                        </span>
                        {isSelected && (
                          <span className="voice-default-tag">
                            ★ Default
                          </span>
                        )}
                      </div>
                      <p className="voice-quality">{voice.quality}</p>
                      <span className={`voice-card-default-status ${isSelected ? 'selected' : ''}`}>
                        {isSelected ? '★ Default Reader Voice' : 'Set as Default Reader Voice'}
                      </span>
                    </div>

                    <div className="voice-actions">
                      {isDownloading ? (
                        <div className="voice-download-progress">
                          <Loader2 className="animate-spin text-indigo" size={18} />
                          <span className="progress-percent-text">{downloadPercent}%</span>
                        </div>
                      ) : isDownloaded ? (
                        <div className="voice-status-actions">
                          <div className="offline-badge">
                            <Check size={16} />
                            <span>Offline</span>
                          </div>
                          <button 
                            className="voice-delete-btn" 
                            title="Delete downloaded model"
                            onClick={(e) => handleDelete(voice.id, e)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="voice-download-btn"
                          onClick={(e) => handleDownload(voice.id, e)}
                        >
                          <Download size={16} />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {isDownloading && (
                    <div className="voice-card-progress-bar">
                      <div className="voice-card-progress-fill" style={{ width: `${downloadPercent}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
