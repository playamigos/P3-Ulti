import { sampleText } from './sampleText';

export interface EpubBook {
  id: string;
  title: string;
  author: string;
  chapters: { title: string; text: string }[];
}

export interface PiperVoice {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  quality: string;
}

export const PIPER_VOICES: PiperVoice[] = [
  { id: 'en_US-hfc_female-medium', name: 'Samantha (HFC)', gender: 'Female', quality: 'High (Clear)' },
  { id: 'en_US-amy-medium', name: 'Amy (Neural)', gender: 'Female', quality: 'High (Natural)' },
  { id: 'en_US-ryan-medium', name: 'Ryan (Neural)', gender: 'Male', quality: 'High (Natural)' },
  { id: 'en_US-joe-medium', name: 'Joe (Standard)', gender: 'Male', quality: 'Medium (Standard)' },
  { id: 'en_US-libritts_r-medium', name: 'Book Reader (Libritts)', gender: 'Male', quality: 'High (Audiobook)' }
];

export const learningBooks: EpubBook[] = [
  {
    id: 'alice-in-wonderland',
    title: 'Alice in Wonderland',
    author: 'Lewis Carroll',
    chapters: [
      {
        title: 'Chapter 1: Down the Rabbit-Hole',
        text: sampleText
      }
    ]
  },
  {
    id: 'art-of-public-speaking',
    title: 'The Art of Public Speaking',
    author: 'Dale Carnegie',
    chapters: [
      {
        title: 'Chapter 1: Overcoming Stage Fright',
        text: `Fear of public speaking is one of the most common anxieties in the world. However, this nervous energy does not have to be destructive; in fact, it can be channeled into a source of vibrant passion and dynamic enthusiasm. When you step onto a stage, your body naturally floods with adrenaline. Instead of interpreting this physical sensation as dread or terror, teach your mind to welcome it as a powerful booster that will keep your presence alive, your words crisp, and your focus razor-sharp.

To immediately stabilize your nervous system before starting, practice diaphragmatic breathing. Inhale deeply through your nose, expanding your stomach rather than your chest, hold the breath for four counts, and exhale slowly. This simple physiological trigger instantly lowers your heart rate and anchors your posture, replacing shallow gasps with a steady, resonant voice.

Once you begin speaking, establish immediate visual anchors. Select three warm, friendly faces in different parts of the room: one to the left, one in the center, and one to the right. Speak directly to each person for a complete sentence or thought before looking at another. This shifts your cognitive focus from an abstract, intimidating crowd into a series of intimate, one-on-one conversations, completely dissolving the illusion of a critical audience.`
      },
      {
        title: 'Chapter 2: Pitch, Pace, and Tone',
        text: `Vocal variety is the secret weapon of great speakers. A monotonous speech will put even the most interested audience to sleep within minutes. To make your narrative feel responsive and alive, vary your pitch, pace, and volume to match the emotional content of your ideas. When describing a moment of tension or excitement, speed up your pace slightly and raise your pitch to create anticipation. When conveying a serious or highly critical concept, slow down, lower your register, and let your words fall with heavy emphasis.

pauses are just as expressive as words. Many speakers fear silence on stage and fill it with vocalized disfluencies like 'um' and 'ah'. A strategic pause, however, acts as punctuation in the air. Pause right before a key idea to create anticipation, and pause immediately after to let the concept sink in. Silence is not an empty gap; it is a visual space in the listener's mind.

To practice this, speak slowly and clearly. Allow yourself to feel the shape of the vowels and the crispness of the consonants. By paying attention to the texture of your speech, you naturally draw the listener closer. A good speaker does not rush; they control time, leading the audience step-by-step through a beautifully modulated sonic journey.`
      },
      {
        title: 'Chapter 3: Connecting with Your Audience',
        text: `Connection is not about performing; it is about sharing. The most common mistake speakers make is treating their presentation as an examination or a performance to be evaluated. When your mindset is 'I must prove my worth', you build a wall of performance anxiety. Instead, shift your mindset to: 'I have a valuable gift of information, and my only job is to share it'. This instantly aligns you with the audience, making you a helper rather than a performer.

Tell stories. Humans are hardwired to listen to narratives. The moment you state: 'Let me tell you a story about a time when...', the audience's brainwaves synchronize with yours. A story bypasses logical resistance, builds empathy, and creates a shared visual model in the listener's imagination. Always lead with a concrete story before distilling it into abstract rules or key takeaways.

Finally, keep your physical posture open. Do not cross your arms, stand behind a podium, or hold pages of notes in front of your chest. Open, expansive gestures signal honesty, warmth, and confidence. By projecting physical accessibility and maintaining continuous eye contact, you build trust and turn a standard presentation into a memorable, collaborative event.`
      }
    ]
  },
  {
    id: 'focus-and-deep-mind',
    title: 'Focus & The Deep Mind',
    author: 'Antigravity',
    chapters: [
      {
        title: 'Chapter 1: The Attention Economy',
        text: `In the modern digital age, our attention is the most valuable commodity on Earth. Tech platforms design algorithms specifically to capture, fragment, and monetize our focus. This constant division of attention triggers cognitive fatigue, leaving us feeling scattered, exhausted, and incapable of sustained thought. Every notification, message ping, and pop-up acts as a micro-interruption, costing us up to twenty minutes of cognitive recovery time to return to deep, concentrated flow.

To combat this fragmentation, we must cultivate a protective digital environment. Turn off non-essential notifications, set clear boundaries, and establish deep work blocks where you focus on a single complex task. By eliminating external distractions, you give your brain the space it needs to enter a flow state, where learning becomes faster and thinking becomes deeper.

Remember that focus is a muscle. Like any muscle, it requires consistent exercise to grow strong. Every time you consciously pull your mind back from a distraction to your reading, you are performing a repetition. Over time, these focus repetitions rebuild your visual and cognitive stamina, allowing you to read faster, retain more, and appreciate deep, immersive texts without feeling the urge to scroll.`
      },
      {
        title: 'Chapter 2: Flow States',
        text: `A flow state is a state of deep focus where you become so absorbed in an activity that time seems to stand still. Your self-consciousness disappears, and your performance reaches its peak. In flow, the brain releases a rich cocktail of neurotransmitters—dopamine, endorphins, and anandamide—that sharpen focus, block fatigue, and boost creative problem-solving by up to four hundred percent.

Flow states require three triggers: clear goals, immediate feedback, and a perfect balance between challenge and skill. If a task is too easy, you feel bored; if it is too hard, you feel anxious. Flow occurs in the sweet spot between the two: when the task is just challenging enough to push your boundaries without causing panic or overwhelm.

Our reading viewer is designed specifically to trigger this flow state. By highlighting the exact line and dimming the rest of the page, it removes visual clutter (immediate feedback and clear goals). By scaling words on the GPU, it guides your visual focus smoothly, keeping your attention locked on the reading path. Toggling Autopilot aligns the visual text flow with your reading speed, creating an immersive, fluid reading experience.`
      }
    ]
  },
  {
    id: 'speed-reading-masterclass',
    title: 'Speed Reading Masterclass',
    author: 'Evelyn Wood',
    chapters: [
      {
        title: 'Chapter 1: Eliminating Subvocalization',
        text: `Subvocalization is the internal voice we hear in our head when reading. Most readers pronounce each word silently, limiting their reading speed to the speed of their speaking voice (about one hundred fifty to two hundred words per minute). To break this barrier, you must learn to read visually, capturing the meaning of words directly through your eyes rather than translating them into sound.

To reduce subvocalization, train your eyes to sweep across the text at a speed that is slightly too fast for your internal voice to keep up. In this visual-first state, your brain starts processing patterns and ideas directly, bypassing the auditory loop. The text-magnification lens in our app helps guide this swift visual sweep, keeping your eye focus moving forward.

Another technique is to focus on grouping words. Instead of reading word-by-word, read in clusters of three or four words at a time. Your eye has a wide visual span that is capable of capturing multiple words in a single fixation. By reading in chunks, you reduce the number of visual jumps (saccades) your eye makes per line, instantly doubling your reading speed while actually improving comprehension.`
      },
      {
        title: 'Chapter 2: Expanding Visual Span',
        text: `Your peripheral vision is a powerful tool for speed reading. Most people read by fixating their eyes directly on the first letter of a line and moving it letter-by-letter to the last. This wastes valuable visual space, as the margins of the page are blank. By training your peripheral vision, you can read text that lies outside your direct point of fixation, allowing you to capture a whole line in fewer visual stops.

To expand your visual span, practice reading with visual margins. When starting a line, indent your eye fixation point by one word (start reading from the second word, letting your peripheral vision capture the first). When ending the line, stop your eye fixation point one word before the end, letting your peripheral vision capture the final word.

This technique is supported by our stationary anchor translation math. Because the focused word is anchored in the center and the adjacent words slide outward on the GPU, it naturally encourages your eyes to remain relaxed and capture the surrounding text in a single, broad visual window, preventing visual fatigue and maintaining high reading speeds.`
      },
      {
        title: 'Chapter 3: Rhythmic Guiding',
        text: `Rhythmic guiding is the practice of using a visual pointer—such as a finger, a pen, or a digital highlighter—to guide your eyes across the text. Without a pointer, your eyes naturally wander, regress (read backwards), and jump erratically, causing visual fatigue and lowering reading comprehension. A steady, rhythmic pointer acts as a visual guide, pulling your eyes forward in a smooth, continuous flow.

By using a pointer, you establish a consistent reading rhythm. The movement of the pointer sets a visual pace, preventing regressions and encouraging your brain to process ideas dynamically. This visual pacing is the foundation of speed reading.

Our Autopilot engine acts as an advanced, invisible rhythmic guide. The autoplay ticker glides the magnified lens forward at a target WPM speed, while the viewport scrolls smoothly to center the active line. Toggling Speech Sync adjusts this pace in the background to match your spoken rhythm, creating a perfect, custom-tailored visual guide that pulls your eyes forward without effort.`
      }
    ]
  }
];
