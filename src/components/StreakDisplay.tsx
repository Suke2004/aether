import { Flame, Trophy, Calendar, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  differenceInCalendarDays,
  startOfWeek,
  addDays,
  format,
  isSameDay,
} from "date-fns";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  lastQuestDate: string | null;
  className?: string;
}

const StreakDisplay = ({
  currentStreak,
  longestStreak,
  lastQuestDate,
  className,
}: StreakDisplayProps) => {
  const today = new Date();

  // Logic: Active if last quest was today
  const isActiveToday = lastQuestDate
    ? isSameDay(new Date(lastQuestDate), today)
    : false;

  // Logic: At risk if last quest was yesterday (or earlier)
  const isAtRisk = lastQuestDate
    ? differenceInCalendarDays(today, new Date(lastQuestDate)) === 1
    : !isActiveToday; // Default to at risk if no history

  // Calculate streak bonus (Example: 5 coins per day, max 50)
  const nextBonus = Math.min((currentStreak + 1) * 5, 50);
  const currentBonus = Math.min(currentStreak * 5, 50);

  // Status Message
  const getStreakStatus = () => {
    if (isActiveToday)
      return { message: "Streak active! 🔥", color: "text-orange-500" };
    if (isAtRisk)
      return {
        message: "Complete a quest to save your streak!",
        color: "text-red-500 animate-pulse",
      };
    return {
      message: "Start a new streak today!",
      color: "text-muted-foreground",
    };
  };

  const status = getStreakStatus();

  // Generate Week Days for the Calendar View
  const weekStart = startOfWeek(today); // Starts Sunday
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(weekStart, i)
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2",
        className
      )}>
      {/* 1. Main Streak Card (Spans 2 columns on Desktop) */}
      <div className='md:col-span-2 clean-card relative overflow-hidden p-5 md:p-6 flex flex-col justify-between min-h-[180px]'>
        {/* Background Gradient Blob */}
        <div className='absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none' />

        <div className='flex items-start justify-between relative z-10'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Current Streak
              </span>
              {isActiveToday && (
                <span className='px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold border border-green-500/20'>
                  ACTIVE
                </span>
              )}
            </div>

            <div className='flex items-baseline gap-2'>
              <h3 className='font-display text-4xl md:text-5xl font-bold text-foreground'>
                {currentStreak}
              </h3>
              <span className='text-lg text-muted-foreground font-medium'>
                days
              </span>
            </div>

            <p
              className={cn(
                "text-sm font-medium mt-2 flex items-center gap-1.5",
                status.color
              )}>
              {isAtRisk && !isActiveToday && (
                <Flame className='w-4 h-4 fill-current' />
              )}
              {status.message}
            </p>
          </div>

          {/* Animated Flame Icon */}
          <div
            className={cn(
              "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-500",
              isActiveToday
                ? "bg-gradient-to-br from-orange-400 to-red-600 shadow-orange-500/30"
                : "bg-secondary grayscale opacity-80"
            )}>
            <Flame
              className={cn(
                "w-8 h-8 md:w-10 md:h-10 text-white transition-all duration-1000",
                isActiveToday ? "animate-bounce-slight" : ""
              )}
            />
          </div>
        </div>

        {/* Weekly Progress Bar */}
        <div className='mt-6'>
          <div className='flex justify-between text-xs text-muted-foreground mb-1.5'>
            <span>Progress to 7 days</span>
            <span>{Math.min(currentStreak, 7)} / 7</span>
          </div>
          <div className='h-2.5 w-full bg-secondary rounded-full overflow-hidden'>
            <div
              className='h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000 ease-out rounded-full relative'
              style={{ width: `${Math.min((currentStreak / 7) * 100, 100)}%` }}>
              <div className='absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]' />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stats Column (Right Side) */}
      <div className='flex flex-col gap-3 md:gap-4'>
        {/* Bonus Card */}
        <div className='flex-1 clean-card p-4 flex items-center justify-between bg-gradient-to-br from-card to-secondary/30'>
          <div>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground mb-1'>
              <Zap className='w-3.5 h-3.5 text-yellow-500' />
              <span>Today's Bonus</span>
            </div>
            <p className='font-display font-bold text-xl md:text-2xl text-primary'>
              +{isActiveToday ? currentBonus : nextBonus}{" "}
              <span className='text-sm font-normal text-muted-foreground'>
                coins
              </span>
            </p>
          </div>
          <div className='w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20'>
            <span className='text-lg'>💰</span>
          </div>
        </div>

        {/* Best Streak Card */}
        <div className='flex-1 clean-card p-4 flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground mb-1'>
              <Trophy className='w-3.5 h-3.5 text-orange-500' />
              <span>Best Record</span>
            </div>
            <p className='font-display font-bold text-xl md:text-2xl'>
              {longestStreak}{" "}
              <span className='text-sm font-normal text-muted-foreground'>
                days
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Weekly Calendar Row (Full Width) */}
      <div className='md:col-span-3 clean-card p-4 md:p-5'>
        <div className='flex items-center gap-2 mb-4'>
          <Calendar className='w-4 h-4 text-primary' />
          <h4 className='font-semibold text-sm'>This Week</h4>
        </div>

        <div className='flex justify-between items-center gap-1 md:gap-4'>
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            const isPast = day < today; // strictly before today

            // Logic: Mark as "done" if it's in the past and within the streak window
            // (Simplified logic: assumes consecutive streak for visual demo)
            const daysAgo = differenceInCalendarDays(today, day);
            const isCompleted =
              (isPast && daysAgo <= currentStreak && currentStreak > 0) ||
              (isToday && isActiveToday);

            return (
              <div
                key={i}
                className='flex flex-col items-center gap-2 flex-1 min-w-0'>
                <span
                  className={cn(
                    "text-[10px] md:text-xs font-medium uppercase",
                    isToday ? "text-primary font-bold" : "text-muted-foreground"
                  )}>
                  {format(day, "EEE")}
                </span>

                <div
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-sm transition-all duration-300 relative",
                    isCompleted
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-100"
                      : isToday
                      ? "bg-secondary border-2 border-dashed border-primary/50 text-muted-foreground"
                      : "bg-secondary/50 text-muted-foreground/30"
                  )}>
                  {isCompleted && (
                    <Check className='w-4 h-4 md:w-5 md:h-5 stroke-[3]' />
                  )}
                  {isToday && !isCompleted && (
                    <div className='w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse' />
                  )}
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
