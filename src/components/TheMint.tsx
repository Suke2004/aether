import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Camera, 
  Upload, 
  Book, 
  Pencil, 
  GraduationCap,
  Loader2,
  CheckCircle2,
  XCircle,
  Coins,
  Brain,
  Sparkles,
  Dumbbell,
  Music,
  Brush,
  Clock,
  User
} from 'lucide-react';
import useSound from '@/hooks/useSound';
import useConfetti from '@/hooks/useConfetti';
import { cn } from '@/lib/utils';
import { useRateLimit, RATE_LIMITS } from '@/hooks/useRateLimit';

interface Quest {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tokens: number;
  emoji: string;
  description: string;
  color: string;
  type: string;
  verificationMethod?: 'ai' | 'parent';
}

const defaultQuests: Quest[] = [
  { id: 'reading', name: 'Reading', icon: Book, tokens: 50, emoji: '📚', description: 'Read a book or story', color: 'bg-blue-500', type: 'reading' },
  { id: 'drawing', name: 'Drawing', icon: Pencil, tokens: 40, emoji: '🎨', description: 'Create awesome art', color: 'bg-pink-500', type: 'drawing' },
  { id: 'homework', name: 'Homework', icon: GraduationCap, tokens: 75, emoji: '📝', description: 'Complete your work', color: 'bg-green-500', type: 'homework' },
  { id: 'chores', name: 'Chores', icon: Brush, tokens: 60, emoji: '🧹', description: 'Help around the house', color: 'bg-orange-500', type: 'chores' },
  { id: 'exercise', name: 'Exercise', icon: Dumbbell, tokens: 55, emoji: '💪', description: 'Get active & move', color: 'bg-red-500', type: 'exercise' },
  { id: 'music', name: 'Music Practice', icon: Music, tokens: 65, emoji: '🎵', description: 'Practice your instrument', color: 'bg-purple-500', type: 'music' },
];

interface ParentQuest {
  id: string;
  name: string;
  description: string | null;
  tokens: number;
  quest_type: string;
  verification_method: string;
  status: string;
}

