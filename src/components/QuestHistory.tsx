import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trophy, Calendar, Coins, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import AchievementBadges from './AchievementBadges';

interface CompletedQuest {
  id: string;
  quest_name: string;
  quest_type: string;
  tokens: number;
  image_path: string;
  reviewed_at: string;
  status: string;
}

const QuestHistory = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<CompletedQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCompletedQuests();
    }
  }, [user]);

  const fetchCompletedQuests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('pending_verifications')
        .select('*')
        .eq('child_id', user.id)
        .eq('status', 'approved')
        .order('reviewed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setQuests((data || []) as CompletedQuest[]);
    } catch (error) {
      console.error('Error fetching quest history:', error);
    } finally {
      setLoading(false);
    }
  };

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Generate signed URLs for quest proof images (secure access)
  useEffect(() => {
    const generateSignedUrls = async () => {
      const paths = quests.map(q => q.image_path);
      const urlMap: Record<string, string> = {};
      
      for (const path of paths) {
        if (!signedUrls[path]) {
          const { data } = await supabase.storage
            .from('quest-proofs')
            .createSignedUrl(path, 3600); // 1 hour expiration
          if (data?.signedUrl) {
            urlMap[path] = data.signedUrl;
          }
        }
      }
      
      if (Object.keys(urlMap).length > 0) {
        setSignedUrls(prev => ({ ...prev, ...urlMap }));
      }
    };
    
    if (quests.length > 0) {
      generateSignedUrls();
    }
  }, [quests]);

  const getImageUrl = (path: string) => {
    return signedUrls[path] || '';
  };

  const getQuestEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      reading: '📚',
      drawing: '🎨',
      homework: '📝',
      chores: '🧹',
      exercise: '💪',
      music: '🎵',
      custom: '⭐',
    };
    return emojis[type] || '✨';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (quests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No completed quests yet</p>
        <p className="text-sm mt-1">Complete quests to see your achievements here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Achievement Badges */}
      <AchievementBadges completedQuests={quests.length} />

      {/* Header */}
      <div className="text-center slide-up">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          Quest Gallery
        </h2>
        <p className="text-muted-foreground text-sm">
          Your completed quests with proof photos
        </p>
      </div>

      {/* Quest Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className="clean-card overflow-hidden group cursor-pointer"
            onClick={() => setSelectedImage(getImageUrl(quest.image_path))}
          >
            {/* Image */}
            <div className="relative aspect-square bg-secondary overflow-hidden">
              <img
                src={getImageUrl(quest.image_path)}
                alt={quest.quest_name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                <ZoomIn className="w-5 h-5 text-white" />
              </div>
              {/* Quest emoji badge */}
              <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center text-lg shadow-sm">
                {getQuestEmoji(quest.quest_type)}
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h4 className="font-display font-bold text-sm truncate">{quest.quest_name}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(quest.reviewed_at), 'MMM d')}
                </span>
                <span className="text-xs font-semibold text-accent-foreground flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  +{quest.tokens}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh] animate-scale-in">
            <img
              src={selectedImage}
              alt="Quest proof"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 w-10 h-10 rounded-full bg-card/90 flex items-center justify-center text-foreground hover:bg-card"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestHistory;