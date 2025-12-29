import { Coins, Star } from "lucide-react";

interface BalanceDisplayProps {
  balance: number;
  size?: "sm" | "lg";
}

const BalanceDisplay = ({ balance, size = "sm" }: BalanceDisplayProps) => {
  const formattedBalance = balance.toLocaleString();

  if (size === "lg") {
    return (
      <div className='fun-card p-6 md:p-8 text-center relative overflow-visible'>
        {/* Decorative stars - Scaled for mobile */}
        <Star className='absolute -top-2 -left-2 md:-top-3 md:-left-3 w-6 h-6 md:w-8 md:h-8 text-fun-yellow fill-fun-yellow animate-float' />
        <Star
          className='absolute -top-2 -right-2 md:-top-2 md:-right-4 w-4 h-4 md:w-6 md:h-6 text-fun-pink fill-fun-pink animate-float'
          style={{ animationDelay: "0.5s" }}
        />
        <Star
          className='absolute -bottom-2 left-1/4 w-3 h-3 md:w-5 md:h-5 text-primary fill-primary animate-float'
          style={{ animationDelay: "1s" }}
        />

        <p className='text-xs md:text-sm text-muted-foreground font-display uppercase tracking-wider mb-2 md:mb-3'>
          Your Treasure 💎
        </p>

        <div className='flex items-center justify-center gap-3 md:gap-4'>
          {/* Responsive Icon Container */}
          <div className='w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-coin to-fun-orange flex items-center justify-center shadow-coin animate-bounce-in shrink-0'>
            <Coins className='w-7 h-7 md:w-10 md:h-10 text-amber-800' />
          </div>

          {/* Responsive Text Size */}
          <span className='text-4xl sm:text-5xl md:text-7xl font-display font-bold bg-gradient-to-r from-coin to-fun-orange bg-clip-text text-transparent leading-none'>
            {formattedBalance}
          </span>
        </div>

        <p className='text-muted-foreground mt-3 md:mt-4 font-display text-sm md:text-lg'>
          Coins Ready to Spend! 🚀
        </p>
      </div>
    );
  }

  // Small variant (Header)
  return (
    <div className='coin-display inline-flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-4 md:py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary'>
      <Coins className='w-4 h-4 md:w-5 md:h-5 fill-current/20' />
      <span className='font-display font-bold text-base md:text-lg tabular-nums leading-none pb-0.5'>
        {formattedBalance}
      </span>
    </div>
  );
};

export default BalanceDisplay;
