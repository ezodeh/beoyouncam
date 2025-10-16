import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "لوحة الإدارة — من عيونكم";
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user has admin role using security definer function
      const { data: isAdmin, error } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });

      if (error) {
        console.error('Error checking admin role:', error);
        navigate('/');
        return;
      }

      if (!isAdmin) {
        navigate('/');
        return;
      }

      // User is authorized
      setIsAuthorized(true);
    } catch (error) {
      console.error('Authorization check failed:', error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-12 space-y-4">
        <h1 className="text-3xl font-extrabold">لوحة الإدارة (SaaS)</h1>
        <p className="text-muted-foreground">
          هذه الصفحة ستُفعّل بعد ربط Supabase (جداول، RLS، وتحليلات) + Stripe. سنقوم بإعدادها فور ربط التكاملات.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
