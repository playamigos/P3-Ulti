import React, { useState, useMemo, useEffect, useRef } from 'react';
import './TextViewer.css';
import { parseTextToWords, type ParsedWord } from '../utils/textParser';

interface TextViewerProps {
  text: string;
  focusRadius: number;
  transitionSpeed: number;
  scaleAmplitude: number;
  fadeAmplitude: number;
  textAlign: string;
  lineSpacing: number;
}

const TextViewer: React.FC<TextViewerProps> = ({ text, focusRadius, transitionSpeed, scaleAmplitude, fadeAmplitude, textAlign, lineSpacing }) => {
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [structuredParagraphs, setStructuredParagraphs] = useState<{ id: string, lines: ParsedWord[][] }[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const parsedParagraphs = useMemo(() => parseTextToWords(text), [text]);

  // Handle window resize by forcing a re-measure
  useEffect(() => {
    const handleResize = () => setStructuredParagraphs(null);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Measurement effect
  useEffect(() => {
    if (structuredParagraphs !== null || !containerRef.current) return;

    const pElements = containerRef.current.querySelectorAll('.reader-paragraph-measure');
    const newStructured: { id: string, lines: ParsedWord[][] }[] = [];
    
    pElements.forEach((pEl, pIndex) => {
      const pData = parsedParagraphs[pIndex];
      const wordElements = pEl.querySelectorAll('.word-measure');
      
      const linesMap: { [offsetTop: number]: ParsedWord[] } = {};
      
      wordElements.forEach((wordEl, wIndex) => {
        const top = (wordEl as HTMLElement).offsetTop;
        if (!linesMap[top]) linesMap[top] = [];
        linesMap[top].push(pData.words[wIndex]);
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

  const getStyleForWord = (globalIndex: number) => {
    const baseStyle = { 
      transitionDuration: `${transitionSpeed}s`,
      color: 'var(--text-primary)'
    };
    
    // Baseline dull opacity is inverse of fade amplitude
    const baselineOpacity = 1 - fadeAmplitude;

    if (activeWordIndex === null) {
      return { ...baseStyle, fontSize: '1rem', opacity: baselineOpacity };
    }
    
    const distance = Math.abs(globalIndex - activeWordIndex);
    
    if (distance === 0) {
      const scale = 1 + (0.7 * scaleAmplitude);
      return { ...baseStyle, fontSize: `${scale}rem`, opacity: 1, fontWeight: 700 };
    }
    
    if (distance <= focusRadius) {
      const ratio = 1 - (distance / (focusRadius + 1));
      const scale = 1 + (0.7 * scaleAmplitude * ratio);
      const opac = baselineOpacity + ((1 - baselineOpacity) * ratio);
      
      return { 
        ...baseStyle,
        fontSize: `${scale}rem`, 
        opacity: opac,
        fontWeight: ratio > 0.5 ? 600 : 500
      };
    }

    return { ...baseStyle, fontSize: '1rem', opacity: baselineOpacity };
  };

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
    <div className="text-viewer">
      <div className="reader-container">
        {structuredParagraphs.map((paragraph) => (
          <div key={paragraph.id} className="reader-paragraph">
            {paragraph.lines.map((line, lIdx) => {
              let justifyContent = 'center';
              if (textAlign === 'left') justifyContent = 'flex-start';
              if (textAlign === 'right') justifyContent = 'flex-end';
              if (textAlign === 'justify') justifyContent = 'space-between';

              return (
              <div key={lIdx} className="line" style={{ justifyContent, height: `${lineSpacing}rem` }}>
                {line.map((word) => (
                  <span
                    key={word.id}
                    className="word"
                    style={getStyleForWord(word.globalIndex)}
                    onMouseEnter={() => setActiveWordIndex(word.globalIndex)}
                  >
                    {word.text}
                  </span>
                ))}
              </div>
            )})}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TextViewer;
