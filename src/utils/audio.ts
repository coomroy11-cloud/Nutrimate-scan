/**
 * Audio / Text-To-Speech utility for NutriMed Scan AI
 * Supports Web Speech API (Thai voice) and Gemini TTS fallback
 */

let currentAudio: HTMLAudioElement | null = null;

export const speakText = async (
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): Promise<void> => {
  stopSpeaking();

  if (!text || text.trim() === '') return;

  // Try Web Speech API first for instant, zero-latency Thai speech
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 0.95; // Slightly slower for elderly clarity
      utterance.pitch = 1.0;

      // Select Thai voice if available in browser
      const voices = window.speechSynthesis.getVoices();
      const thaiVoice = voices.find((v) => v.lang.includes('th') || v.name.includes('Thai'));
      if (thaiVoice) {
        utterance.voice = thaiVoice;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };
      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = (e) => {
        console.warn('Web Speech error, attempting fallback:', e);
        fallbackServerTTS(text, onStart, onEnd, onError);
      };

      window.speechSynthesis.speak(utterance);
      return;
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
    }
  }

  // Fallback to server Gemini TTS
  fallbackServerTTS(text, onStart, onEnd, onError);
};

const fallbackServerTTS = async (
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
) => {
  try {
    console.log('[Audio TTS] Requesting audio from /api/tts');
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 300) }),
    });

    if (!res.ok) {
      console.warn('[Audio TTS] /api/tts returned non-ok status:', res.status);
      throw new Error(`TTS server failed with status ${res.status}`);
    }

    const data = await res.json();
    if (data.audioBase64) {
      const audioUrl = `data:${data.format || 'audio/wav'};base64,${data.audioBase64}`;
      currentAudio = new Audio(audioUrl);
      if (onStart) onStart();
      currentAudio.onended = () => {
        currentAudio = null;
        if (onEnd) onEnd();
      };
      currentAudio.onerror = () => {
        currentAudio = null;
        if (onError) onError();
      };
      currentAudio.play();
      return;
    }
    if (onError) onError();
  } catch (err) {
    console.error('All TTS failed:', err);
    if (onError) onError();
  }
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
};
