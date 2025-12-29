import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ChildDashboard from '@/components/ChildDashboard';
import ParentDashboard from '@/components/ParentDashboard';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="text-center fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <span className="text-2xl">🌟</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Project Aether
            </h1>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {profile.role === 'child' ? <ChildDashboard /> : <ParentDashboard />}
    </div>
  );
};

export default Index;