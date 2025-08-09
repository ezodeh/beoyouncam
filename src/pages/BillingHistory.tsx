import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Download, Eye } from "lucide-react";
import { useEffect } from "react";

const BillingHistory = () => {
  useEffect(() => {
    document.title = "سجل الفواتير — من عيونكم";
  }, []);

  // بيانات تجريبية للفواتير
  const invoices = [
    {
      id: "INV-001",
      date: "2024-01-15",
      amount: 120,
      status: "paid",
      plan: "خطة البرونز",
      events: 5,
      description: "اشتراك شهري - يناير 2024"
    },
    {
      id: "INV-002", 
      date: "2024-02-15",
      amount: 120,
      status: "paid",
      plan: "خطة البرونز",
      events: 3,
      description: "اشتراك شهري - فبراير 2024"
    },
    {
      id: "INV-003",
      date: "2024-03-15", 
      amount: 250,
      status: "pending",
      plan: "خطة الذهبية",
      events: 10,
      description: "اشتراك شهري - مارس 2024"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "paid":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">مدفوعة</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">معلقة</Badge>;
      case "failed":
        return <Badge variant="destructive">فشلت</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-2">
            <Receipt className="h-8 w-8" />
            سجل الفواتير
          </h1>
          <p className="text-muted-foreground">
            عرض وإدارة جميع فواتيرك السابقة
          </p>
        </div>

        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">فاتورة #{invoice.id}</CardTitle>
                  {getStatusBadge(invoice.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">التاريخ</div>
                    <div className="font-medium">{new Date(invoice.date).toLocaleDateString('ar-SA')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">المبلغ</div>
                    <div className="font-medium">{invoice.amount} ريال</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">الخطة</div>
                    <div className="font-medium">{invoice.plan}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">عدد المناسبات</div>
                    <div className="font-medium">{invoice.events} مناسبة</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground">الوصف</div>
                  <div className="text-sm">{invoice.description}</div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 ml-2" />
                    عرض التفاصيل
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 ml-2" />
                    تحميل PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {invoices.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد فواتير</h3>
              <p className="text-muted-foreground">
                لم يتم إنشاء أي فواتير بعد
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BillingHistory;