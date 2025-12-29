import { Flame, Trophy, Calendar, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  lastQuestDate: string | null;
  className?: string;
}

const StreakDisplay = ({ currentStreak, longestStreak, lastQuestDate, className }: StreakDisplayProps) => {
  const today = new Date().toISOString().split('T')[0];
  const isActiveToday = lastQuestDate === today;
  
  // Calculate streak bonus (5 coins per day, max 50)
  const nextBonus = Math.min((currentStreak + 1) * 5, 50);
  const currentBonus = Math.min(currentStreak * 5, 50);

  // Determine streak status
  const getStreakStatus = () => {
    if (!lastQuestDate) return { message: 'Start your streak today!', color: 'text-muted-foreground' };
    
    const lastDate = new Date(lastQuestDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { message: 'Streak active! 🔥', color: 'text-primary' };
    if (diffDays === 1) return { message: 'Complete a quest to keep your streak!', color: 'text-orange-500' };
    return { message: 'Streak ended. Start a new one!', color: 'text-muted-foreground' };
  };

  const status = getStreakStatus();

  // Fire animation for active streaks
  const getFlameSize = () => {
    if (currentStreak >= 10) return 'w-8 h-8';
    if (currentStreak >= 5) return 'w-7 h-7';
    return 'w-6 h-6';
  };

  return (
    <div className={cn("clean-card p-5", className)}>
      {/* Main Streak Display */}
      <div className="flex items-center gap-4 mb-4">
        <div className={cn(
          "relative flex items-center justify-center w-16 h-16 rounded-2xl",
          currentStreak > 0 ? "bg-gradient-to-br from-orange-400 to-red-500" : "bg-secondary"
        )}>
          <Flame className={cn(
            getFlameSize(),
            currentStreak > 0 ? "text-white" : "text-muted-foreground",
            currentStreak > 0 && "animate-pulse"
          )} />
          {currentStreak >= 7 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-yellow-900">
              🔥
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Streak</p>
          <h3 className="font-display text-3xl font-bold">
            {currentStreak} <span className="text-lg text-muted-foreground">day{currentStreak !== 1 ? 's' : ''}</span>
          </h3>
          <p className={cn("text-sm", status.color)}>{status.message}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Best Streak</span>
          </div>
          <p className="font-display font-bold text-lg">{longestStreak} days</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Today's Bonus</span>
          </div>
          <p className="font-display font-bold text-lg text-primary">
            {isActiveToday ? `+${currentBonus}` : `+${nextBonus}`} coins
          </p>
        </div>
      </div>

      {/* Streak Bonus Info */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border border-orange-200 dark:border-orange-800">
        <p className="text-sm font-medium text-orange-800 dark:text-orange-200 flex items-center gap-2">
          <Flame className="w-4 h-4" />
          Streak Bonus: +5 coins per day (max 50)
        </p>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div
              key={day}
              className={cn(
                "flex-1 h-2 rounded-full transition-all",
                day <= currentStreak 
                  ? "bg-gradient-to-r from-orange-400 to-red-500" 
                  : "bg-secondary"
              )}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>Day 1</span>
          <span>Day 7+</span>
        </div>
      </div>

      {/* Weekly View */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          This Week
        </p>
        <div className="flex gap-2 justify-between">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, i) => {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const isToday = i === dayOfWeek;
            const isPast = i < dayOfWeek;
            
            // Simple logic: show as completed if within current streak and in the past
            const daysAgo = dayOfWeek - i;
            const isCompleted = isPast && daysAgo <= currentStreak && currentStreak > 0;
            
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{dayName}</span>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all",
                  isToday && isActiveToday && "bg-gradient-to-br from-orange-400 to-red-500 text-white",
                  isToday && !isActiveToday && "border-2 border-dashed border-orange-400 text-orange-500",
                  isCompleted && !isToday && "bg-primary/20 text-primary",
                  !isCompleted && !isToday && isPast && "bg-secondary text-muted-foreground",
                  !isPast && !isToday && "bg-secondary/50 text-muted-foreground/50"
                )}>
                  {isCompleted || (isToday && isActiveToday) ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StreakDisplay;