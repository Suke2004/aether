import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
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
  Trash2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// --- Interfaces ---
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

const QuestManagement = ({
  userId,
  linkedChildren,
  onQuestCreated,
}: QuestManagementProps) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingQuest, setDeletingQuest] = useState<string | null>(null);

  // Form state
  const [questName, setQuestName] = useState("");
  const [questDescription, setQuestDescription] = useState("");
  const [questTokens, setQuestTokens] = useState("25");
  const [questChild, setQuestChild] = useState("");
  const [questVerification, setQuestVerification] = useState<"ai" | "parent">(
    "ai"
  );

  // Filters
  const [filterChild, setFilterChild] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (userId) fetchQuests();
  }, [userId]);

  const fetchQuests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("quests")
        .select("*")
        .eq("parent_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuests((data || []) as Quest[]);
    } catch (error) {
      console.error("Error fetching quests:", error);
      toast.error("Could not load quests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuest = async () => {
    if (!questChild || !questName || !questTokens) return;

    const tokens = parseInt(questTokens);
    if (isNaN(tokens) || tokens <= 0) {
      toast.error("Please enter a valid token amount");
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from("quests").insert({
        parent_id: userId,
        child_id: questChild,
        name: questName,
        description: questDescription,
        tokens: tokens,
        quest_type: "custom",
        verification_method: questVerification,
        status: "active",
      });

      if (error) throw error;

      toast.success("Quest Created!", {
        description: `${questName} assigned successfully.`,
        icon: <Sparkles className='w-5 h-5 text-primary' />,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchQuests();
      onQuestCreated?.();
    } catch (error) {
      console.error("Quest creation error:", error);
      toast.error("Failed to create quest");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    setDeletingQuest(questId);
    try {
      const { error } = await supabase
        .from("quests")
        .update({ status: "cancelled" })
        .eq("id", questId);

      if (error) throw error;

      toast.success("Quest cancelled");
      fetchQuests();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to cancel quest");
    } finally {
      setDeletingQuest(null);
    }
  };

  const resetForm = () => {
    setQuestName("");
    setQuestDescription("");
    setQuestTokens("25");
    setQuestChild("");
    setQuestVerification("ai");
  };

  const filteredQuests = quests.filter((quest) => {
    if (filterChild !== "all" && quest.child_id !== filterChild) return false;
    if (filterStatus !== "all" && quest.status !== filterStatus) return false;
    // Hide cancelled quests unless explicitly filtered for?
    // For now showing all to match previous logic, but usually cancelled are hidden by default.
    return true;
  });

  const getChildName = (childId: string) => {
    const link = linkedChildren.find((l) => l.child_id === childId);
    return link?.child?.username || "Unknown";
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          icon: <CheckCircle2 className='w-4 h-4' />,
          color: "text-green-500",
          bg: "bg-green-500/10",
          label: "Done",
        };
      case "active":
        return {
          icon: <Clock className='w-4 h-4' />,
          color: "text-orange-500",
          bg: "bg-orange-500/10",
          label: "Active",
        };
      case "cancelled":
        return {
          icon: <XCircle className='w-4 h-4' />,
          color: "text-muted-foreground",
          bg: "bg-secondary",
          label: "Cancelled",
        };
      default:
        return {
          icon: <Target className='w-4 h-4' />,
          color: "text-foreground",
          bg: "bg-secondary",
          label: status,
        };
    }
  };

  return (
    <div className='clean-card overflow-hidden h-full flex flex-col'>
      {/* Header */}
      <div className='p-4 md:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center'>
            <Target className='w-5 h-5 text-primary' />
          </div>
          <div>
            <h3 className='font-display font-bold text-lg leading-tight'>
              Quest Manager
            </h3>
            <p className='text-xs text-muted-foreground'>
              Assign and track tasks
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className='gap-2 w-full sm:w-auto shadow-md hover:shadow-lg transition-all'>
              <Plus className='w-4 h-4' />
              New Quest
            </Button>
          </DialogTrigger>
          <DialogContent className='clean-card w-[95vw] max-w-md rounded-2xl'>
            <DialogHeader>
              <DialogTitle className='font-display text-xl'>
                Create Quest
              </DialogTitle>
              <DialogDescription>
                Assign a custom task to your child.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label className='font-semibold'>Select Child</Label>
                <Select value={questChild} onValueChange={setQuestChild}>
                  <SelectTrigger className='h-12 rounded-xl'>
                    <SelectValue placeholder='Choose a child...' />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedChildren.map((link) => (
                      <SelectItem key={link.id} value={link.child_id}>
                        {link.child?.username || "Child"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label className='font-semibold'>Quest Name</Label>
                <Input
                  placeholder='e.g., Clean your room'
                  value={questName}
                  onChange={(e) => setQuestName(e.target.value)}
                  className='h-12 rounded-xl'
                />
              </div>

              <div className='space-y-2'>
                <Label className='font-semibold'>Description (optional)</Label>
                <Textarea
                  placeholder='What should they do?'
                  value={questDescription}
                  onChange={(e) => setQuestDescription(e.target.value)}
                  className='rounded-xl resize-none'
                  rows={2}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='font-semibold'>Reward</Label>
                  <div className='relative'>
                    <Input
                      type='number'
                      placeholder='25'
                      value={questTokens}
                      onChange={(e) => setQuestTokens(e.target.value)}
                      min='1'
                      className='h-12 rounded-xl pl-8'
                    />
                    <span className='absolute left-3 top-3.5 text-lg'>🪙</span>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label className='font-semibold'>Verification</Label>
                  <Select
                    value={questVerification}
                    onValueChange={(v: "ai" | "parent") =>
                      setQuestVerification(v)
                    }>
                    <SelectTrigger className='h-12 rounded-xl'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ai'>🤖 AI Check</SelectItem>
                      <SelectItem value='parent'>👤 Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateQuest}
                disabled={
                  !questChild || !questName || !questTokens || isCreating
                }
                className='w-full gap-2 h-11 mt-2'>
                {isCreating ? (
                  <Loader2 className='w-5 h-5 animate-spin' />
                ) : (
                  <Sparkles className='w-5 h-5' />
                )}
                Create Quest
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className='p-3 md:p-4 border-b border-border bg-secondary/20 flex flex-col sm:flex-row gap-3'>
        <div className='flex items-center gap-2 text-sm text-muted-foreground sm:hidden mb-1'>
          <Filter className='w-4 h-4' /> Filters
        </div>
        <Select value={filterChild} onValueChange={setFilterChild}>
          <SelectTrigger className='w-full sm:w-[160px] h-9 rounded-lg bg-background'>
            <SelectValue placeholder='All Kids' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Kids</SelectItem>
            {linkedChildren.map((link) => (
              <SelectItem key={link.id} value={link.child_id}>
                {link.child?.username || "Child"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className='w-full sm:w-[160px] h-9 rounded-lg bg-background'>
            <SelectValue placeholder='All Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='completed'>Completed</SelectItem>
            <SelectItem value='cancelled'>Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quest List */}
      <div className='divide-y divide-border overflow-y-auto max-h-[600px]'>
        {loading ? (
          <div className='p-12 text-center'>
            <Loader2 className='w-8 h-8 animate-spin mx-auto text-primary' />
            <p className='text-sm text-muted-foreground mt-2'>
              Loading quests...
            </p>
          </div>
        ) : filteredQuests.length === 0 ? (
          <div className='flex flex-col items-center justify-center p-12 text-center text-muted-foreground'>
            <div className='w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4'>
              <Target className='w-8 h-8 opacity-40' />
            </div>
            <p className='font-display font-bold text-lg text-foreground'>
              No quests found
            </p>
            <p className='text-sm mt-1 max-w-xs'>
              {filterStatus !== "all" || filterChild !== "all"
                ? "Try adjusting your filters to see more results."
                : "Create a new quest to get your child started!"}
            </p>
          </div>
        ) : (
          filteredQuests.slice(0, 50).map((quest) => {
            const statusConfig = getStatusConfig(quest.status);
            return (
              <div
                key={quest.id}
                className='group flex items-center justify-between p-4 hover:bg-secondary/40 transition-colors'>
                <div className='flex items-start gap-3 min-w-0 flex-1'>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      statusConfig.bg,
                      statusConfig.color
                    )}>
                    {statusConfig.icon}
                  </div>

                  <div className='min-w-0 pr-2'>
                    <p className='font-medium text-sm text-foreground truncate'>
                      {quest.name}
                    </p>

                    <div className='flex flex-wrap items-center gap-x-2 gap-y-1 mt-1'>
                      <span className='text-xs px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border/50'>
                        {getChildName(quest.child_id)}
                      </span>
                      <span className='text-[10px] text-muted-foreground flex items-center gap-1'>
                        {format(new Date(quest.created_at), "MMM d")}
                        <span>•</span>
                        {quest.verification_method === "ai"
                          ? "🤖 AI Verified"
                          : "👤 Parent Review"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='flex flex-col items-end gap-2 pl-2'>
                  <span
                    className={cn(
                      "font-display font-bold text-sm",
                      quest.status === "completed"
                        ? "text-green-600"
                        : "text-primary"
                    )}>
                    +{quest.tokens}
                  </span>

                  {quest.status === "active" && (
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleDeleteQuest(quest.id)}
                      disabled={deletingQuest === quest.id}
                      className='h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all'>
                      {deletingQuest === quest.id ? (
                        <Loader2 className='w-3 h-3 animate-spin' />
                      ) : (
                        <Trash2 className='w-3 h-3' />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QuestManagement;
