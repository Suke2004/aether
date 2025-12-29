import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Trophy,
  Calendar,
  Coins,
  ZoomIn,
  X,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AchievementBadges from "./AchievementBadges";
import { Button } from "@/components/ui/button";

interface CompletedQuest {
  id: string;
  quest_name: string;
  quest_type: string;
  tokens: number;
  image_path: string;
  reviewed_at: string;
  status: string;
}

// Sub-component for individual cards to handle image loading logic cleanly
const QuestHistoryCard = ({
  quest,
  imageUrl,
  onClick,
}: {
  quest: CompletedQuest;
  imageUrl: string;
  onClick: () => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);

  const getQuestEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      reading: "📚",
      drawing: "🎨",
      homework: "📝",
      chores: "🧹",
      exercise: "💪",
      music: "🎵",
      custom: "⭐",
    };
    return emojis[type] || "✨";
  };

  return (
    <div
      className='group relative flex flex-col bg-card rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer'
      onClick={onClick}>
      {/* Image Container */}
      <div className='relative aspect-square bg-secondary/30 overflow-hidden'>
        {!imageLoaded && !error && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <Loader2 className='w-6 h-6 animate-spin text-muted-foreground/30' />
          </div>
        )}

        {error ? (
          <div className='absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-2 text-center'>
            <ImageIcon className='w-8 h-8 mb-1 opacity-50' />
            <span className='text-[10px]'>Image unavailable</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={quest.quest_name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
              "group-hover:scale-110"
            )}
          />
        )}

        {/* Overlay Gradient & Zoom Icon */}
        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center'>
          <div className='bg-white/90 dark:bg-black/80 rounded-full p-2 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-lg'>
            <ZoomIn className='w-5 h-5 text-primary' />
          </div>
        </div>

        {/* Floating Emoji Badge */}
        <div className='absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 flex items-center justify-center text-lg shadow-sm z-10'>
          {getQuestEmoji(quest.quest_type)}
        </div>
      </div>

      {/* Content */}
      <div className='p-3 flex-1 flex flex-col justify-between'>
        <div>
          <h4 className='font-display font-bold text-sm leading-tight line-clamp-2 mb-2'>
            {quest.quest_name}
          </h4>
        </div>

        <div className='flex items-end justify-between border-t border-border/50 pt-2 mt-auto'>
          <div className='flex flex-col'>
            <span className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold'>
              Completed
            </span>
            <span className='text-xs text-foreground flex items-center gap-1'>
              <Calendar className='w-3 h-3 text-muted-foreground' />
              {format(new Date(quest.reviewed_at), "MMM d")}
            </span>
          </div>

          <div className='flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md'>
            <Coins className='w-3.5 h-3.5 text-primary' />
            <span className='text-xs font-bold text-primary'>
              +{quest.tokens}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuestHistory = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<CompletedQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchCompletedQuests();
    }
  }, [user]);

  const fetchCompletedQuests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("pending_verifications")
        .select("*")
        .eq("child_id", user.id)
        .eq("status", "approved")
        .order("reviewed_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      setQuests((data || []) as CompletedQuest[]);
    } catch (error) {
      console.error("Error fetching quest history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const generateSignedUrls = async () => {
      const paths = quests.map((q) => q.image_path);
      const urlMap: Record<string, string> = {};

      // Batch processing could be done here, but linear is fine for <30 items
      for (const path of paths) {
        if (!signedUrls[path]) {
          const { data } = await supabase.storage
            .from("quest-proofs")
            .createSignedUrl(path, 3600);
          if (data?.signedUrl) {
            urlMap[path] = data.signedUrl;
          }
        }
      }

      if (Object.keys(urlMap).length > 0) {
        setSignedUrls((prev) => ({ ...prev, ...urlMap }));
      }
    };

    if (quests.length > 0) {
      generateSignedUrls();
    }
  }, [quests]);

  const getImageUrl = (path: string) => signedUrls[path] || "";

  // Calculate Lifetime Stats
  const totalEarned = quests.reduce((acc, curr) => acc + curr.tokens, 0);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-20 space-y-4'>
        <Loader2 className='w-10 h-10 animate-spin text-primary' />
        <p className='text-muted-foreground animate-pulse'>
          Digging up your treasures...
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10'>
      {/* 1. Achievements Section */}
      <AchievementBadges completedQuests={quests.length} />

      {/* 2. Lifetime Stats Banner */}
      {quests.length > 0 && (
        <div className='bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 flex items-center justify-around'>
          <div className='text-center'>
            <p className='text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1'>
              Total Earned
            </p>
            <p className='text-2xl md:text-3xl font-display font-bold text-primary flex items-center justify-center gap-2'>
              <Coins className='w-6 h-6 fill-primary/20' />
              {totalEarned}
            </p>
          </div>
          <div className='w-px h-10 bg-border' />
          <div className='text-center'>
            <p className='text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1'>
              Quests Done
            </p>
            <p className='text-2xl md:text-3xl font-display font-bold text-foreground flex items-center justify-center gap-2'>
              <Trophy className='w-6 h-6 text-orange-500 fill-orange-500/20' />
              {quests.length}
            </p>
          </div>
        </div>
      )}

      {/* 3. Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl md:text-2xl font-display font-bold text-foreground flex items-center gap-2'>
            Quest Gallery
            <Sparkles className='w-5 h-5 text-yellow-500 animate-pulse' />
          </h2>
          <p className='text-muted-foreground text-sm'>
            Your journey of achievements
          </p>
        </div>
      </div>

      {/* 4. Responsive Grid */}
      {quests.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-border rounded-2xl bg-secondary/20'>
          <div className='w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4'>
            <Trophy className='w-8 h-8 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-bold text-foreground'>
            No completed quests yet
          </h3>
          <p className='text-muted-foreground max-w-sm mt-2 mb-6'>
            Complete your first quest and get it approved to start building your
            trophy case!
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4'>
          {quests.map((quest) => (
            <QuestHistoryCard
              key={quest.id}
              quest={quest}
              imageUrl={getImageUrl(quest.image_path)}
              onClick={() => setSelectedImage(getImageUrl(quest.image_path))}
            />
          ))}
        </div>
      )}

      {/* 5. Polished Image Modal */}
      {selectedImage && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8'>
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300 animate-in fade-in'
            onClick={() => setSelectedImage(null)}
          />

          {/* Content */}
          <div className='relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-200'>
            <button
              onClick={() => setSelectedImage(null)}
              className='absolute -top-12 right-0 md:-right-12 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors'>
              <X className='w-6 h-6' />
              <span className='sr-only'>Close</span>
            </button>

            <img
              src={selectedImage}
              alt='Quest proof full size'
              className='w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10'
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestHistory;
