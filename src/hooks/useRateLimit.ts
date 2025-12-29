import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  cooldownMs: number;
  warningMessage?: string;
}

interface RateLimitState {
  attempts: number[];
  cooldownUntil: number | null;
}

/**
 * Hook for client-side rate limiting of critical operations
 * Provides defense-in-depth against abuse (server-side validation should also exist)
 */
export const useRateLimit = (config: RateLimitConfig) => {
  const stateRef = useRef<RateLimitState>({
    attempts: [],
    cooldownUntil: null,
  });

  const [isLimited, setIsLimited] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const checkLimit = useCallback((): boolean => {
    const now = Date.now();
    const state = stateRef.current;

    // Check if in cooldown
    if (state.cooldownUntil && now < state.cooldownUntil) {
      const remaining = Math.ceil((state.cooldownUntil - now) / 1000);
      setRemainingTime(remaining);
      setIsLimited(true);
      toast.error(config.warningMessage || `Please wait ${remaining} seconds before trying again`);
      return false;
    }

    // Clear cooldown if expired
    if (state.cooldownUntil && now >= state.cooldownUntil) {
      state.cooldownUntil = null;
      state.attempts = [];
      setIsLimited(false);
      setRemainingTime(0);
    }

    // Clean old attempts outside the window
    state.attempts = state.attempts.filter(
      (timestamp) => now - timestamp < config.windowMs
    );

    // Check if max attempts reached
    if (state.attempts.length >= config.maxAttempts) {
      state.cooldownUntil = now + config.cooldownMs;
      const remaining = Math.ceil(config.cooldownMs / 1000);
      setRemainingTime(remaining);
      setIsLimited(true);
      toast.error(config.warningMessage || `Too many attempts. Please wait ${remaining} seconds.`);
      return false;
    }

    // Record this attempt
    state.attempts.push(now);
    return true;
  }, [config]);

  const reset = useCallback(() => {
    stateRef.current = {
      attempts: [],
      cooldownUntil: null,
    };
    setIsLimited(false);
    setRemainingTime(0);
  }, []);

  return {
    checkLimit,
    isLimited,
    remainingTime,
    reset,
  };
};

// Pre-configured rate limiters for common operations
export const RATE_LIMITS = {
  // Invite code generation: 3 per minute, 60s cooldown
  INVITE_CODE: {
    maxAttempts: 3,
    windowMs: 60000,
    cooldownMs: 60000,
    warningMessage: 'Too many invite codes generated. Please wait a minute.',
  },
  // Quest verification: 5 per minute, 30s cooldown
  QUEST_VERIFICATION: {
    maxAttempts: 5,
    windowMs: 60000,
    cooldownMs: 30000,
    warningMessage: 'Too many quest submissions. Please wait before trying again.',
  },
  // Bonus coin grants: 5 per minute, 30s cooldown
  BONUS_GRANT: {
    maxAttempts: 5,
    windowMs: 60000,
    cooldownMs: 30000,
    warningMessage: 'Too many coin grants. Please slow down.',
  },
} as const;
