import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Shield, Mail, Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'child' | 'parent'>('child');
  const [parentPin, setParentPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isLogin) {
      await signIn(email, password);
    } else {
      // Validate parent PIN if registering as parent
      if (role === 'parent') {
        try {
          const { data: settings, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'parent_registration_pin')
            .single();

          if (error || !settings) {
            toast.error('Unable to verify parent PIN. Please try again.');
            setIsLoading(false);
            return;
          }

          if (parentPin !== settings.value) {
            toast.error('Invalid parent PIN. Please enter the correct PIN to register as a parent.');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          toast.error('Unable to verify parent PIN. Please try again.');
          setIsLoading(false);
          return;
        }
      }
      await signUp(email, password, username, role);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 slide-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <span className="text-2xl">🌟</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Project Aether
            </h1>
          </div>
          <p className="text-muted-foreground font-medium">
            Earn, Learn & Play!
          </p>
        </div>

        {/* Auth Card */}
        <div className="clean-card p-8 fade-in">
          {/* Toggle */}
          <div className="flex gap-2 mb-8 p-1 bg-secondary rounded-xl">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 ${
                isLogin 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 ${
                !isLogin 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 rounded-xl"
              />
            </div>

            {/* Sign Up Fields */}
            {!isLogin && (
              <>
                {/* Username */}
                <div className="space-y-2 slide-up">
                  <Label htmlFor="username" className="text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Your Name
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                    className="h-12 rounded-xl"
                  />
                </div>

                {/* Role Selection */}
                <div className="space-y-3 slide-up">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    I am a...
                  </Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(value) => {
                      setRole(value as 'child' | 'parent');
                      if (value === 'child') setParentPin('');
                    }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div>
                      <RadioGroupItem
                        value="child"
                        id="child"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="child"
                        className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-border cursor-pointer transition-all duration-200 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                      >
                        <span className="text-3xl mb-2">🎮</span>
                        <span className="font-display font-semibold">Kid</span>
                        <span className="text-xs text-muted-foreground">Earn & Play</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="parent"
                        id="parent"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="parent"
                        className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-border cursor-pointer transition-all duration-200 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                      >
                        <span className="text-3xl mb-2">👨‍👩‍👧</span>
                        <span className="font-display font-semibold">Parent</span>
                        <span className="text-xs text-muted-foreground">Guide & Reward</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Parent PIN - only shown when parent is selected */}
                {role === 'parent' && (
                  <div className="space-y-2 slide-up">
                    <Label htmlFor="parentPin" className="text-sm font-semibold flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-primary" />
                      Parent PIN
                    </Label>
                    <Input
                      id="parentPin"
                      type="password"
                      placeholder="Enter parent PIN"
                      value={parentPin}
                      onChange={(e) => setParentPin(e.target.value)}
                      required={role === 'parent'}
                      maxLength={10}
                      className="h-12 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ask your family admin for the parent PIN
                    </p>
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Get Started"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-semibold"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;