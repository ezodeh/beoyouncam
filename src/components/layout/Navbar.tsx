import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu as MenuIcon } from "lucide-react";
// logo served from /lovable-uploads during editing
const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
          <img src="/lovable-uploads/0200d767-58b7-4ed9-8589-ae65fa2df295.png" alt="شعار من عيونكم" className="h-7 w-auto" loading="lazy" />
          <span className="sr-only">من عيونكم</span>
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <Link to="/choose-plan" className="text-sm text-muted-foreground hover:text-foreground">
            الخطط
          </Link>
          <Link to="/create-event" className="text-sm text-muted-foreground hover:text-foreground">
            إنشاء مناسبة
          </Link>
          <ThemeToggle />
          <Button asChild variant="hero" size="lg">
            <Link to="/choose-plan">جرّب الآن</Link>
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
                <Link to="/choose-plan">الخطط</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/create-event">إنشاء مناسبة</Link>
              </DropdownMenuItem>
              <div className="px-2 py-1.5">
                <Button asChild variant="hero" className="w-full">
                  <Link to="/choose-plan">جرّب الآن</Link>
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
