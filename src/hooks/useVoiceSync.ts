import { useEffect, useRef, useMemo } from 'react';

interface UseVoiceSyncProps {
  active: boolean;
  activeWordIndex: number | null;
  setActiveWordIndex: (index: number) => void;
  readingPaceWPM: number;
  setReadingPaceWPM: (wpm: number) => void;
  structuredParagraphs: { id: string, lines: any[][] }[] | null;
  onSpeechDetected: (phrase: string) => void;
  speechOffset: number;
  smoothingWindow: number;
  jumpThreshold: number;
  confidenceThreshold: number;
  snapPhraseLength: number;
}

export const useVoiceSync = ({
  active,
  activeWordIndex,
  setActiveWordIndex,
  readingPaceWPM,
  setReadingPaceWPM,
  structuredParagraphs,
  onSpeechDetected,
  speechOffset,
  smoothingWindow,
  jumpThreshold,
  confidenceThreshold,
  snapPhraseLength
}: UseVoiceSyncProps) => {
  const recognitionRef = useRef<any>(null);
  const lastMatchRef = useRef<{ index: number; time: number } | null>(null);
  const wpmHistoryRef = useRef<number[]>([]);

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
  const speechOffsetRef = useRef(speechOffset);
  const smoothingWindowRef = useRef(smoothingWindow);
  const jumpThresholdRef = useRef(jumpThreshold);
  const confidenceThresholdRef = useRef(confidenceThreshold);
  const snapPhraseLengthRef = useRef(snapPhraseLength);

  useEffect(() => { activeWordIndexRef.current = activeWordIndex; }, [activeWordIndex]);
  useEffect(() => { readingPaceWPMRef.current = readingPaceWPM; }, [readingPaceWPM]);
  useEffect(() => { setActiveWordIndexRef.current = setActiveWordIndex; }, [setActiveWordIndex]);
  useEffect(() => { setReadingPaceWPMRef.current = setReadingPaceWPM; }, [setReadingPaceWPM]);
  useEffect(() => { onSpeechDetectedRef.current = onSpeechDetected; }, [onSpeechDetected]);
  useEffect(() => { allWordsRef.current = allWords; }, [allWords]);
  useEffect(() => { speechOffsetRef.current = speechOffset; }, [speechOffset]);
  useEffect(() => { smoothingWindowRef.current = smoothingWindow; }, [smoothingWindow]);
  useEffect(() => { jumpThresholdRef.current = jumpThreshold; }, [jumpThreshold]);
  useEffect(() => { confidenceThresholdRef.current = confidenceThreshold; }, [confidenceThreshold]);
  useEffect(() => { snapPhraseLengthRef.current = snapPhraseLength; }, [snapPhraseLength]);

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
      wpmHistoryRef.current = [];
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
      const confidence = latestResult[0].confidence || 1.0;
      
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
      let bestMatchPhraseLen = 0;
      
      const maxPhraseLength = Math.min(10, spokenLength); // Allow scanning up to 10 words
      
      for (let phraseLen = maxPhraseLength; phraseLen >= 1; phraseLen--) {
         const targetPhrase = spokenWords.slice(-phraseLen);
         
         // Search window: ~150 words behind to ~250 words ahead (covers visible page)
         let searchStart = Math.max(0, currentActiveIdx - 150);
         let searchEnd = Math.min(searchAllWords.length, currentActiveIdx + 250);
         
         if (phraseLen === 1) {
            // For single words, restrict to a tight forward window to prevent random jumps
            searchStart = currentActiveIdx;
            searchEnd = Math.min(searchAllWords.length, currentActiveIdx + 5);
         } else if (phraseLen === 2) {
            // For two words, moderate window
            searchStart = Math.max(0, currentActiveIdx - 20);
            searchEnd = Math.min(searchAllWords.length, currentActiveIdx + 50);
         }
         
         let closestMatchIdx = -1;
         let minDistance = Infinity;

         for (let i = searchStart; i <= searchEnd - phraseLen; i++) {
            let match = true;
            for (let j = 0; j < phraseLen; j++) {
               if (!searchAllWords[i + j]) {
                  match = false;
                  break;
               }
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
            const distance = minDistance;
            const isSharpJump = distance > jumpThresholdRef.current;
            
            // Audio detection should not make sharp jump without good probability and phrase match
            if (isSharpJump) {
               if (phraseLen < snapPhraseLengthRef.current) continue; // Require minimum phrase length to jump
               if (confidence < confidenceThresholdRef.current && phraseLen < snapPhraseLengthRef.current + 2) continue; // Require good confidence or even longer phrase for jumps
            }
            
            // If confidence is really low, reject short phrases
            if (confidence < 0.5 && phraseLen < 2) continue;

            bestMatchGlobalIndex = searchAllWords[closestMatchIdx + phraseLen - 1].globalIndex;
            bestMatchText = searchAllWords[closestMatchIdx + phraseLen - 1].text;
            bestMatchPhraseLen = phraseLen;
            break; // Found the longest possible match
         }
      }

      // If we found a valid match and it is a progression or jump, update position and WPM
      if (bestMatchGlobalIndex !== null && bestMatchGlobalIndex !== currentActiveIdx) {
        const now = performance.now();
        
        // Add the forward offset to compensate for API detection delay
        const maxIndex = searchAllWords.length > 0 ? searchAllWords[searchAllWords.length - 1].globalIndex : currentActiveIdx;
        const targetGlobalIndex = Math.min(maxIndex, bestMatchGlobalIndex + speechOffsetRef.current);

        const deltaFromCurrent = targetGlobalIndex - currentActiveIdx;
        
        // Prevent oscillation: do not snap visual position if the match is close.
        // Use the Jump Threshold to define the forward "no-snap" zone.
        // For backward lag, use a much larger buffer because the API frequently delays results by several seconds.
        const isSmallForward = deltaFromCurrent >= 0 && deltaFromCurrent <= jumpThresholdRef.current;
        const isBackwardLag = deltaFromCurrent < 0 && Math.abs(deltaFromCurrent) <= Math.max(30, jumpThresholdRef.current * 3);
        
        if (!isSmallForward && !isBackwardLag) {
           setActiveWordIndexRef.current(targetGlobalIndex);
        }
        
        onSpeechDetectedRef.current(bestMatchText); // Always report matched word text back to visual HUD

        if (lastMatchRef.current) {
          const deltaWords = targetGlobalIndex - lastMatchRef.current.index;
          const deltaTimeSec = (now - lastMatchRef.current.time) / 1000;

          // Check speed limits to avoid noise spikes. Allow backward jumps without affecting WPM negatively.
          // Update pace only based on phrase matches to ensure accuracy.
          if (bestMatchPhraseLen >= 2 && deltaWords > 0 && deltaWords < 50 && deltaTimeSec > 0.2 && deltaTimeSec < 8) {
            const instantWPM = (deltaWords / deltaTimeSec) * 60;
            const currentPaceWPM = readingPaceWPMRef.current;
            if (instantWPM >= 80 && instantWPM <= 450) {
              
              if (wpmHistoryRef.current.length === 0) {
                 wpmHistoryRef.current = Array(5).fill(currentPaceWPM);
               }
              
              wpmHistoryRef.current.push(instantWPM);
              if (wpmHistoryRef.current.length > smoothingWindowRef.current) {
                 wpmHistoryRef.current.shift();
              }
              
              const averageWPM = wpmHistoryRef.current.reduce((a, b) => a + b, 0) / wpmHistoryRef.current.length;
              let newWPM = Math.round(averageWPM);
              
              // If user is ahead, increase pace slightly more aggressively to match them
              if (deltaFromCurrent > 0 && instantWPM > currentPaceWPM) {
                 newWPM = Math.round(averageWPM * 0.7 + instantWPM * 0.3);
              }
              
              setReadingPaceWPMRef.current(newWPM);
            }
          }
        }

        lastMatchRef.current = { index: targetGlobalIndex, time: now };
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
