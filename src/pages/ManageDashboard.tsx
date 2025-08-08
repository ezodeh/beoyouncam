import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

const ManageDashboard = () => {
  const { token } = useParams();

  useEffect(() => {
    document.title = "إدارة المناسبة — من عيونكم";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-12 grid gap-6">
        <div>
          <h1 className="text-3xl font-extrabold">لوحة التحكم</h1>
          <p className="text-muted-foreground">رمز الإدارة: {token}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>إجمالي الوسائط</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">—</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>ضيوف فعّالون</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">—</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>إعجابات</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">—</CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ManageDashboard;
