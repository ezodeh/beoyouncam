import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu as MenuIcon } from "lucide-react";
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
      <nav className="container mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <span className="hidden sm:inline-flex items-center gap-2">
            <Logo variant="icon" colored={false} gradient size={28} className="bg-brand-gradient" title="شعار من عيونكم" />
            <span className="font-extrabold text-xl md:text-2xl leading-none">من عيونكم</span>
          </span>
          <Logo variant="icon" colored={false} gradient size={28} className="sm:hidden bg-brand-gradient" title="شعار من عيونكم" />
          <span className="sr-only">من عيونكم</span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <Button asChild variant="hero" size="lg" aria-label="إنشاء مناسبة">
            <Link to="/create-event">إنشاء مناسبة</Link>
          </Button>
          <Link to="/choose-plan" className="text-sm text-muted-foreground hover:text-foreground">
            خطط الشركات
          </Link>
          <ThemeToggle />
          {userName ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" aria-label="قائمة الحساب">{userName}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/admin">حسابي</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>تسجيل الخروج</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={signInWithGoogle} aria-label="الدخول عبر Google">
              الدخول عبر Google
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="القائمة">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom">
              <DropdownMenuItem asChild>
                <Link to="/create-event">إنشاء مناسبة</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/choose-plan">خطط الشركات</Link>
              </DropdownMenuItem>
              {userName ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/admin">حسابي</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>تسجيل الخروج</DropdownMenuItem>
                </>
              ) : (
                <div className="px-2 py-1.5">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={signInWithGoogle}
                    aria-label="الدخول عبر Google"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.94 0 7.5 1.4 10.3 3.7l7.7-7.7C37.7 1.9 31.3 0 24 0 14.6 0 6.4 4.9 1.9 12.1l8.9 6.9C12.9 13.4 17.9 9.5 24 9.5z"/>
                        <path fill="#34A853" d="M46.5 24.6c0-1.6-.1-2.7-.4-3.9H24v7.4h12.8c-.3 2-1.6 5-4.7 7.1l7.2 5.6c4.3-4 7.2-9.9 7.2-16.2z"/>
                        <path fill="#4A90E2" d="M24 48c6.5 0 12-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.8 2.4-8.7 2.4-6.7 0-12.3-4.5-14.3-10.6l-9 7c4.5 7.2 12.7 12.6 23.3 12.6z"/>
                        <path fill="#FBBC05" d="M9.7 28.4c-.5-1.4-.7-3-.7-4.4s.2-3 .7-4.4l-8.9-6.9C-1 16.1-1 19.9-1 24s0 7.9 1.8 11.3l8.9-6.9z"/>
                      </svg>
                      <span>الدخول عبر Google</span>
                    </span>
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </nav>
      <div className="h-0.5 bg-brand-gradient" aria-hidden />
    </header>
  );
};

export default Navbar;
