import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Coins, CheckCircle2, XCircle } from 'lucide-react';
import useSound from '@/hooks/useSound';
import useConfetti from '@/hooks/useConfetti';

interface RealtimeNotificationsProps {
  onApproval?: () => void;
}

const RealtimeNotifications = ({ onApproval }: RealtimeNotificationsProps) => {
  const { user, refreshProfile } = useAuth();
  const { playSound } = useSound();
  const { fireConfetti } = useConfetti();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to pending_verifications changes for this child
    const channel = supabase
      .channel(`verification-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pending_verifications',
          filter: `child_id=eq.${user.id}`,
        },
        async (payload) => {
          const newRecord = payload.new as {
            status: string;
            quest_name: string;
            tokens: number;
          };

          if (newRecord.status === 'approved') {
            // Quest was approved!
            playSound('celebrate');
            fireConfetti('celebrate');
            
            toast.success('Quest Approved! 🎉', {
              description: `You earned ${newRecord.tokens} coins for ${newRecord.quest_name}!`,
              icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
              duration: 5000,
            });

            // Refresh balance
            await refreshProfile();
            onApproval?.();
          } else if (newRecord.status === 'rejected') {
            playSound('error');
            
            toast.error('Quest Not Approved', {
              description: `${newRecord.quest_name} was not approved. Try again!`,
              icon: <XCircle className="w-5 h-5 text-destructive" />,
              duration: 5000,
            });

            onApproval?.();
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, playSound, fireConfetti, refreshProfile, onApproval]);

  // This component doesn't render anything visible
  return null;
};

export default RealtimeNotifications;