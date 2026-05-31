import { useEffect, useRef, useMemo } from 'react';

interface UseVoiceSyncProps {
  active: boolean;
  activeWordIndex: number | null;
  setActiveWordIndex: (index: number) => void;
  readingPaceWPM: number;
  setReadingPaceWPM: (wpm: number) => void;
  structuredParagraphs: { id: string, lines: any[][] }[] | null;
  onSpeechDetected: (phrase: string) => void;
}

export const useVoiceSync = ({
  active,
  activeWordIndex,
  setActiveWordIndex,
  readingPaceWPM,
  setReadingPaceWPM,
  structuredParagraphs,
  onSpeechDetected
}: UseVoiceSyncProps) => {
  const recognitionRef = useRef<any>(null);
  const lastMatchRef = useRef<{ index: number; time: number } | null>(null);

  // Flattened list of all words in order
  const allWords = useMemo(() => {
    if (!structuredParagraphs) return [];
    return structuredParagraphs.flatMap(p => p.lines.flatMap(l => l));
  }, [structuredParagraphs]);

  // Synchronize dynamic parameters using stable React refs
  // This prevents SpeechRecognition from stopping/restarting whenever the active word or WPM updates!
  const activeWordIndexRef = useRef(activeWordIndex);
  const readingPaceWPMRef = useRef(readingPaceWPM);
  const setActiveWordIndexRef = useRef(setActiveWordIndex);
  const setReadingPaceWPMRef = useRef(setReadingPaceWPM);
  const onSpeechDetectedRef = useRef(onSpeechDetected);
  const allWordsRef = useRef(allWords);

  useEffect(() => { activeWordIndexRef.current = activeWordIndex; }, [activeWordIndex]);
  useEffect(() => { readingPaceWPMRef.current = readingPaceWPM; }, [readingPaceWPM]);
  useEffect(() => { setActiveWordIndexRef.current = setActiveWordIndex; }, [setActiveWordIndex]);
  useEffect(() => { setReadingPaceWPMRef.current = setReadingPaceWPM; }, [setReadingPaceWPM]);
  useEffect(() => { onSpeechDetectedRef.current = onSpeechDetected; }, [onSpeechDetected]);
  useEffect(() => { allWordsRef.current = allWords; }, [allWords]);

  useEffect(() => {
    if (!active) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      lastMatchRef.current = null;
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const results = event.results;
      const latestResult = results[results.length - 1];
      if (!latestResult) return;

      const transcript = latestResult[0].transcript.toLowerCase();
      
      // Clean spoken words
      const spokenWords = transcript.trim().split(/\s+/).map((w: string) => 
        w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim()
      ).filter(Boolean);

      const currentActiveIdx = activeWordIndexRef.current;
      if (spokenWords.length === 0 || currentActiveIdx === null) return;

      const searchAllWords = allWordsRef.current;
      const spokenLength = spokenWords.length;
      
      let bestMatchGlobalIndex: number | null = null;
      let bestMatchText: string = '';
      
      const maxPhraseLength = Math.min(5, spokenLength);
      
      for (let phraseLen = maxPhraseLength; phraseLen >= 1; phraseLen--) {
         const targetPhrase = spokenWords.slice(-phraseLen);
         
         // Search window: ~150 words behind to ~250 words ahead (covers visible page)
         let searchStart = Math.max(0, currentActiveIdx - 150);
         let searchEnd = Math.min(searchAllWords.length, currentActiveIdx + 250);
         
         if (phraseLen === 1) {
            // For single words, restrict to a tight forward window to prevent random jumps
            searchStart = currentActiveIdx;
            searchEnd = Math.min(searchAllWords.length, currentActiveIdx + 25);
         }
         
         let closestMatchIdx = -1;
         let minDistance = Infinity;

         for (let i = searchStart; i <= searchEnd - phraseLen; i++) {
            let match = true;
            for (let j = 0; j < phraseLen; j++) {
               const textWord = searchAllWords[i + j].text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
               if (textWord !== targetPhrase[j]) {
                  match = false;
                  break;
               }
            }
            
            if (match) {
               const distance = Math.abs(i - currentActiveIdx);
               if (distance < minDistance) {
                  minDistance = distance;
                  closestMatchIdx = i;
               }
            }
         }
         
         if (closestMatchIdx !== -1) {
            bestMatchGlobalIndex = searchAllWords[closestMatchIdx + phraseLen - 1].globalIndex;
            bestMatchText = searchAllWords[closestMatchIdx + phraseLen - 1].text;
            break; // Found the longest possible match
         }
      }

      // If we found a valid match and it is a progression or jump, update position and WPM
      if (bestMatchGlobalIndex !== null && bestMatchGlobalIndex !== currentActiveIdx) {
        const now = performance.now();
        setActiveWordIndexRef.current(bestMatchGlobalIndex);
        onSpeechDetectedRef.current(bestMatchText); // Report matched word text back to visual HUD

        if (lastMatchRef.current) {
          const deltaWords = bestMatchGlobalIndex - lastMatchRef.current.index;
          const deltaTimeSec = (now - lastMatchRef.current.time) / 1000;

          // Check speed limits to avoid noise spikes. Allow backward jumps without affecting WPM negatively.
          if (deltaWords > 0 && deltaWords < 50 && deltaTimeSec > 0.2 && deltaTimeSec < 8) {
            const instantWPM = (deltaWords / deltaTimeSec) * 60;
            const currentPaceWPM = readingPaceWPMRef.current;
            if (instantWPM >= 80 && instantWPM <= 450) {
              const newWPM = Math.round(currentPaceWPM * 0.8 + instantWPM * 0.2);
              setReadingPaceWPMRef.current(newWPM);
            }
          }
        }

        lastMatchRef.current = { index: bestMatchGlobalIndex, time: now };
      }
    };

    recognition.onerror = (err: any) => {
      console.warn('Speech recognition error:', err.error);
      if (active && err.error !== 'aborted') {
        setTimeout(() => {
          if (active && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      if (active) {
        setTimeout(() => {
          if (active && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Speech recognition start failed:', e);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, [active]);
};
