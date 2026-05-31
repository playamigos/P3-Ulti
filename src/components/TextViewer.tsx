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

interface MeasuredWord extends ParsedWord {
  width: number;
}

const TextViewer: React.FC<TextViewerProps> = ({ text, focusRadius, transitionSpeed, scaleAmplitude, fadeAmplitude, textAlign, lineSpacing }) => {
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [structuredParagraphs, setStructuredParagraphs] = useState<{ id: string, lines: MeasuredWord[][] }[] | null>(null);
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
    const newStructured: { id: string, lines: MeasuredWord[][] }[] = [];
    
    pElements.forEach((pEl, pIndex) => {
      const pData = parsedParagraphs[pIndex];
      if (!pData) return;
      const wordElements = pEl.querySelectorAll('.word-measure');
      
      const linesMap: { [offsetTop: number]: MeasuredWord[] } = {};
      
      wordElements.forEach((wordEl, wIndex) => {
        const top = (wordEl as HTMLElement).offsetTop;
        const width = (wordEl as HTMLElement).offsetWidth;
        const wordData = pData.words[wIndex];
        if (!wordData) return;

        if (!linesMap[top]) linesMap[top] = [];
        linesMap[top].push({
          ...wordData,
          width
        });
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

              // Calculate scales for each word in the line
              const lineWithStyles = line.map((word) => {
                const baseStyle = { 
                  transitionDuration: `${transitionSpeed}s`,
                  color: 'var(--text-primary)'
                };
                
                const baselineOpacity = 1 - fadeAmplitude;
                let scale = 1;
                let opacity = baselineOpacity;
                let fontWeight: number | string = 400;

                if (activeWordIndex !== null) {
                  const distance = Math.abs(word.globalIndex - activeWordIndex);
                  
                  if (distance === 0) {
                    scale = 1 + (0.7 * scaleAmplitude);
                    opacity = 1;
                    fontWeight = 700;
                  } else if (distance <= focusRadius) {
                    const ratio = 1 - (distance / (focusRadius + 1));
                    scale = 1 + (0.7 * scaleAmplitude * ratio);
                    opacity = baselineOpacity + ((1 - baselineOpacity) * ratio);
                    fontWeight = ratio > 0.5 ? 600 : 500;
                  }
                }

                return {
                  word,
                  scale,
                  opacity,
                  fontWeight,
                  baseStyle
                };
              });

              // Find the index of the word with the maximum scale
              let maxScaleIndex = 0;
              let maxScale = 0;
              lineWithStyles.forEach((item, idx) => {
                if (item.scale > maxScale) {
                  maxScale = item.scale;
                  maxScaleIndex = idx;
                }
              });

              const A = maxScaleIndex;

              // Calculate shifts (translations) for each word
              const shifts = new Array(line.length).fill(0);
              
              if (activeWordIndex !== null) {
                shifts[A] = 0;

                // Words to the right
                for (let i = A + 1; i < line.length; i++) {
                  const prevItem = lineWithStyles[i - 1];
                  const currentItem = lineWithStyles[i];
                  shifts[i] = shifts[i - 1] + 
                    0.5 * (prevItem.scale - 1) * prevItem.word.width + 
                    0.5 * (currentItem.scale - 1) * currentItem.word.width;
                }

                // Words to the left
                for (let i = A - 1; i >= 0; i--) {
                  const nextItem = lineWithStyles[i + 1];
                  const currentItem = lineWithStyles[i];
                  shifts[i] = shifts[i + 1] - 
                    0.5 * (nextItem.scale - 1) * nextItem.word.width - 
                    0.5 * (currentItem.scale - 1) * currentItem.word.width;
                }
              }

              return (
                <div key={lIdx} className="line" style={{ justifyContent, height: `${lineSpacing}rem` }}>
                  {lineWithStyles.map((item, idx) => {
                    const shift = shifts[idx];
                    const style = {
                      ...item.baseStyle,
                      opacity: item.opacity,
                      fontWeight: item.fontWeight,
                      transform: `translateX(${shift}px) scale(${item.scale})`
                    };

                    return (
                      <span
                        key={item.word.id}
                        className="word"
                        style={style}
                        onMouseEnter={() => setActiveWordIndex(item.word.globalIndex)}
                      >
                        {item.word.text}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TextViewer;
