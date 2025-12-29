import { useMemo } from 'react';
import { Trophy, Medal, Award, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementBadgesProps {
  completedQuests: number;
  className?: string;
}

interface Level {
  name: string;
  threshold: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  emoji: string;
}

const levels: Level[] = [
  { 
    name: 'Beginner', 
    threshold: 0, 
    color: 'text-slate-500', 
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    icon: <Star className="w-5 h-5" />,
    emoji: '⭐'
  },
  { 
    name: 'Bronze', 
    threshold: 5, 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: <Medal className="w-5 h-5" />,
    emoji: '🥉'
  },
  { 
    name: 'Silver', 
    threshold: 15, 
    color: 'text-slate-400', 
    bgColor: 'bg-slate-200 dark:bg-slate-700',
    icon: <Award className="w-5 h-5" />,
    emoji: '🥈'
  },
  { 
    name: 'Gold', 
    threshold: 30, 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: <Trophy className="w-5 h-5" />,
    emoji: '🥇'
  },
  { 
    name: 'Platinum', 
    threshold: 50, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: <Sparkles className="w-5 h-5" />,
    emoji: '💎'
  },
  { 
    name: 'Champion', 
    threshold: 100, 
    color: 'text-purple-500', 
    bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30',
    icon: <Trophy className="w-5 h-5" />,
    emoji: '👑'
  },
];

const AchievementBadges = ({ completedQuests, className }: AchievementBadgesProps) => {
  const { currentLevel, nextLevel, progress } = useMemo(() => {
    let current = levels[0];
    let next: Level | null = levels[1];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (completedQuests >= levels[i].threshold) {
        current = levels[i];
        next = levels[i + 1] || null;
        break;
      }
    }

    const progressToNext = next
      ? ((completedQuests - current.threshold) / (next.threshold - current.threshold)) * 100
      : 100;

    return {
      currentLevel: current,
      nextLevel: next,
      progress: Math.min(progressToNext, 100),
    };
  }, [completedQuests]);

  return (
    <div className={cn("clean-card p-5", className)}>
      {/* Current Level */}
      <div className="flex items-center gap-4 mb-4">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl",
          currentLevel.bgColor
        )}>
          {currentLevel.emoji}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Rank</p>
          <h3 className={cn("font-display text-2xl font-bold", currentLevel.color)}>
            {currentLevel.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {completedQuests} quest{completedQuests !== 1 ? 's' : ''} completed
          </p>
        </div>
      </div>

      {/* Progress to Next Level */}
      {nextLevel && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to {nextLevel.name}</span>
            <span className="font-semibold">
              {completedQuests} / {nextLevel.threshold}
            </span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                nextLevel.name === 'Bronze' && "bg-amber-600",
                nextLevel.name === 'Silver' && "bg-slate-400",
                nextLevel.name === 'Gold' && "bg-yellow-500",
                nextLevel.name === 'Platinum' && "bg-cyan-400",
                nextLevel.name === 'Champion' && "bg-gradient-to-r from-purple-500 to-pink-500",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {nextLevel.threshold - completedQuests} more quest{nextLevel.threshold - completedQuests !== 1 ? 's' : ''} to reach {nextLevel.emoji} {nextLevel.name}!
          </p>
        </div>
      )}

      {/* All Badges */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-sm font-semibold mb-3">All Ranks</p>
        <div className="flex flex-wrap gap-2">
          {levels.map((level) => {
            const isUnlocked = completedQuests >= level.threshold;
            return (
              <div
                key={level.name}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all",
                  isUnlocked 
                    ? cn(level.bgColor, level.color, "font-semibold") 
                    : "bg-secondary/50 text-muted-foreground opacity-50"
                )}
              >
                <span>{level.emoji}</span>
                <span>{level.name}</span>
                {isUnlocked && level.name === currentLevel.name && (
                  <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AchievementBadges;