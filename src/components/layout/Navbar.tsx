import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/theme/ThemeToggle";
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
      <div className="brand-strip w-full" aria-hidden />
      <nav className={`${fullBleed ? "w-full px-2" : "container mx-auto"} flex items-center justify-between ${compact ? "h-12" : "h-16"} flex-row`}>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <img src="/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png" alt="من عيونكم" className="h-7 w-auto md:h-8" loading="eager" />
          </Link>
        </div>
        <div>
          {userName ? (
            <div className="flex items-center gap-2">
              <Link to="/settings" className="hidden sm:inline-flex rounded-full px-3 py-1.5 bg-secondary text-secondary-foreground hover-scale" aria-label="حسابي">
                حسابي
              </Link>
              <Button variant="hero" size="sm" className="md:h-10 md:px-4" onClick={signOut} aria-label="تسجيل الخروج">
                تسجيل الخروج
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="hero" size="sm" className="md:h-10 md:px-4" aria-label="تسجيل الدخول">
                <Link to="/auth">تسجيل الدخول</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
      <div className="brand-strip w-full" aria-hidden />
      {/* brand bar removed */}
    </header>
  );
};

export default Navbar;
