import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/branding/Logo";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const apply = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const name = (session?.user?.user_metadata as any)?.full_name || (session?.user?.user_metadata as any)?.name || session?.user?.email || null;
      setUserName(name);
    };
    apply();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const name = (session?.user?.user_metadata as any)?.full_name || (session?.user?.user_metadata as any)?.name || session?.user?.email || null;
      setUserName(name);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () => {
    const redirectTo = window.location.origin;
    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container mx-auto flex items-center justify-between h-16 flex-row-reverse">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <Logo variant="brand" size={28} />
          <span className="sr-only">من عيونكم</span>
        </Link>
        <div>
          {userName ? (
            <Button variant="outline" onClick={signOut} aria-label="تسجيل الخروج">
              تسجيل الخروج
            </Button>
          ) : (
            <Button variant="outline" onClick={signInWithGoogle} aria-label="تسجيل الدخول">
              تسجيل الدخول
            </Button>
          )}
        </div>
      </nav>
      <div className="h-0.5 bg-brand-gradient" aria-hidden />
    </header>
  );
};

export default Navbar;
