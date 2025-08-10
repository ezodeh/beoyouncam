import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    code: "basic",
    name: "Basic",
    price: "مجاني",
    features: ["حتى 12 صورة", "بدون فيديو", "شعار المنصة ظاهر"],
    cta: "ابدأ مجانًا",
  },
  {
    code: "premium",
    name: "Premium",
    price: "₪39",
    features: ["≥ 27 صورة", "فيديو 10 ثوانٍ", "ثيم مخصص خفيف", "دعوات واتساب"],
    cta: "اختر Premium",
    highlight: true,
  },
  {
    code: "deluxe",
    name: "Deluxe",
    price: "₪99",
    features: ["صور وفيديو موسّع", "تصميم واجهة مخصص", "كروت QR بالبريد", "كتل NFC مخصصة"],
    cta: "Deluxe",
  },
];

const PricingGrid = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto text-center mb-8">
        <h2 className="text-3xl font-extrabold mb-2">خطط الشركات</h2>
        <p className="text-muted-foreground">باقات مخصّصة للمصالح والشركات</p>
      </div>
      <div className="container mx-auto grid md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card key={p.code} className={p.highlight ? "border-primary shadow" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{p.name}</span>
                <span className="text-primary font-bold">{p.price}</span>
              </CardTitle>
              <CardDescription>خطة {p.name} لمناسباتك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-muted-foreground space-y-2 text-right">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button asChild variant={p.highlight ? "hero" : "secondary"} className="w-full">
                <Link to={p.code === "basic" ? "/create-event" : `/payment?plan=${p.code}`}>{p.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default PricingGrid;
