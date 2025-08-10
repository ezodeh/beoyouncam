import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t">
      {/* Desktop / Tablet */}
      <div className="container mx-auto py-10 grid gap-8 md:grid-cols-3 text-sm hidden md:grid">
        <div className="space-y-3">
          <h2 className="text-base font-semibold">من نحن</h2>
          <p className="text-muted-foreground leading-relaxed">
            منصة تجمع صور وفيديو الضيوف في ألبوم واحد أنيق — بسهولة وأمان.
          </p>
        </div>
        <div className="space-y-3">
          <h3 className="text-base font-semibold">روابط</h3>
          <nav className="flex flex-col gap-2">
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">شروط الاستخدام</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">سياسة الخصوصية</Link>
          </nav>
        </div>
        <div className="space-y-3">
          <h3 className="text-base font-semibold">تابعنا</h3>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-foreground transition-colors"><Facebook className="h-5 w-5" /></a>
            <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="h-5 w-5" /></a>
          </div>
        </div>
      </div>

      {/* Mobile minimal */}
      <div className="md:hidden px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} عيون cam — كل الحقوق محفوظة
      </div>
      <div className="brand-strip w-full" aria-hidden />
    </footer>
  );
};

export default Footer;
