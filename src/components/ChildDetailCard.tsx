import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Coins,
  Flame,
  Trophy,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  History,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface ChildProfile {
  id: string;
  username: string | null;
  balance: number;
  current_streak: number;
  longest_streak: number;
  last_quest_date: string | null;
}

interface Quest {
  id: string;
  name: string;
  description: string | null;
  tokens: number;
  status: string;
  quest_type: string;
  verification_method: string;
  created_at: string;
  completed_at: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  type: "earn" | "spend";
  description: string | null;
  created_at: string;
}

interface ChildDetailCardProps {
  childId: string;
  initialProfile?: {
    id: string;
    username: string | null;
    balance: number;
  };
}

// Achievement levels logic
const levels = [
  {
    name: "Beginner",
    threshold: 0,
    emoji: "⭐",
    color: "text-slate-500",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
  {
    name: "Bronze",
    threshold: 5,
    emoji: "🥉",
    color: "text-amber-700",
    bg: "bg-amber-700/10 border-amber-700/20",
  },
  {
    name: "Silver",
    threshold: 15,
    emoji: "🥈",
    color: "text-slate-400",
    bg: "bg-slate-400/10 border-slate-400/20",
  },
  {
    name: "Gold",
    threshold: 30,
    emoji: "🥇",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    name: "Platinum",
    threshold: 50,
    emoji: "💎",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10 border-cyan-400/20",
  },
  {
    name: "Champion",
    threshold: 100,
    emoji: "👑",
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
];

const getLevel = (completedQuests: number) => {
  let current = levels[0];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (completedQuests >= levels[i].threshold) {
      current = levels[i];
      break;
    }
  }
  return current;
};

const ChildDetailCard = ({ childId, initialProfile }: ChildDetailCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChildData();
  }, [childId]);

  const fetchChildData = async () => {
    setLoading(true);
    try {
      // Parallel data fetching for speed
      const [profileRes, questsRes, txRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, username, balance, current_streak, longest_streak, last_quest_date"
          )
          .eq("id", childId)
          .maybeSingle(),
        supabase
          .from("quests")
          .select("*")
          .eq("child_id", childId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", childId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (profileRes.data) setProfile(profileRes.data as ChildProfile);
      if (questsRes.data) setQuests(questsRes.data as Quest[]);
      if (txRes.data) setTransactions(txRes.data as Transaction[]);
    } catch (error) {
      console.error("Error fetching child data:", error);
    } finally {
      setLoading(false);
    }
  };

  const completedQuestsCount = quests.filter(
    (q) => q.status === "completed"
  ).length;
  const activeQuestsCount = quests.filter((q) => q.status === "active").length;
  const level = getLevel(completedQuestsCount);

  const displayProfile = profile || {
    ...initialProfile,
    current_streak: 0,
    longest_streak: 0,
    last_quest_date: null,
  };

  return (
    <div className='rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md'>
      {/* Summary Row - Responsive Flex Layout */}
      <div
        className='p-3 md:p-4 cursor-pointer hover:bg-secondary/30 transition-colors select-none'
        onClick={() => setExpanded(!expanded)}>
        <div className='flex items-start md:items-center gap-3 md:gap-4'>
          {/* Avatar - Fixed size */}
          <div className='w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0'>
            <User className='w-6 h-6 md:w-7 md:h-7' />
          </div>

          {/* Main Info - Flexible width */}
          <div className='flex-1 min-w-0 py-0.5'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1.5 md:mb-1'>
              <p className='font-display font-bold text-lg leading-tight truncate'>
                {displayProfile?.username || "Player"}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit border",
                  level.color,
                  level.bg
                )}>
                {level.emoji} {level.name}
              </span>
            </div>

            {/* Stats Row - Wraps on small screens */}
            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-muted-foreground'>
              <div className='flex items-center gap-1 text-accent-foreground'>
                <Coins className='w-3.5 h-3.5 md:w-4 md:h-4' />
                <span className='font-semibold'>
                  {displayProfile?.balance || 0}
                </span>
              </div>
              <div className='flex items-center gap-1 text-orange-600 dark:text-orange-500'>
                <Flame className='w-3.5 h-3.5 md:w-4 md:h-4' />
                <span className='font-semibold'>
                  {displayProfile?.current_streak || 0}d streak
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <Target className='w-3.5 h-3.5 md:w-4 md:h-4' />
                <span>{activeQuestsCount} active</span>
              </div>
            </div>
          </div>

          {/* Expand Button */}
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 md:h-10 md:w-10 shrink-0 text-muted-foreground'>
            {expanded ? (
              <ChevronUp className='w-4 h-4 md:w-5 md:h-5' />
            ) : (
              <ChevronDown className='w-4 h-4 md:w-5 md:h-5' />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className='border-t border-border animate-in slide-in-from-top-2 duration-200'>
          {loading ? (
            <div className='p-8 flex flex-col items-center justify-center gap-2 text-muted-foreground'>
              <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
              <p className='text-sm'>Loading data...</p>
            </div>
          ) : (
            <div className='p-3 md:p-5 space-y-6 bg-secondary/5'>
              {/* 1. Stats Grid - 2 cols mobile, 4 cols desktop */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3'>
                <div className='p-3 rounded-xl bg-card border border-border/50'>
                  <p className='text-xs text-muted-foreground mb-1'>
                    Total Balance
                  </p>
                  <p className='font-display font-bold text-lg md:text-xl text-accent-foreground'>
                    {profile?.balance || 0}{" "}
                    <span className='text-xs font-normal text-muted-foreground'>
                      coins
                    </span>
                  </p>
                </div>
                <div className='p-3 rounded-xl bg-card border border-border/50'>
                  <p className='text-xs text-muted-foreground mb-1'>
                    Current Streak
                  </p>
                  <p className='font-display font-bold text-lg md:text-xl text-orange-500'>
                    🔥 {profile?.current_streak || 0}{" "}
                    <span className='text-xs font-normal text-muted-foreground'>
                      days
                    </span>
                  </p>
                </div>
                <div className='p-3 rounded-xl bg-card border border-border/50'>
                  <p className='text-xs text-muted-foreground mb-1'>
                    Best Streak
                  </p>
                  <p className='font-display font-bold text-lg md:text-xl text-primary'>
                    ⚡ {profile?.longest_streak || 0}{" "}
                    <span className='text-xs font-normal text-muted-foreground'>
                      days
                    </span>
                  </p>
                </div>
                <div className='p-3 rounded-xl bg-card border border-border/50'>
                  <p className='text-xs text-muted-foreground mb-1'>
                    Quests Done
                  </p>
                  <p className='font-display font-bold text-lg md:text-xl text-foreground'>
                    ✅ {completedQuestsCount}
                  </p>
                </div>
              </div>

              {/* 2. Active Quests Section */}
              {quests.filter((q) => q.status === "active").length > 0 && (
                <div>
                  <h4 className='font-display font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2'>
                    <Target className='w-4 h-4' />
                    Active Quests
                  </h4>
                  <div className='space-y-2'>
                    {quests
                      .filter((q) => q.status === "active")
                      .slice(0, 5)
                      .map((quest) => (
                        <div
                          key={quest.id}
                          className='flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-colors'>
                          <div className='flex-1 min-w-0 pr-3'>
                            <p className='font-medium text-sm truncate'>
                              {quest.name}
                            </p>
                            <p className='text-xs text-muted-foreground flex items-center gap-1 mt-0.5'>
                              {quest.verification_method === "ai"
                                ? "🤖 AI Verified"
                                : "👤 Parent Verified"}
                            </p>
                          </div>
                          <span className='text-xs md:text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md shrink-0 whitespace-nowrap'>
                            +{quest.tokens}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className='grid md:grid-cols-2 gap-6'>
                {/* 3. Quest History */}
                <div>
                  <h4 className='font-display font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2'>
                    <Trophy className='w-4 h-4' />
                    Recent History
                  </h4>
                  {quests.filter((q) => q.status !== "active").length === 0 ? (
                    <div className='p-4 rounded-xl border border-dashed text-center'>
                      <p className='text-sm text-muted-foreground'>
                        No completed quests yet
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {quests
                        .filter((q) => q.status !== "active")
                        .slice(0, 5)
                        .map((quest) => (
                          <div
                            key={quest.id}
                            className='flex items-center gap-3 p-2.5 rounded-lg hover:bg-card transition-colors'>
                            {quest.status === "completed" ? (
                              <CheckCircle2 className='w-4 h-4 md:w-5 md:h-5 text-primary shrink-0' />
                            ) : (
                              <XCircle className='w-4 h-4 md:w-5 md:h-5 text-destructive shrink-0' />
                            )}
                            <div className='flex-1 min-w-0'>
                              <p className='font-medium text-sm truncate'>
                                {quest.name}
                              </p>
                              <p className='text-[10px] md:text-xs text-muted-foreground'>
                                {quest.completed_at
                                  ? format(
                                      new Date(quest.completed_at),
                                      "MMM d"
                                    )
                                  : format(new Date(quest.created_at), "MMM d")}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "text-xs font-semibold shrink-0 tabular-nums",
                                quest.status === "completed"
                                  ? "text-primary"
                                  : "text-muted-foreground opacity-50"
                              )}>
                              {quest.status === "completed"
                                ? `+${quest.tokens}`
                                : "0"}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* 4. Transactions */}
                <div>
                  <h4 className='font-display font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2'>
                    <History className='w-4 h-4' />
                    Wallet Activity
                  </h4>
                  {transactions.length === 0 ? (
                    <div className='p-4 rounded-xl border border-dashed text-center'>
                      <p className='text-sm text-muted-foreground'>
                        No activity yet
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {transactions.slice(0, 5).map((tx) => (
                        <div
                          key={tx.id}
                          className='flex items-center justify-between p-2.5 rounded-lg hover:bg-card transition-colors'>
                          <div className='min-w-0 pr-3'>
                            <p className='font-medium text-sm truncate'>
                              {tx.description ||
                                (tx.type === "earn"
                                  ? "Quest Reward"
                                  : "Purchase")}
                            </p>
                            <p className='text-[10px] md:text-xs text-muted-foreground flex items-center gap-1'>
                              <Clock className='w-3 h-3' />
                              {format(new Date(tx.created_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "font-display font-bold text-xs md:text-sm shrink-0 tabular-nums",
                              tx.type === "earn"
                                ? "text-primary"
                                : "text-destructive"
                            )}>
                            {tx.type === "earn" ? "+" : "-"}
                            {tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChildDetailCard;
