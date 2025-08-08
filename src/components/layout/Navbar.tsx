import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu as MenuIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Logo from "@/components/branding/Logo";
const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <span className="hidden sm:inline-flex items-center gap-2">
            <Logo variant="icon" colored={false} gradient size={22} className="bg-brand-gradient" title="شعار من عيونكم" />
            <Logo variant="wordmark" colored={false} size={110} title="من عيونكم" />
          </span>
          <Logo variant="icon" colored={false} gradient size={24} className="sm:hidden bg-brand-gradient" title="شعار من عيونكم" />
          <span className="sr-only">من عيونكم</span>
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <Link to="/choose-plan" className="text-sm text-muted-foreground hover:text-foreground">
            خطط الشركات
          </Link>
          <Link to="/create-event" className="text-sm text-muted-foreground hover:text-foreground">
            إنشاء مناسبة
          </Link>
          <ThemeToggle />
          <Button
            variant="hero"
            size="lg"
            onClick={() =>
              toast({
                title: "قريبًا: دخول Google",
                description: "سيتوفّر بعد ربط Google و Supabase.",
              })
            }
            aria-label="الدخول عبر Google"
          >
            <span className="flex items-center gap-2">
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
        <div className="flex items-center gap-2 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="القائمة">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom">
              <DropdownMenuItem asChild>
                <Link to="/choose-plan">خطط الشركات</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/create-event">إنشاء مناسبة</Link>
              </DropdownMenuItem>
              <div className="px-2 py-1.5">
                <Button
                  variant="hero"
                  className="w-full"
                  onClick={() =>
                    toast({
                      title: "قريبًا: دخول Google",
                      description: "سيتوفّر بعد ربط Google و Supabase.",
                    })
                  }
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
