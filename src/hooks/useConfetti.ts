import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const fireConfetti = useCallback((type: 'success' | 'celebrate' | 'coins') => {
    switch (type) {
      case 'success':
        // Simple burst
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#14b8a6', '#facc15', '#f472b6', '#60a5fa'],
        });
        break;
        
      case 'celebrate':
        // Big celebration with multiple bursts
        const duration = 2000;
        const end = Date.now() + duration;
        
        const colors = ['#14b8a6', '#facc15', '#f472b6', '#60a5fa', '#a855f7'];
        
        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: colors,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: colors,
          });
          
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
        break;
        
      case 'coins':
        // Gold coin rain effect
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { y: 0.4 },
          colors: ['#facc15', '#fbbf24', '#f59e0b', '#d97706'],
          shapes: ['circle'],
          scalar: 1.2,
          gravity: 1.2,
        });
        break;
    }
  }, []);

  return { fireConfetti };
};

export default useConfetti;