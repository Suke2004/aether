import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  LogOut,
  ShoppingBag,
  Sparkles,
  Link,
  Loader2,
  Check,
  Trophy,
  Flame,
} from "lucide-react";
import BalanceDisplay from "./BalanceDisplay";
import TheMarket from "./TheMarket";
import TheMint from "./TheMint";
import QuestHistory from "./QuestHistory";
import RealtimeNotifications from "./RealtimeNotifications";
import StreakDisplay from "./StreakDisplay";

const ChildDashboard = () => {
  const { profile, signOut, user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"market" | "mint" | "history">(
    "market"
  );
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleApprovalNotification = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleLinkParent = async () => {
    if (!inviteCode.trim() || !user) return;

    setIsLinking(true);
    try {
      const { data: invite, error: findError } = await supabase
        .from("family_links")
        .select("*")
        .eq("invite_code", inviteCode.toUpperCase().trim())
        .eq("status", "pending")
        .single();

      if (findError || !invite) {
        toast.error("Invalid code", {
          description: "Please check the code and try again.",
        });
        setIsLinking(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("family_links")
        .update({
          child_id: user.id,
          status: "active",
          linked_at: new Date().toISOString(),
          invite_code: null,
        })
        .eq("id", invite.id);

      if (updateError) throw updateError;

      toast.success("Connected!", {
        description: "You are now linked with your parent.",
        icon: <Check className='w-5 h-5 text-primary' />,
      });

      setIsLinkDialogOpen(false);
      setInviteCode("");
      refreshProfile();
    } catch (error) {
      console.error("Link error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLinking(false);
    }
  };

  if (!profile) return null;

  // Helper for tab class names
  const getTabClass = (tabName: typeof activeTab) =>
    `flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 w-full md:w-auto px-2 py-2 md:px-4 md:py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
      activeTab === tabName
        ? "text-primary bg-primary/10"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <div className='min-h-screen flex flex-col bg-background pb-20 md:pb-0'>
      {/* Realtime Notifications */}
      <RealtimeNotifications onApproval={handleApprovalNotification} />

      {/* Header */}
      <header className='sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md'>
        <div className='container mx-auto px-4 py-3 md:py-4'>
          <div className='flex items-center justify-between gap-4'>
            {/* Logo & User Info */}
            <div className='flex items-center gap-3 min-w-0 flex-1'>
              <div className='w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-xl bg-primary flex items-center justify-center shadow-sm'>
                <span className='text-lg md:text-xl'>🌟</span>
              </div>
              <div className='min-w-0'>
                <h1 className='font-display font-bold text-base md:text-lg text-foreground leading-tight'>
                  Aether
                </h1>
                <p className='text-xs md:text-sm text-muted-foreground truncate'>
                  Hi, {profile.username || "there"}!
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-2 md:gap-3 shrink-0'>
              <Dialog
                open={isLinkDialogOpen}
                onOpenChange={setIsLinkDialogOpen}>
                <DialogTrigger asChild>
                  {/* Responsive Button: Icon only on mobile, Text on desktop */}
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-9 px-2.5 md:px-4 gap-2'>
                    <Link className='w-4 h-4' />
                    <span className='hidden sm:inline'>Link Parent</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className='clean-card w-[90vw] max-w-md rounded-2xl'>
                  <DialogHeader>
                    <DialogTitle className='font-display text-xl'>
                      Link with Parent
                    </DialogTitle>
                    <DialogDescription>
                      Enter the invite code from your parent to connect.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label className='font-semibold'>Invite Code</Label>
                      <Input
                        placeholder='ABCD1234'
                        value={inviteCode}
                        onChange={(e) =>
                          setInviteCode(e.target.value.toUpperCase())
                        }
                        maxLength={8}
                        className='font-display text-xl tracking-widest text-center h-14 rounded-xl'
                      />
                    </div>
                    <Button
                      onClick={handleLinkParent}
                      disabled={inviteCode.length !== 8 || isLinking}
                      className='w-full'>
                      {isLinking ? (
                        <Loader2 className='w-5 h-5 animate-spin' />
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Streak Badge - Hide text on very small screens if needed, mostly visible */}
              {(profile.current_streak || 0) > 0 && (
                <div className='flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-600 dark:text-orange-400'>
                  <Flame className='w-3.5 h-3.5 md:w-4 md:h-4' />
                  <span className='font-semibold text-xs md:text-sm'>
                    {profile.current_streak}
                  </span>
                </div>
              )}

              <BalanceDisplay balance={profile.balance} />

              <Button
                variant='ghost'
                size='icon'
                onClick={signOut}
                className='h-9 w-9 text-muted-foreground hover:text-destructive shrink-0'>
                <LogOut className='w-4 h-4 md:w-5 md:h-5' />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation (Top Tabs) - Hidden on Mobile */}
      <nav className='hidden md:block border-b border-border bg-card'>
        <div className='container mx-auto px-4'>
          <div className='flex gap-1 py-2'>
            <button
              onClick={() => setActiveTab("market")}
              className={getTabClass("market")}>
              <ShoppingBag className='w-4 h-4' />
              Shop
            </button>
            <button
              onClick={() => setActiveTab("mint")}
              className={getTabClass("mint")}>
              <Sparkles className='w-4 h-4' />
              Earn Coins
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={getTabClass("history")}>
              <Trophy className='w-4 h-4' />
              Achievements
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className='flex-1 container mx-auto px-4 py-4 md:py-8'>
        <div className='fade-in space-y-4 md:space-y-6'>
          {/* Streak Display */}
          {activeTab === "mint" && (
            <StreakDisplay
              currentStreak={profile.current_streak || 0}
              longestStreak={profile.longest_streak || 0}
              lastQuestDate={profile.last_quest_date}
            />
          )}

          {activeTab === "market" && <TheMarket />}
          {activeTab === "mint" && <TheMint />}
          {activeTab === "history" && <QuestHistory key={refreshKey} />}
        </div>
      </main>

      {/* Mobile Navigation (Bottom Bar) - Hidden on Desktop */}
      <nav className='md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border pb-safe'>
        <div className='flex items-center justify-around h-16 px-2'>
          <button
            onClick={() => setActiveTab("market")}
            className={getTabClass("market")}>
            <ShoppingBag
              className={`w-5 h-5 mb-0.5 ${
                activeTab === "market" ? "fill-current" : ""
              }`}
            />
            <span>Shop</span>
          </button>
          <button
            onClick={() => setActiveTab("mint")}
            className={getTabClass("mint")}>
            <Sparkles
              className={`w-5 h-5 mb-0.5 ${
                activeTab === "mint" ? "fill-current" : ""
              }`}
            />
            <span>Earn</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={getTabClass("history")}>
            <Trophy
              className={`w-5 h-5 mb-0.5 ${
                activeTab === "history" ? "fill-current" : ""
              }`}
            />
            <span>History</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default ChildDashboard;
