import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LogOut, ShoppingBag, Sparkles, Link, Loader2, Check, Trophy, Flame } from 'lucide-react';
import BalanceDisplay from './BalanceDisplay';
import TheMarket from './TheMarket';
import TheMint from './TheMint';
import QuestHistory from './QuestHistory';
import RealtimeNotifications from './RealtimeNotifications';
import StreakDisplay from './StreakDisplay';

const ChildDashboard = () => {
  const { profile, signOut, user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'market' | 'mint' | 'history'>('market');
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleApprovalNotification = useCallback(() => {
    // Trigger refresh of quest history when an approval happens
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleLinkParent = async () => {
    if (!inviteCode.trim() || !user) return;

    setIsLinking(true);
    try {
      const { data: invite, error: findError } = await supabase
        .from('family_links')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase().trim())
        .eq('status', 'pending')
        .single();

      if (findError || !invite) {
        toast.error('Invalid code', {
          description: 'Please check the code and try again.'
        });
        setIsLinking(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('family_links')
        .update({
          child_id: user.id,
          status: 'active',
          linked_at: new Date().toISOString(),
          invite_code: null,
        })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      toast.success('Connected!', {
        description: 'You are now linked with your parent.',
        icon: <Check className="w-5 h-5 text-primary" />,
      });

      setIsLinkDialogOpen(false);
      setInviteCode('');
      refreshProfile();
    } catch (error) {
      console.error('Link error:', error);
      toast.error('Something went wrong');
    } finally {
      setIsLinking(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Realtime Notifications */}
      <RealtimeNotifications onApproval={handleApprovalNotification} />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-xl">🌟</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-foreground">Aether</h1>
                <p className="text-sm text-muted-foreground">Hi, {profile.username || 'there'}!</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                    <Link className="w-4 h-4" />
                    Link Parent
                  </Button>
                </DialogTrigger>
                <DialogContent className="clean-card">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">Link with Parent</DialogTitle>
                    <DialogDescription>
                      Enter the invite code from your parent to connect.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Invite Code</Label>
                      <Input
                        placeholder="ABCD1234"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="font-display text-xl tracking-widest text-center h-14 rounded-xl"
                      />
                    </div>
                    <Button
                      onClick={handleLinkParent}
                      disabled={inviteCode.length !== 8 || isLinking}
                      className="w-full"
                    >
                      {isLinking ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Streak Badge */}
              {(profile.current_streak || 0) > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-600 dark:text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold text-sm">{profile.current_streak}</span>
                </div>
              )}

              <BalanceDisplay balance={profile.balance} />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2">
            <button
              onClick={() => setActiveTab('market')}
              className={`nav-link flex items-center gap-2 ${activeTab === 'market' ? 'active' : ''}`}
            >
              <ShoppingBag className="w-4 h-4" />
              Shop
            </button>
            <button
              onClick={() => setActiveTab('mint')}
              className={`nav-link flex items-center gap-2 ${activeTab === 'mint' ? 'active' : ''}`}
            >
              <Sparkles className="w-4 h-4" />
              Earn Coins
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`nav-link flex items-center gap-2 ${activeTab === 'history' ? 'active' : ''}`}
            >
              <Trophy className="w-4 h-4" />
              Achievements
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="fade-in space-y-6">
          {/* Streak Display - show on Earn Coins tab */}
          {activeTab === 'mint' && (
            <StreakDisplay 
              currentStreak={profile.current_streak || 0}
              longestStreak={profile.longest_streak || 0}
              lastQuestDate={profile.last_quest_date}
            />
          )}
          
          {activeTab === 'market' && <TheMarket />}
          {activeTab === 'mint' && <TheMint />}
          {activeTab === 'history' && <QuestHistory key={refreshKey} />}
        </div>
      </main>
    </div>
  );
};

export default ChildDashboard;