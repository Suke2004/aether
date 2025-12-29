import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Coins, 
  Flame, 
  Trophy, 
  Target, 
  ChevronDown, 
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

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
  type: 'earn' | 'spend';
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

// Achievement levels for display
const levels = [
  { name: 'Beginner', threshold: 0, emoji: '⭐', color: 'text-slate-500' },
  { name: 'Bronze', threshold: 5, emoji: '🥉', color: 'text-amber-700' },
  { name: 'Silver', threshold: 15, emoji: '🥈', color: 'text-slate-400' },
  { name: 'Gold', threshold: 30, emoji: '🥇', color: 'text-yellow-500' },
  { name: 'Platinum', threshold: 50, emoji: '💎', color: 'text-cyan-400' },
  { name: 'Champion', threshold: 100, emoji: '👑', color: 'text-purple-500' },
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
      // Fetch full profile with streak data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, balance, current_streak, longest_streak, last_quest_date')
        .eq('id', childId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as ChildProfile);
      }

      // Fetch quests for this child
      const { data: questsData } = await supabase
        .from('quests')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(20);

      setQuests((questsData || []) as Quest[]);

      // Fetch transactions for this child
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', childId)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions((txData || []) as Transaction[]);
    } catch (error) {
      console.error('Error fetching child data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedQuestsCount = quests.filter(q => q.status === 'completed').length;
  const activeQuestsCount = quests.filter(q => q.status === 'active').length;
  const level = getLevel(completedQuestsCount);

  const displayProfile = profile || {
    ...initialProfile,
    current_streak: 0,
    longest_streak: 0,
    last_quest_date: null,
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Summary Row - Always Visible */}
      <div 
        className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
            <User className="w-7 h-7" />
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-bold text-lg truncate">
                {displayProfile?.username || 'Player'}
              </p>
              <span className={cn("text-sm font-medium", level.color)}>
                {level.emoji} {level.name}
              </span>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center gap-4 mt-1 text-sm">
              <div className="flex items-center gap-1 text-accent-foreground">
                <Coins className="w-4 h-4" />
                <span className="font-semibold">{displayProfile?.balance || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-4 h-4" />
                <span className="font-semibold">{profile?.current_streak || 0} day streak</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>{activeQuestsCount} active</span>
              </div>
            </div>
          </div>

          {/* Expand Button */}
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="font-display font-bold text-lg text-accent-foreground">
                    {profile?.balance || 0} coins
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                  <p className="font-display font-bold text-lg text-orange-500">
                    🔥 {profile?.current_streak || 0} days
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                  <p className="font-display font-bold text-lg text-primary">
                    ⚡ {profile?.longest_streak || 0} days
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Quests Done</p>
                  <p className="font-display font-bold text-lg text-foreground">
                    ✅ {completedQuestsCount}
                  </p>
                </div>
              </div>

              {/* Active Quests */}
              {quests.filter(q => q.status === 'active').length > 0 && (
                <div>
                  <h4 className="font-display font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Active Quests
                  </h4>
                  <div className="space-y-2">
                    {quests.filter(q => q.status === 'active').slice(0, 5).map((quest) => (
                      <div 
                        key={quest.id} 
                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{quest.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {quest.verification_method === 'ai' ? '🤖 AI Verified' : '👤 Parent Verified'}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-primary flex-shrink-0">
                          +{quest.tokens} coins
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Quest History */}
              <div>
                <h4 className="font-display font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Quest History
                </h4>
                {quests.filter(q => q.status !== 'active').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No completed quests yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {quests.filter(q => q.status !== 'active').slice(0, 5).map((quest) => (
                      <div 
                        key={quest.id} 
                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                      >
                        <div className="flex items-center gap-3">
                          {quest.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{quest.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {quest.completed_at 
                                ? format(new Date(quest.completed_at), 'MMM d, h:mm a')
                                : format(new Date(quest.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "text-sm font-semibold flex-shrink-0",
                          quest.status === 'completed' ? "text-primary" : "text-muted-foreground"
                        )}>
                          {quest.status === 'completed' ? `+${quest.tokens}` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="font-display font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Recent Activity
                </h4>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activity yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((tx) => (
                      <div 
                        key={tx.id} 
                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {tx.description || (tx.type === 'earn' ? 'Earned' : 'Spent')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <span className={cn(
                          "font-display font-bold text-sm flex-shrink-0",
                          tx.type === 'earn' ? "text-primary" : "text-destructive"
                        )}>
                          {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChildDetailCard;
