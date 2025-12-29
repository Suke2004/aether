import { useMemo } from "react";
import {
  Trophy,
  Medal,
  Award,
  Star,
  Sparkles,
  Lock,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgesProps {
  completedQuests: number;
  className?: string;
}

interface Level {
  name: string;
  threshold: number;
  textColor: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  emoji: string;
}

const levels: Level[] = [
  {
    name: "Beginner",
    threshold: 0,
    textColor: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-200 dark:border-slate-700",
    icon: <Star className='w-5 h-5' />,
    emoji: "⭐",
  },
  {
    name: "Bronze",
    threshold: 5,
    textColor: "text-amber-700 dark:text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    icon: <Medal className='w-5 h-5' />,
    emoji: "🥉",
  },
  {
    name: "Silver",
    threshold: 15,
    textColor: "text-slate-500 dark:text-slate-300",
    bgColor: "bg-slate-200 dark:bg-slate-800",
    borderColor: "border-slate-300 dark:border-slate-600",
    icon: <Award className='w-5 h-5' />,
    emoji: "🥈",
  },
  {
    name: "Gold",
    threshold: 30,
    textColor: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    icon: <Trophy className='w-5 h-5' />,
    emoji: "🥇",
  },
  {
    name: "Platinum",
    threshold: 50,
    textColor: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    icon: <Sparkles className='w-5 h-5' />,
    emoji: "💎",
  },
  {
    name: "Champion",
    threshold: 100,
    textColor: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    icon: <Crown className='w-5 h-5' />,
    emoji: "👑",
  },
];

const AchievementBadges = ({
  completedQuests,
  className,
}: AchievementBadgesProps) => {
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
      ? ((completedQuests - current.threshold) /
          (next.threshold - current.threshold)) *
        100
      : 100;

    return {
      currentLevel: current,
      nextLevel: next,
      progress: Math.min(progressToNext, 100),
    };
  }, [completedQuests]);

  return (
    <div className={cn("clean-card overflow-hidden", className)}>
      <div className='p-5'>
        {/* Header Section */}
        <div className='flex items-center gap-4 mb-6'>
          <div
            className={cn(
              "w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-4xl shadow-inner border-2 animate-in zoom-in duration-300",
              currentLevel.bgColor,
              currentLevel.borderColor
            )}>
            {currentLevel.emoji}
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1'>
              Current Rank
            </p>
            <h3
              className={cn(
                "font-display text-2xl md:text-3xl font-bold truncate leading-tight",
                currentLevel.textColor
              )}>
              {currentLevel.name}
            </h3>
            <p className='text-sm text-muted-foreground flex items-center gap-1.5 mt-1'>
              <span className='font-semibold text-foreground'>
                {completedQuests}
              </span>
              quests completed
            </p>
          </div>
        </div>

        {/* Progress Bar Section */}
        <div className='space-y-2 mb-2'>
          <div className='flex justify-between text-xs md:text-sm font-medium'>
            <span className='text-muted-foreground'>
              {nextLevel ? `Next: ${nextLevel.name}` : "Max Level Reached!"}
            </span>
            <span className='tabular-nums'>
              {nextLevel
                ? `${completedQuests} / ${nextLevel.threshold}`
                : `${completedQuests}`}
            </span>
          </div>

          <div className='h-4 rounded-full bg-secondary overflow-hidden border border-border/50 relative'>
            {/* Background Pattern */}
            <div className='absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]' />

            {/* Progress Fill */}
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
                // Dynamic colors based on level
                currentLevel.name === "Beginner" && "bg-slate-500",
                currentLevel.name === "Bronze" && "bg-amber-600",
                currentLevel.name === "Silver" && "bg-slate-400",
                currentLevel.name === "Gold" && "bg-yellow-500",
                currentLevel.name === "Platinum" && "bg-cyan-500",
                currentLevel.name === "Champion" && "bg-purple-600"
              )}
              style={{ width: `${progress}%` }}>
              <div className='absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]' />
            </div>
          </div>

          <p className='text-xs text-muted-foreground text-center pt-1'>
            {nextLevel
              ? `${nextLevel.threshold - completedQuests} more to reach ${
                  nextLevel.emoji
                }`
              : "You are a legend! 👑"}
          </p>
        </div>
      </div>

      {/* Ranks List - Scrollable on Mobile, Grid on Desktop */}
      <div className='border-t border-border bg-secondary/20 p-4'>
        <p className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1'>
          Rank Progression
        </p>

        <div className='flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 snap-x snap-mandatory hide-scrollbar'>
          {levels.map((level) => {
            const isUnlocked = completedQuests >= level.threshold;
            const isCurrent = level.name === currentLevel.name;

            return (
              <div
                key={level.name}
                className={cn(
                  "flex-shrink-0 w-[140px] md:w-auto snap-center", // Mobile sizing
                  "flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200",
                  isCurrent
                    ? "bg-background border-primary/50 shadow-sm ring-1 ring-primary/20 scale-[1.02]"
                    : "bg-background/50 border-transparent hover:bg-background hover:border-border/50",
                  !isUnlocked && "opacity-60 bg-secondary/30"
                )}>
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 transition-colors",
                    isUnlocked ? level.bgColor : "bg-secondary"
                  )}>
                  {isUnlocked ? (
                    level.emoji
                  ) : (
                    <Lock className='w-4 h-4 text-muted-foreground' />
                  )}
                </div>

                <div className='min-w-0'>
                  <p
                    className={cn(
                      "text-sm font-bold truncate",
                      isUnlocked ? level.textColor : "text-muted-foreground"
                    )}>
                    {level.name}
                  </p>
                  <p className='text-[10px] text-muted-foreground font-medium'>
                    {level.threshold} quests
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AchievementBadges;
