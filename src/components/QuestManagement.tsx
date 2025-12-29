import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Plus, 
  Target, 
  Sparkles, 
  Brain, 
  User, 
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChildProfile {
  id: string;
  username: string | null;
  balance: number;
}

interface FamilyLinkWithChild {
  id: string;
  child_id: string;
  child?: ChildProfile;
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
  child_id: string;
}

interface QuestManagementProps {
  userId: string;
  linkedChildren: FamilyLinkWithChild[];
  onQuestCreated?: () => void;
}

const QuestManagement = ({ userId, linkedChildren, onQuestCreated }: QuestManagementProps) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingQuest, setDeletingQuest] = useState<string | null>(null);

  // Form state
  const [questName, setQuestName] = useState('');
  const [questDescription, setQuestDescription] = useState('');
  const [questTokens, setQuestTokens] = useState('25');
  const [questChild, setQuestChild] = useState('');
  const [questVerification, setQuestVerification] = useState<'ai' | 'parent'>('ai');
  const [filterChild, setFilterChild] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchQuests();
  }, [userId]);

  const fetchQuests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('parent_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuests((data || []) as Quest[]);
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuest = async () => {
    if (!questChild || !questName || !questTokens) return;

    const tokens = parseInt(questTokens);
    if (isNaN(tokens) || tokens <= 0) {
      toast.error('Please enter a valid token amount');
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from('quests').insert({
        parent_id: userId,
        child_id: questChild,
        name: questName,
        description: questDescription,
        tokens: tokens,
        quest_type: 'custom',
        verification_method: questVerification,
        status: 'active',
      });

      if (error) throw error;

      toast.success('Quest Created!', {
        description: `${questName} assigned to your child.`,
        icon: <Sparkles className="w-5 h-5 text-primary" />,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchQuests();
      onQuestCreated?.();
    } catch (error) {
      console.error('Quest creation error:', error);
      toast.error('Failed to create quest');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    setDeletingQuest(questId);
    try {
      const { error } = await supabase
        .from('quests')
        .update({ status: 'cancelled' })
        .eq('id', questId);

      if (error) throw error;

      toast.success('Quest cancelled');
      fetchQuests();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to cancel quest');
    } finally {
      setDeletingQuest(null);
    }
  };

  const resetForm = () => {
    setQuestName('');
    setQuestDescription('');
    setQuestTokens('25');
    setQuestChild('');
    setQuestVerification('ai');
  };

  const filteredQuests = quests.filter(quest => {
    if (filterChild !== 'all' && quest.child_id !== filterChild) return false;
    if (filterStatus !== 'all' && quest.status !== filterStatus) return false;
    return true;
  });

  const getChildName = (childId: string) => {
    const link = linkedChildren.find(l => l.child_id === childId);
    return link?.child?.username || 'Unknown';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'active':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="clean-card overflow-hidden">
      <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Quest Manager</h3>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Quest
            </Button>
          </DialogTrigger>
          <DialogContent className="clean-card">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Create Quest</DialogTitle>
              <DialogDescription>
                Assign a custom task to your child.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="font-semibold">Select Child</Label>
                <Select value={questChild} onValueChange={setQuestChild}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Choose a child..." />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedChildren.map((link) => (
                      <SelectItem key={link.id} value={link.child_id}>
                        {link.child?.username || 'Child'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Quest Name</Label>
                <Input
                  placeholder="e.g., Clean your room"
                  value={questName}
                  onChange={(e) => setQuestName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Description (optional)</Label>
                <Textarea
                  placeholder="What should they do?"
                  value={questDescription}
                  onChange={(e) => setQuestDescription(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Coin Reward</Label>
                <Input
                  type="number"
                  placeholder="25"
                  value={questTokens}
                  onChange={(e) => setQuestTokens(e.target.value)}
                  min="1"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Verification Method</Label>
                <Select value={questVerification} onValueChange={(v: 'ai' | 'parent') => setQuestVerification(v)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" />
                        <span>AI First (falls back to you)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="parent">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span>Parent Only</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {questVerification === 'ai' 
                    ? "AI will check first. If it fails, you'll review."
                    : "You'll review all submissions manually."}
                </p>
              </div>

              <Button
                onClick={handleCreateQuest}
                disabled={!questChild || !questName || !questTokens || isCreating}
                className="w-full gap-2"
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Create Quest
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-border bg-secondary/30 flex flex-wrap gap-3">
        <Select value={filterChild} onValueChange={setFilterChild}>
          <SelectTrigger className="w-[150px] h-9 rounded-lg">
            <SelectValue placeholder="All Kids" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Kids</SelectItem>
            {linkedChildren.map((link) => (
              <SelectItem key={link.id} value={link.child_id}>
                {link.child?.username || 'Child'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9 rounded-lg">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quest List */}
      <div className="divide-y divide-border">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          </div>
        ) : filteredQuests.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No quests found</p>
            <p className="text-sm mt-1">Create a quest to get started.</p>
          </div>
        ) : (
          filteredQuests.slice(0, 20).map((quest) => (
            <div
              key={quest.id}
              className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getStatusIcon(quest.status)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{quest.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {getChildName(quest.child_id)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{format(new Date(quest.created_at), 'MMM d')}</span>
                    <span>•</span>
                    <span>{quest.verification_method === 'ai' ? '🤖 AI' : '👤 Parent'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={cn(
                  "font-display font-bold text-sm",
                  quest.status === 'completed' ? "text-primary" : "text-muted-foreground"
                )}>
                  +{quest.tokens}
                </span>
                
                {quest.status === 'active' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteQuest(quest.id)}
                    disabled={deletingQuest === quest.id}
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                  >
                    {deletingQuest === quest.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestManagement;
