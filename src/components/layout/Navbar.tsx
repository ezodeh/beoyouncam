import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface NavbarProps { compact?: boolean; fullBleed?: boolean }
const Navbar = ({ compact = false, fullBleed = false }: NavbarProps) => {
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
      <nav className={`${fullBleed ? "w-full px-2" : "container mx-auto"} flex items-center justify-between ${compact ? "h-12" : "h-16"} flex-row`}>
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <img src="/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png" alt="من عيونكم" className="h-7 w-auto md:h-8" loading="eager" />
        </Link>
        <div>
          {userName ? (
            <Button variant="hero" size="sm" className="md:h-10 md:px-4" onClick={signOut} aria-label="تسجيل الخروج">
              تسجيل الخروج
            </Button>
          ) : (
            <Button variant="hero" size="sm" className="md:h-10 md:px-4" onClick={signInWithGoogle} aria-label="تسجيل الدخول">
              تسجيل الدخول
            </Button>
          )}
        </div>
      </nav>
      {/* brand bar removed */}
    </header>
  );
};

export default Navbar;
