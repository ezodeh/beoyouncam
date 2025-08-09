import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { PlusCircle, QrCode, Settings, LogOut, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

  const signOut = async () => { 
    await supabase.auth.signOut(); 
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className={`${fullBleed ? "w-full px-2" : "container mx-auto"} px-4`}>
        {/* Mobile Layout - Stacked */}
        <div className="sm:hidden">
          {/* Logo and Menu in same row */}
          <div className="flex items-center justify-between py-3">
            <Link to={userName ? "/account" : "/"} className="flex items-center gap-2 text-foreground">
              <img src="/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png" alt="من عيونكم" className="h-8 w-auto" loading="eager" />
            </Link>
            
            {userName ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" aria-label="القائمة">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border border-border shadow-lg z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/create-event" className="inline-flex items-center gap-2 w-full px-2 py-2 text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                      <PlusCircle className="h-4 w-4" />
                      إنشاء مناسبة
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/scanner" className="inline-flex items-center gap-2 w-full px-2 py-2 text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                      <QrCode className="h-4 w-4" />
                      ماسح QR
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="inline-flex items-center gap-2 w-full px-2 py-2 text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                      <Settings className="h-4 w-4" />
                      إعدادات الحساب
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <div className="inline-flex items-center gap-2 w-full px-2 py-2 text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer" onClick={(e) => {
                      e.preventDefault();
                      const themeToggleButton = e.currentTarget.querySelector('button');
                      if (themeToggleButton) {
                        themeToggleButton.click();
                      }
                    }}>
                      <div className="h-4 w-4 flex items-center justify-center">
                        <ThemeToggle />
                      </div>
                      <span>الوضع الليلي</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="inline-flex items-center gap-2 w-full px-2 py-2 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="hero" size="sm" className="px-6" aria-label="تسجيل الدخول">
                <Link to="/auth">تسجيل الدخول</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Layout - Horizontal */}
        <div className="hidden sm:flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to={userName ? "/account" : "/"} className="flex items-center gap-2 text-foreground">
              <img src="/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png" alt="من عيونكم" className="h-9 w-auto" loading="eager" />
            </Link>
          </div>
          
          <div>
            {userName ? (
              <div className="flex items-center gap-1.5">
                <Button asChild variant="ghost" size="icon" className="rounded-full" aria-label="إنشاء مناسبة جديدة">
                  <Link to="/create-event"><PlusCircle className="h-5 w-5" /></Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="rounded-full" aria-label="إعدادات الحساب">
                  <Link to="/settings"><Settings className="h-5 w-5" /></Link>
                </Button>
                <ThemeToggle />
                <Button variant="ghost" size="icon" className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" aria-label="تسجيل الخروج" onClick={signOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="hero" size="sm" className="h-10 px-4" aria-label="تسجيل الدخول">
                  <Link to="/auth">تسجيل الدخول</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <div className="brand-strip w-full" aria-hidden />
      {/* brand bar removed */}
    </header>
  );
};

export default Navbar;
