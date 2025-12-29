import { Coins, Star } from 'lucide-react';

interface BalanceDisplayProps {
  balance: number;
  size?: 'sm' | 'lg';
}

const BalanceDisplay = ({ balance, size = 'sm' }: BalanceDisplayProps) => {
  const formattedBalance = balance.toLocaleString();

  if (size === 'lg') {
    return (
      <div className="fun-card p-8 text-center relative overflow-visible">
        {/* Decorative stars */}
        <Star className="absolute -top-3 -left-3 w-8 h-8 text-fun-yellow fill-fun-yellow animate-float" />
        <Star className="absolute -top-2 -right-4 w-6 h-6 text-fun-pink fill-fun-pink animate-float" style={{ animationDelay: '0.5s' }} />
        <Star className="absolute -bottom-2 left-1/4 w-5 h-5 text-primary fill-primary animate-float" style={{ animationDelay: '1s' }} />

        <p className="text-sm text-muted-foreground font-display uppercase tracking-wider mb-3">
          Your Treasure 💎
        </p>
        <div className="flex items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-coin to-fun-orange flex items-center justify-center shadow-coin animate-bounce-in">
            <Coins className="w-10 h-10 text-amber-800" />
          </div>
          <span className="text-6xl md:text-7xl font-display font-bold bg-gradient-to-r from-coin to-fun-orange bg-clip-text text-transparent">
            {formattedBalance}
          </span>
        </div>
        <p className="text-muted-foreground mt-4 font-display text-lg">
          Coins Ready to Spend! 🚀
        </p>
      </div>
    );
  }

  return (
    <div className="coin-display">
      <Coins className="w-5 h-5" />
      <span className="font-display text-lg">
        {formattedBalance}
      </span>
    </div>
  );
};

export default BalanceDisplay;
