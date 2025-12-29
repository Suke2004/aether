import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Shield, 
  LogOut, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Gift,
  Loader2,
  History,
  Users,
  Copy,
  Check,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Brain,
  Target,
  LayoutDashboard,
  Settings,
  KeyRound,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import useSound from '@/hooks/useSound';
import useConfetti from '@/hooks/useConfetti';
import ChildDetailCard from '@/components/ChildDetailCard';
import { useRateLimit, RATE_LIMITS } from '@/hooks/useRateLimit';
import QuestManagement from '@/components/QuestManagement';

interface Transaction {
  id: string;
  amount: number;
  type: 'earn' | 'spend';
  description: string | null;
  created_at: string;
}

interface ChildProfile {
  id: string;
  username: string | null;
  balance: number;
}

interface FamilyLinkWithChild {
  id: string;
  parent_id: string;
  child_id: string;
  invite_code: string | null;
  status: string;
  linked_at: string | null;
  created_at: string;
  spending_limit: number | null;
  parent_email: string | null;
  email_notifications_enabled: boolean;
  child?: ChildProfile;
}

interface PendingVerification {
  id: string;
  child_id: string;
  quest_name: string;
  quest_type: string;
  tokens: number;
  image_path: string;
  ai_reason: string | null;
  status: string;
  created_at: string;
}

interface ChildSettingsCardProps {
  link: FamilyLinkWithChild;
  onUpdateSpendingLimit: (childId: string, limit: number | null) => Promise<void>;
  onUpdateEmailSettings: (childId: string, email: string, enabled: boolean) => Promise<void>;
}

