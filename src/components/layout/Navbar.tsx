import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
// logo served from /lovable-uploads during editing
const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
          <img src="/lovable-uploads/0200d767-58b7-4ed9-8589-ae65fa2df295.png" alt="شعار من عيونكم" className="h-7 w-auto" loading="lazy" />
          <span className="sr-only">من عيونكم</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/choose-plan" className="text-sm text-muted-foreground hover:text-foreground">
            الخطط
          </Link>
          <Link to="/create-event" className="text-sm text-muted-foreground hover:text-foreground">
            إنشاء مناسبة
          </Link>
          <Button asChild variant="hero" size="lg">
            <Link to="/choose-plan">جرّب الآن</Link>
          </Button>
        </div>
      </nav>
      <div className="h-0.5 bg-brand-gradient" aria-hidden />
    </header>
  );
};

export default Navbar;
