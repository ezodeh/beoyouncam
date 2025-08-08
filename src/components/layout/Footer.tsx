const Footer = () => {
  return (
    <footer className="border-t">
      <div className="container mx-auto py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} من عيونكم — كل الحقوق محفوظة
      </div>
      <div className="brand-strip w-full" aria-hidden />
    </footer>
  );
};

export default Footer;
