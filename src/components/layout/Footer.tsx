import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="container mx-auto py-10 grid gap-6 md:grid-cols-3 text-sm">
        <div className="space-y-2">
          <h2 className="text-base font-normal">من نحن</h2>
          <p className="text-muted-foreground">
            منصة تجمع صور وفيديو الضيوف في ألبوم واحد أنيق — بسهولة وأمان.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold">روابط</h3>
          <nav className="flex flex-col gap-1">
            <Link to="/terms" className="text-muted-foreground hover:text-foreground">شروط الاستخدام</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">سياسة الخصوصية</Link>
          </nav>
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold">تابعنا</h3>
          <div className="flex items-center gap-3">
            <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-foreground"><Facebook className="h-5 w-5" /></a>
            <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-foreground"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground"><Twitter className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
      <div className="container mx-auto pb-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} من عيونكم — كل الحقوق محفوظة
      </div>
      <div className="brand-strip w-full" aria-hidden />
    </footer>
  );
};

export default Footer;
