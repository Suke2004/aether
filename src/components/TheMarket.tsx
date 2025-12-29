import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ExternalLink, Lock, Youtube, Gamepad2, Film, Clapperboard, Coins, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppItem {
  id: string;
  name: string;
  cost: number;
  url: string;
  icon: React.ReactNode;
  emoji: string;
  color: string;
}

const apps: AppItem[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    cost: 50,
    url: 'https://youtube.com',
    icon: <Youtube className="w-8 h-8" />,
    emoji: '📺',
    color: 'bg-red-500',
  },
  {
    id: 'roblox',
    name: 'Roblox',
    cost: 75,
    url: 'https://roblox.com',
    icon: <Gamepad2 className="w-8 h-8" />,
    emoji: '🎮',
    color: 'bg-emerald-500',
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    cost: 100,
    url: 'https://minecraft.net',
    icon: <Gamepad2 className="w-8 h-8" />,
    emoji: '⛏️',
    color: 'bg-green-600',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    cost: 60,
    url: 'https://netflix.com',
    icon: <Film className="w-8 h-8" />,
    emoji: '🎬',
    color: 'bg-rose-600',
  },
  {
    id: 'disney',
    name: 'Disney+',
    cost: 55,
    url: 'https://disneyplus.com',
    icon: <Clapperboard className="w-8 h-8" />,
    emoji: '🏰',
    color: 'bg-blue-600',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    cost: 45,
    url: 'https://twitch.tv',
    icon: <Gamepad2 className="w-8 h-8" />,
    emoji: '🎥',
    color: 'bg-purple-600',
  },
];

const TheMarket = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [shakingCard, setShakingCard] = useState<string | null>(null);
  const [loadingCard, setLoadingCard] = useState<string | null>(null);
  const [spendingLimit, setSpendingLimit] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchSpendingLimit();
    }
  }, [user]);

  const fetchSpendingLimit = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('family_links')
      .select('spending_limit')
      .eq('child_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (data?.spending_limit !== undefined) {
      setSpendingLimit(data.spending_limit);
    }
  };

  const handlePurchase = async (app: AppItem) => {
    if (!profile || !user) return;

    if (profile.balance < app.cost) {
      setShakingCard(app.id);
      toast.error('Not enough coins', {
        description: `You need ${app.cost - profile.balance} more coins for ${app.name}.`,
        icon: <Lock className="w-5 h-5 text-destructive" />,
      });
      setTimeout(() => setShakingCard(null), 500);
      return;
    }

    // Check spending limit
    if (spendingLimit !== null && app.cost > spendingLimit) {
      setShakingCard(app.id);
      toast.error('Spending limit exceeded', {
        description: `This costs ${app.cost} coins but your limit is ${spendingLimit} coins per purchase.`,
        icon: <AlertTriangle className="w-5 h-5 text-destructive" />,
      });
      setTimeout(() => setShakingCard(null), 500);
      return;
    }

    setLoadingCard(app.id);

    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: app.cost,
        type: 'spend',
        description: `Opened ${app.name}`,
      });

      if (error) throw error;

      await refreshProfile();

      toast.success('Have fun!', {
        description: `Opening ${app.name}...`,
        icon: <ExternalLink className="w-5 h-5 text-primary" />,
      });

      window.open(app.url, '_blank');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoadingCard(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center slide-up">
        <h2 className="text-3xl font-display font-bold text-foreground mb-2">
          Shop
        </h2>
        <p className="text-muted-foreground">
          Spend your coins on fun activities!
        </p>
        {spendingLimit !== null && (
          <p className="text-sm text-accent-foreground mt-2 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Max {spendingLimit} coins per purchase
          </p>
        )}
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {apps.map((app) => {
          const canAfford = profile && profile.balance >= app.cost;

          return (
            <button
              key={app.id}
              onClick={() => handlePurchase(app)}
              disabled={loadingCard === app.id || !canAfford}
              className={cn(
                "clean-card group relative p-5 text-left transition-all duration-200",
                shakingCard === app.id && "shake",
                !canAfford && "opacity-60"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-white transition-transform group-hover:scale-105",
                app.color
              )}>
                <span className="text-2xl">{app.emoji}</span>
              </div>

              {/* Name */}
              <h3 className="text-lg font-display font-bold mb-3">
                {app.name}
              </h3>

              {/* Price */}
              <div className="flex items-center justify-between">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold",
                  canAfford 
                    ? "bg-accent/20 text-accent-foreground" 
                    : "bg-destructive/10 text-destructive"
                )}>
                  <Coins className="w-4 h-4" />
                  <span>{app.cost}</span>
                </div>

                {canAfford ? (
                  <ExternalLink className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              {/* Locked Message */}
              {!canAfford && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Need {app.cost - (profile?.balance || 0)} more coins
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TheMarket;