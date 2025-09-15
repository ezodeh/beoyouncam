import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Heart } from "lucide-react";

const Gallery = () => {
  const { token } = useParams();
  const eventId = token ?? "demo-event";

  useEffect(() => {
    document.title = "المعرض — من عيونكم";
  }, []);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  async function fetchPage() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const url = new URL(`/api/events/${eventId}/media`, window.location.origin);
      url.searchParams.set("status", "approved");
      if (cursor) url.searchParams.set("cursor", cursor);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("تعذر التحميل");
      const data = await res.json(); // { items: [...], nextCursor: string|null }
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPage(); }, []);

  async function like(id: string) {
    try {
      await fetch(`/api/media/${id}/like`, { method: "POST" });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, likesCount: (it.likesCount || 0) + 1 } : it)));
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 flex items-center justify-center">
        <div dir="rtl" className="mx-auto w-full max-w-sm sm:max-w-md p-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-2xl">ألبوم المناسبة</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-3 gap-2">
                {items.map((m) => (
                  <div key={m.id} className="relative group overflow-hidden rounded-lg border border-border">
                    {m.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.thumbUrl || m.originalUrl} alt="pic" className="w-full h-28 object-cover" />
                    ) : (
                      <video src={m.processedUrl || m.originalUrl} className="w-full h-28 object-cover" muted playsInline />
                    )}
                    <button onClick={() => like(m.id)} className="absolute bottom-1 right-1 bg-background/70 border border-border/60 rounded-full px-2 py-1 text-xs inline-flex items-center gap-1">
                      <Heart className="h-3 w-3"/> {m.likesCount || 0}
                    </button>
                  </div>
                ))}
              </div>
              {hasMore && (
                <Button onClick={fetchPage} disabled={loading} className="rounded-full">
                  {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> جاري التحميل…</span> : "تحميل المزيد"}
                </Button>
              )}
              {!hasMore && items.length === 0 && <p className="text-center opacity-70">لا يوجد صور</p>}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
