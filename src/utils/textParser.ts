export interface ParsedParagraph {
  id: string;
  words: ParsedWord[];
}

export interface ParsedWord {
  id: string;
  text: string;
  globalIndex: number;
}

export function parseTextToWords(text: string): ParsedParagraph[] {
  const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
  let globalWordIndex = 0;
  
  return paragraphs.map((para, pIdx) => {
    // Split by whitespace
    const wordsRaw = para.trim().split(/\s+/);
    
    const words = wordsRaw.map((match, wIdx) => {
      const wordObj = {
        id: `p${pIdx}-w${wIdx}`,
        text: match,
        globalIndex: globalWordIndex
      };
      globalWordIndex++;
      return wordObj;
    });

    return {
      id: `p${pIdx}`,
      words
    };
  });
}
