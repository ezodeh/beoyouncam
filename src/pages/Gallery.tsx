import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

const Gallery = () => {
  const { token } = useParams();

  useEffect(() => {
    document.title = "المعرض — من عيونكم";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold">المعرض العام</h1>
          <p className="text-muted-foreground">رمز المناسبة: {token}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg border bg-muted" />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