const ChildSettingsCard = ({ link, onUpdateSpendingLimit, onUpdateEmailSettings }: ChildSettingsCardProps) => {
  const [spendingLimit, setSpendingLimit] = useState(link.spending_limit?.toString() || '');
  const [email, setEmail] = useState(link.parent_email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(link.email_notifications_enabled ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSpendingLimit = async () => {
    setIsSaving(true);
    const limit = spendingLimit ? parseInt(spendingLimit) : null;
    await onUpdateSpendingLimit(link.child_id, limit);
    setIsSaving(false);
  };

  const handleSaveEmailSettings = async () => {
    setIsSaving(true);
    await onUpdateEmailSettings(link.child_id, email, notificationsEnabled);
    setIsSaving(false);
  };

  return (
    <div className="p-4 rounded-xl bg-secondary/50 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-lg">👤</span>
        </div>
        <div>
          <p className="font-semibold">{link.child?.username || 'Child'}</p>
          <p className="text-xs text-muted-foreground">{link.child?.balance || 0} coins</p>
        </div>
      </div>

      {/* Spending Limit */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          Spending Limit (per purchase)
        </Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="No limit"
            value={spendingLimit}
            onChange={(e) => setSpendingLimit(e.target.value)}
            min="0"
            className="flex-1 h-10 rounded-lg"
          />
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleSaveSpendingLimit}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {spendingLimit ? `Max ${spendingLimit} coins per purchase` : 'No spending limit set'}
        </p>
      </div>

      {/* Email Notifications */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Quest Notifications
          </Label>
          <Switch 
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>
        
        {notificationsEnabled && (
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-lg"
            />
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleSaveEmailSettings}
              disabled={isSaving || !email}
              className="w-full"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Email Settings'}
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Get notified when {link.child?.username || 'your child'} completes quests
        </p>
      </div>
    </div>
  );
};

const ParentDashboard = () => {
  const { profile, signOut, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [linkedChildren, setLinkedChildren] = useState<FamilyLinkWithChild[]>([]);
  const [pendingInvites, setPendingInvites] = useState<FamilyLinkWithChild[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantAmount, setGrantAmount] = useState('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [isGranting, setIsGranting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [parentPin, setParentPin] = useState('');
  const [newParentPin, setNewParentPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  
  const { playSound } = useSound();
  const { fireConfetti } = useConfetti();
  
  // Rate limiting for security
  const inviteRateLimit = useRateLimit(RATE_LIMITS.INVITE_CODE);
  const bonusRateLimit = useRateLimit(RATE_LIMITS.BONUS_GRANT);

  useEffect(() => {
    fetchData();
    fetchParentPin();
  }, [user]);

  const fetchParentPin = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'parent_registration_pin')
        .single();

      if (!error && data) {
        setParentPin(data.value);
      }
    } catch (error) {
      console.error('Error fetching parent PIN:', error);
    }
  };

  const handleUpdateParentPin = async () => {
    if (!newParentPin.trim()) {
      toast.error('Please enter a new PIN');
      return;
    }

    if (newParentPin.length < 4) {
      toast.error('PIN must be at least 4 characters');
      return;
    }

    setIsUpdatingPin(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: newParentPin, updated_at: new Date().toISOString() })
        .eq('key', 'parent_registration_pin');

      if (error) throw error;

      setParentPin(newParentPin);
      setNewParentPin('');
      setIsPinDialogOpen(false);
      toast.success('Parent PIN updated successfully!');
    } catch (error) {
      console.error('Error updating PIN:', error);
      toast.error('Failed to update PIN');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const handleUpdateSpendingLimit = async (childId: string, limit: number | null) => {
    try {
      const { error } = await supabase
        .from('family_links')
        .update({ spending_limit: limit })
        .eq('parent_id', user?.id)
        .eq('child_id', childId)
        .eq('status', 'active');

      if (error) throw error;

      setLinkedChildren(prev => 
        prev.map(link => 
          link.child_id === childId 
            ? { ...link, spending_limit: limit }
            : link
        )
      );

      toast.success(limit ? `Spending limit set to ${limit} coins` : 'Spending limit removed');
    } catch (error) {
      console.error('Error updating spending limit:', error);
      toast.error('Failed to update spending limit');
    }
  };

  const handleUpdateEmailSettings = async (childId: string, email: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('family_links')
        .update({ 
          parent_email: email || null,
          email_notifications_enabled: enabled 
        })
        .eq('parent_id', user?.id)
        .eq('child_id', childId)
        .eq('status', 'active');

      if (error) throw error;

      setLinkedChildren(prev => 
        prev.map(link => 
          link.child_id === childId 
            ? { ...link, parent_email: email || null, email_notifications_enabled: enabled }
            : link
        )
      );

      toast.success('Email settings updated');
    } catch (error) {
      console.error('Error updating email settings:', error);
      toast.error('Failed to update email settings');
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: linksData, error: linksError } = await supabase
        .from('family_links')
        .select('*')
        .eq('parent_id', user.id);

      if (linksError) throw linksError;

      const allLinks = (linksData || []) as FamilyLinkWithChild[];
      const activeLinks = allLinks.filter(l => l.status === 'active');
      const pending = allLinks.filter(l => l.status === 'pending');

      if (activeLinks.length > 0) {
        const childIds = activeLinks.map(l => l.child_id).filter(Boolean);
        if (childIds.length > 0) {
          const { data: childProfiles } = await supabase
            .from('profiles')
            .select('id, username, balance')
            .in('id', childIds);

          activeLinks.forEach(link => {
            link.child = childProfiles?.find(p => p.id === link.child_id);
          });

          const { data: verifications } = await supabase
            .from('pending_verifications')
            .select('*')
            .eq('parent_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          setPendingVerifications((verifications || []) as PendingVerification[]);
        }
      }

      setLinkedChildren(activeLinks);
      setPendingInvites(pending);

      if (activeLinks.length > 0) {
        const childIds = activeLinks.map(l => l.child_id).filter(Boolean);
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .in('user_id', childIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (txError) throw txError;
        setTransactions((txData || []) as Transaction[]);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createInviteCode = async () => {
    if (!user) return;
    
    // Rate limit check
    if (!inviteRateLimit.checkLimit()) return;
    
    setIsCreatingInvite(true);
    
    try {
      const code = Array.from({ length: 8 }, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
      ).join('');

      const { error } = await supabase
        .from('family_links')
        .insert({
          parent_id: user.id,
          child_id: user.id,
          invite_code: code,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Code Created!', {
        description: 'Share this with your child.',
      });

      fetchData();
    } catch (error) {
      console.error('Error creating invite:', error);
      toast.error('Failed to create code');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleGrantTokens = async () => {
    if (!selectedChild || !grantAmount || !user) return;

    const amount = parseInt(grantAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Rate limit check
    if (!bonusRateLimit.checkLimit()) return;

    setIsGranting(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: selectedChild,
        amount,
        type: 'earn',
        description: 'Bonus from Parent',
      });

      if (error) throw error;

      toast.success('Coins Sent!', {
        description: `Gave ${amount} coins.`,
        icon: <Gift className="w-5 h-5 text-primary" />,
      });

      setIsDialogOpen(false);
      setGrantAmount('');
      setSelectedChild('');
      fetchData();
    } catch (error) {
      console.error('Grant error:', error);
      toast.error('Failed to send coins');
    } finally {
      setIsGranting(false);
    }
  };

  const handleReviewVerification = async (verificationId: string, approve: boolean) => {
    setIsReviewing(verificationId);
    
    try {
      const verification = pendingVerifications.find(v => v.id === verificationId);
      if (!verification) throw new Error('Verification not found');

      const { error: updateError } = await supabase
        .from('pending_verifications')
        .update({ 
          status: approve ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', verificationId);

      if (updateError) throw updateError;

      if (approve) {
        await supabase.from('transactions').insert({
          user_id: verification.child_id,
          amount: verification.tokens,
          type: 'earn',
          description: `${verification.quest_name} (Parent Approved)`,
        });

        playSound('celebrate');
        fireConfetti('celebrate');
        toast.success('Approved!', {
          description: `Awarded ${verification.tokens} coins.`,
          icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
        });
      } else {
        playSound('error');
        toast.info('Rejected', {
          description: 'Quest was not approved.',
        });
      }

      fetchData();
    } catch (error) {
      console.error('Review error:', error);
      toast.error('Failed to review');
    } finally {
      setIsReviewing(null);
    }
  };

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Generate signed URLs for quest proof images (secure access)
  useEffect(() => {
    const generateSignedUrls = async () => {
      const paths = pendingVerifications.map(v => v.image_path);
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
    
    if (pendingVerifications.length > 0) {
      generateSignedUrls();
    }
  }, [pendingVerifications]);

  const getImageUrl = (path: string) => {
    return signedUrls[path] || '';
  };

  const totalEarned = transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-foreground">
                  Parent Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Hi, {profile?.username || 'Parent'}!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Give Bonus Coins Button */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 hidden sm:flex">
                    <Gift className="w-4 h-4" />
                    Give Coins
                  </Button>
                </DialogTrigger>
                <DialogContent className="clean-card">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">Give Coins</DialogTitle>
                    <DialogDescription>
                      Reward your child with bonus coins.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5 py-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Select Child</Label>
                      <select
                        value={selectedChild}
                        onChange={(e) => setSelectedChild(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-secondary text-foreground font-medium"
                      >
                        <option value="">Choose a child...</option>
                        {linkedChildren.map((link) => (
                          <option key={link.id} value={link.child_id}>
                            {link.child?.username || 'Player'} ({link.child?.balance || 0} coins)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold">Amount</Label>
                      <Input
                        type="number"
                        placeholder="How many coins?"
                        value={grantAmount}
                        onChange={(e) => setGrantAmount(e.target.value)}
                        min="1"
                        className="h-12 rounded-xl"
                      />
                    </div>

                    <Button
                      onClick={handleGrantTokens}
                      disabled={!selectedChild || !grantAmount || isGranting}
                      className="w-full gap-2"
                    >
                      {isGranting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Coins className="w-5 h-5" />
                      )}
                      Send Coins
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

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

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-lg mx-auto">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="kids" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Kids</span>
            </TabsTrigger>
            <TabsTrigger value="quests" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Quests</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="clean-card p-4 fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Earned</span>
                </div>
                <p className="text-2xl font-display font-bold text-primary">
                  +{totalEarned.toLocaleString()}
                </p>
              </div>

              <div className="clean-card p-4 fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Spent</span>
                </div>
                <p className="text-2xl font-display font-bold text-destructive">
                  -{totalSpent.toLocaleString()}
                </p>
              </div>

              <div className="clean-card p-4 fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Kids</span>
                </div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {linkedChildren.length}
                </p>
              </div>

              <div className="clean-card p-4 fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">To Review</span>
                </div>
                <p className="text-2xl font-display font-bold text-orange-500">
                  {pendingVerifications.length}
                </p>
              </div>
            </div>

            {/* Pending Verifications */}
            {pendingVerifications.length > 0 && (
              <div className="clean-card overflow-hidden">
                <div className="p-5 border-b border-border flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <h3 className="font-display font-bold text-lg">Awaiting Your Review</h3>
                </div>
                <div className="divide-y divide-border">
                  {pendingVerifications.map((v) => {
                    const child = linkedChildren.find(l => l.child_id === v.child_id)?.child;
                    return (
                      <div key={v.id} className="p-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                            <img 
                              src={getImageUrl(v.image_path)} 
                              alt="Quest proof"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-display font-bold">{v.quest_name}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
                                +{v.tokens} coins
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              By {child?.username || 'Child'}
                            </p>
                            {v.ai_reason && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                                <Brain className="w-3 h-3" />
                                AI: {v.ai_reason}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleReviewVerification(v.id, true)}
                                disabled={isReviewing === v.id}
                                className="gap-1"
                              >
                                {isReviewing === v.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReviewVerification(v.id, false)}
                                disabled={isReviewing === v.id}
                                className="gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Kids Overview */}
            {linkedChildren.length > 0 && (
              <div className="clean-card overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg">My Kids</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveTab('kids')}
                    className="text-muted-foreground"
                  >
                    View All →
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  {linkedChildren.slice(0, 3).map((link) => (
                    <ChildDetailCard 
                      key={link.id}
                      childId={link.child_id}
                      initialProfile={link.child}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Kids Tab */}
          <TabsContent value="kids" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl">My Kids</h2>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Child
                  </Button>
                </DialogTrigger>
                <DialogContent className="clean-card">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">Link a Child</DialogTitle>
                    <DialogDescription>
                      Create an invite code for your child to enter.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Button
                      onClick={createInviteCode}
                      disabled={isCreatingInvite}
                      className="w-full gap-2"
                    >
                      {isCreatingInvite ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserPlus className="w-5 h-5" />
                      )}
                      Create Invite Code
                    </Button>

                    {pendingInvites.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-muted-foreground">Active Codes</Label>
                        {pendingInvites.map((invite) => (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-secondary border border-border"
                          >
                            <code className="font-display text-xl text-primary tracking-widest">
                              {invite.invite_code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => invite.invite_code && copyInviteCode(invite.invite_code)}
                            >
                              {copiedCode === invite.invite_code ? (
                                <Check className="w-5 h-5 text-primary" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {linkedChildren.length === 0 ? (
              <div className="clean-card p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-display font-bold text-lg mb-2">No kids linked yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create an invite code to connect your child's account.
                </p>
                <Button onClick={() => setIsInviteDialogOpen(true)} className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Your First Child
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {linkedChildren.map((link) => (
                  <ChildDetailCard 
                    key={link.id}
                    childId={link.child_id}
                    initialProfile={link.child}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quests Tab */}
          <TabsContent value="quests">
            {user && (
              <QuestManagement 
                userId={user.id}
                linkedChildren={linkedChildren}
                onQuestCreated={fetchData}
              />
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="clean-card overflow-hidden">
              <div className="p-5 border-b border-border flex items-center gap-3">
                <History className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-display font-bold text-lg">Activity History</h3>
              </div>

              <div className="divide-y divide-border">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No activity yet</p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          tx.type === 'earn' ? "bg-primary/10" : "bg-destructive/10"
                        )}>
                          {tx.type === 'earn' ? (
                            <TrendingUp className="w-5 h-5 text-primary" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {tx.description || (tx.type === 'earn' ? 'Earned' : 'Spent')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <p className={cn(
                        "font-display font-bold",
                        tx.type === 'earn' ? "text-primary" : "text-destructive"
                      )}>
                        {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <div className="clean-card p-6 fade-in">
                <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Settings
                </h2>

                {/* Parent Registration PIN */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <KeyRound className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Parent Registration PIN</p>
                        <p className="text-sm text-muted-foreground">
                          Current PIN: <span className="font-mono font-bold">{parentPin || '****'}</span>
                        </p>
                      </div>
                    </div>
                    <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Change PIN
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="clean-card">
                        <DialogHeader>
                          <DialogTitle className="font-display text-xl">Change Parent PIN</DialogTitle>
                          <DialogDescription>
                            Enter a new PIN that other parents will need to register.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-5 py-4">
                          <div className="space-y-2">
                            <Label className="font-semibold">Current PIN</Label>
                            <Input
                              type="text"
                              value={parentPin}
                              disabled
                              className="h-12 rounded-xl font-mono bg-secondary"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="font-semibold">New PIN</Label>
                            <Input
                              type="text"
                              placeholder="Enter new PIN (min 4 characters)"
                              value={newParentPin}
                              onChange={(e) => setNewParentPin(e.target.value)}
                              minLength={4}
                              maxLength={20}
                              className="h-12 rounded-xl font-mono"
                            />
                          </div>

                          <Button
                            onClick={handleUpdateParentPin}
                            disabled={!newParentPin.trim() || isUpdatingPin}
                            className="w-full gap-2"
                          >
                            {isUpdatingPin ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <KeyRound className="w-5 h-5" />
                            )}
                            Update PIN
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <p className="text-xs text-muted-foreground px-4">
                    This PIN is required when someone wants to register as a parent. Share it only with trusted family members.
                  </p>
                </div>

                {/* Child Settings */}
                {linkedChildren.length > 0 && (
                  <div className="space-y-4 mt-8">
                    <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Child Settings
                    </h3>

                    {linkedChildren.map((link) => (
                      <ChildSettingsCard 
                        key={link.id} 
                        link={link}
                        onUpdateSpendingLimit={handleUpdateSpendingLimit}
                        onUpdateEmailSettings={handleUpdateEmailSettings}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ParentDashboard;