const TheMint = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [aiReason, setAiReason] = useState<string>('');
  const [parentQuests, setParentQuests] = useState<ParentQuest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { playSound } = useSound();
  const { fireConfetti } = useConfetti();
  
  // Rate limiting for quest submissions
  const questRateLimit = useRateLimit(RATE_LIMITS.QUEST_VERIFICATION);

  useEffect(() => {
    if (user) {
      fetchParentQuests();
      fetchPendingCount();
    }
  }, [user]);

  const fetchParentQuests = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('child_id', user.id)
      .eq('status', 'active');

    if (!error && data) {
      setParentQuests(data);
    }
  };

  const fetchPendingCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from('pending_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', user.id)
      .eq('status', 'pending');

    setPendingCount(count || 0);
  };

  // Combine default quests with parent-assigned quests
  const allQuests: Quest[] = [
    ...defaultQuests,
    ...parentQuests.map(pq => ({
      id: pq.id,
      name: pq.name,
      icon: Sparkles,
      tokens: pq.tokens,
      emoji: '⭐',
      description: pq.description || 'Complete this quest!',
      color: 'bg-accent',
      type: pq.quest_type,
      verificationMethod: pq.verification_method as 'ai' | 'parent',
    }))
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setVerificationResult(null);
      setAiReason('');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getParentId = async (): Promise<string | null> => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('family_links')
      .select('parent_id')
      .eq('child_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    return data?.parent_id || null;
  };

  const handleVerify = async () => {
    if (!imageFile || !selectedQuest || !user) return;

    // Rate limit check
    if (!questRateLimit.checkLimit()) return;

    setIsVerifying(true);
    setVerificationResult(null);
    setAiReason('');

    const quest = allQuests.find(q => q.id === selectedQuest);
    if (!quest) {
      setIsVerifying(false);
      return;
    }

    try {
      // Upload image first
      const fileName = `${user.id}/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('quest-proofs')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const imageBase64 = await fileToBase64(imageFile);

      // Check verification method
      const verifyWithParent = quest.verificationMethod === 'parent';

      if (verifyWithParent) {
        // Skip AI, go directly to parent verification
        await submitToParentVerification(quest, fileName, 'Parent verification requested');
        return;
      }

      // Try AI verification
      const { data, error } = await supabase.functions.invoke('verify-quest', {
        body: { questType: quest.type, imageBase64 },
      });

      if (error) throw new Error(error.message || 'Verification failed');

      const { valid, reason, confidence } = data;
      setAiReason(reason || '');

      if (valid) {
        // AI approved - grant tokens
        const { error: txError } = await supabase.from('transactions').insert({
          user_id: user.id,
          amount: quest.tokens,
          type: 'earn',
          description: `${quest.name} Quest Complete! (${confidence}% match)`,
        });

        if (txError) throw txError;

        // If it's a parent quest, mark it complete
        if (quest.verificationMethod) {
          await supabase
            .from('quests')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', quest.id);
        }

        await refreshProfile();

        setVerificationResult('success');
        playSound('celebrate');
        fireConfetti('coins');
        toast.success('Great job!', {
          description: `You earned ${quest.tokens} coins!`,
          icon: <Coins className="w-5 h-5 text-accent" />,
        });

        setTimeout(() => {
          setIsOpen(false);
          resetForm();
          fetchParentQuests();
        }, 2500);
      } else {
        // AI failed - fallback to parent verification
        await submitToParentVerification(quest, fileName, reason || 'AI could not verify');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Something went wrong');
      setIsVerifying(false);
    }
  };

  const submitToParentVerification = async (quest: Quest, imagePath: string, aiReason: string) => {
    const parentId = await getParentId();
    
    if (!parentId) {
      toast.error('No linked parent', {
        description: 'Ask a parent to link their account.',
      });
      setVerificationResult('failed');
      setAiReason('No parent linked for verification');
      setIsVerifying(false);
      return;
    }

    try {
      const { error } = await supabase.from('pending_verifications').insert({
        child_id: user!.id,
        parent_id: parentId,
        quest_id: quest.verificationMethod ? quest.id : null,
        quest_type: quest.type,
        quest_name: quest.name,
        tokens: quest.tokens,
        image_path: imagePath,
        ai_reason: aiReason,
        status: 'pending',
      });

      if (error) throw error;

      // Send email notification to parent
      try {
        await supabase.functions.invoke('send-quest-notification', {
          body: {
            childId: user!.id,
            childName: profile?.username || 'Your child',
            questName: quest.name,
            questType: quest.type,
            tokens: quest.tokens,
            status: 'pending',
          },
        });
      } catch (notifError) {
        console.log('Email notification failed (non-critical):', notifError);
      }

      setVerificationResult('pending');
      setAiReason('Sent to parent for review!');
      toast.info('Sent to Parent', {
        description: 'Your parent will review and approve.',
        icon: <User className="w-5 h-5 text-primary" />,
      });

      setTimeout(() => {
        setIsOpen(false);
        resetForm();
        fetchPendingCount();
      }, 2500);
    } catch (error) {
      console.error('Error submitting to parent:', error);
      toast.error('Failed to send to parent');
      setVerificationResult('failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const resetForm = () => {
    setSelectedQuest('');
    setImageFile(null);
    setPreviewUrl(null);
    setVerificationResult(null);
    setAiReason('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center slide-up">
        <h2 className="text-3xl font-display font-bold text-foreground mb-2">
          Earn Coins
        </h2>
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          Complete quests & our AI checks your work!
        </p>
        {pendingCount > 0 && (
          <p className="text-sm text-accent-foreground mt-2 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            {pendingCount} quest{pendingCount > 1 ? 's' : ''} waiting for parent review
          </p>
        )}
      </div>

      {/* Quest Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {allQuests.map((quest) => (
          <div
            key={quest.id}
            className="clean-card p-4 text-center"
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-white",
              quest.color
            )}>
              <span className="text-xl">{quest.emoji}</span>
            </div>
            <h3 className="font-display font-bold text-sm mb-1">{quest.name}</h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{quest.description}</p>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/20 text-accent-foreground font-semibold text-xs">
              <Coins className="w-3 h-3" />
              +{quest.tokens}
            </div>
            {quest.verificationMethod === 'parent' && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
                <User className="w-3 h-3" />
                Parent verifies
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Start Quest Button */}
      <div className="text-center">
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Sparkles className="w-5 h-5" />
              Start a Quest
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md clean-card">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">New Quest</DialogTitle>
              <DialogDescription>
                Show us what you did and earn coins!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Quest Selection */}
              <div className="space-y-2">
                <Label className="font-semibold">Pick a Quest</Label>
                <Select value={selectedQuest} onValueChange={setSelectedQuest}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Choose your quest..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allQuests.map((quest) => (
                      <SelectItem key={quest.id} value={quest.id} className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{quest.emoji}</span>
                          <span className="font-medium">{quest.name}</span>
                          <span className="text-muted-foreground">(+{quest.tokens})</span>
                          {quest.verificationMethod === 'parent' && (
                            <User className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="font-semibold">Take a Photo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border">
                    <img
                      src={previewUrl}
                      alt="Quest proof"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setPreviewUrl(null);
                        setVerificationResult(null);
                        setAiReason('');
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-card/90 text-destructive hover:bg-card"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>

                    {/* Verification Overlay */}
                    {verificationResult && (
                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center",
                        verificationResult === 'success' 
                          ? "bg-primary/20 backdrop-blur-sm" 
                          : verificationResult === 'pending'
                          ? "bg-accent/20 backdrop-blur-sm"
                          : "bg-destructive/20 backdrop-blur-sm"
                      )}>
                        {verificationResult === 'success' ? (
                          <div className="text-center celebrate p-4">
                            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-2" />
                            <p className="font-display text-xl text-primary font-bold">Great job!</p>
                            {aiReason && (
                              <p className="text-primary/80 mt-1 text-sm">{aiReason}</p>
                            )}
                          </div>
                        ) : verificationResult === 'pending' ? (
                          <div className="text-center p-4">
                            <Clock className="w-16 h-16 text-accent-foreground mx-auto mb-2" />
                            <p className="font-display text-xl text-accent-foreground font-bold">Sent to Parent!</p>
                            {aiReason && (
                              <p className="text-accent-foreground/80 mt-1 text-sm">{aiReason}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center shake p-4">
                            <XCircle className="w-16 h-16 text-destructive mx-auto mb-2" />
                            <p className="font-display text-xl text-destructive font-bold">Try Again</p>
                            {aiReason && (
                              <p className="text-destructive/80 mt-1 text-sm">{aiReason}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Verifying Overlay */}
                    {isVerifying && (
                      <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Brain className="w-12 h-12 text-primary animate-pulse mx-auto" />
                          <p className="font-medium text-primary mt-3">Checking...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 rounded-2xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary bg-secondary/30"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Tap to take a photo</p>
                      <p className="text-sm">Show us your completed quest</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleVerify}
                disabled={!selectedQuest || !imageFile || isVerifying || verificationResult === 'success' || verificationResult === 'pending'}
                className="w-full gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Check My Work
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TheMint;