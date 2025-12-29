import { useCallback } from 'react';

// Web Audio API based sound generation for instant feedback
export const useSound = () => {
  const playSound = useCallback((type: 'success' | 'error' | 'coin' | 'celebrate') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (frequency: number, duration: number, delay: number = 0, type: OscillatorType = 'sine', gain: number = 0.3) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        
        gainNode.gain.setValueAtTime(gain, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);
        
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + duration);
      };

      switch (type) {
        case 'success':
          // Upward arpeggio - cheerful success sound
          playTone(523.25, 0.15, 0, 'sine', 0.2);      // C5
          playTone(659.25, 0.15, 0.1, 'sine', 0.2);    // E5
          playTone(783.99, 0.25, 0.2, 'sine', 0.25);   // G5
          break;
          
        case 'coin':
          // Classic coin sound - two quick high notes
          playTone(987.77, 0.1, 0, 'square', 0.15);    // B5
          playTone(1318.51, 0.2, 0.08, 'square', 0.15); // E6
          break;
          
        case 'celebrate':
          // Fanfare celebration sound
          playTone(523.25, 0.15, 0, 'sine', 0.2);      // C5
          playTone(659.25, 0.12, 0.12, 'sine', 0.2);   // E5
          playTone(783.99, 0.12, 0.22, 'sine', 0.2);   // G5
          playTone(1046.50, 0.3, 0.32, 'sine', 0.25);  // C6
          // Add sparkle
          playTone(1567.98, 0.15, 0.5, 'sine', 0.1);   // G6
          playTone(2093.00, 0.2, 0.6, 'sine', 0.08);   // C7
          break;
          
        case 'error':
          // Descending tone - gentle error
          playTone(392, 0.15, 0, 'triangle', 0.2);
          playTone(330, 0.2, 0.12, 'triangle', 0.2);
          break;
      }
    } catch (e) {
      // Audio not supported, fail silently
      console.warn('Audio playback not supported:', e);
    }
  }, []);

  return { playSound };
};

export default useSound;