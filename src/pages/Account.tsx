import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import EventCard from "@/components/account/EventCard";
interface EventItem { token: string; title: string; cover_url: string | null; start_at: string | null; end_at: string | null; }

export default function Account() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ownEvents, setOwnEvents] = useState<EventItem[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    document.title = "حسابي — من عيونكم";
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      if (!uid) return;

      // Apply pending profile (from signup) once after first login/confirmation
      try {
        const pendingStr = localStorage.getItem("pendingProfile");
        if (pendingStr) {
          const pending = JSON.parse(pendingStr);
          await supabase.from("profiles").upsert({ id: uid, ...pending });
          localStorage.removeItem("pendingProfile");
        }
      } catch {}

      // Events I own
      const { data: myEvents } = await supabase
        .from("events")
        .select("token, title, cover_url, start_at, end_at")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false });

      setOwnEvents(myEvents as any || []);

      // Events I joined
      const { data: parts } = await supabase
        .from("participants")
        .select("event_token")
        .eq("user_id", uid);

      const tokens = Array.from(new Set((parts || []).map((p: any) => p.event_token)));
      if (tokens.length) {
        const { data: evs } = await supabase
          .from("events")
          .select("token, title, cover_url, start_at, end_at")
          .in("token", tokens);
        setJoinedEvents((evs as any) || []);
      } else {
        setJoinedEvents([]);
      }
    })();
  }, []);

  const refreshEvents = async () => {
    if (!userId) return;
    
    // Refresh owned events
    const { data: myEvents } = await supabase
      .from("events")
      .select("token, title, cover_url, start_at, end_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    setOwnEvents(myEvents as any || []);

    // Refresh joined events
    const { data: parts } = await supabase
      .from("participants")
      .select("event_token")
      .eq("user_id", userId);

    const tokens = Array.from(new Set((parts || []).map((p: any) => p.event_token)));
    if (tokens.length) {
      const { data: evs } = await supabase
        .from("events")
        .select("token, title, cover_url, start_at, end_at")
        .in("token", tokens);
      setJoinedEvents((evs as any) || []);
    } else {
      setJoinedEvents([]);
    }
  };

  const now = new Date();
  const [ownedCurrent, ownedPast] = useMemo(() => {
    const current: EventItem[] = [];
    const past: EventItem[] = [];
    for (const e of ownEvents) {
      const end = e.end_at ? new Date(e.end_at) : null;
      if (end && end < now) past.push(e); else current.push(e);
    }
    return [current, past];
  }, [ownEvents]);

  const [joinedCurrent, joinedPast] = useMemo(() => {
    const current: EventItem[] = [];
    const past: EventItem[] = [];
    for (const e of joinedEvents) {
      const end = e.end_at ? new Date(e.end_at) : null;
      if (end && end < now) past.push(e); else current.push(e);
    }
    return [current, past];
  }, [joinedEvents]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 grid gap-10">
        {!userId ? (
          <section className="text-center max-w-md mx-auto">
            <h1 className="text-3xl font-extrabold mb-2">حسابي</h1>
            <p className="text-muted-foreground mb-4">سجّل الدخول لعرض مناسباتك.</p>
            <a href="#login" onClick={(e)=>{e.preventDefault(); supabase.auth.signInWithOAuth({provider:"google", options:{ redirectTo: window.location.origin }});}} className="inline-flex rounded-full bg-primary text-primary-foreground px-6 py-2 hover-scale">تسجيل الدخول</a>
          </section>
        ) : (
          <>
            {/* Empty State - when user has no events at all */}
            {ownEvents.length === 0 && joinedEvents.length === 0 ? (
              <section className="text-center max-w-2xl mx-auto py-12">
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                  </div>
                  <h1 className="text-3xl font-extrabold mb-4">مرحباً بك في من عيونكم!</h1>
                  <p className="text-lg text-muted-foreground mb-8">
                    ابدأ رحلتك في توثيق اللحظات الجميلة وجمع الذكريات من أعين الأحباب
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                      </svg>
                    </div>
                    <h3 className="font-bold text-xl mb-2">أنشئ مناسبة جديدة</h3>
                    <p className="text-muted-foreground mb-4">
                      ابدأ بإنشاء مناسبتك الأولى واجمع صور جميلة من ضيوفك
                    </p>
                    <Link
                      to="/create-event"
                      className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-2 hover:bg-primary/90 transition-colors"
                    >
                      إنشاء مناسبة
                    </Link>
                  </div>

                  <div className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                    <h3 className="font-bold text-xl mb-2">انضم لمناسبة</h3>
                    <p className="text-muted-foreground mb-4">
                      لديك رمز QR أو رابط مناسبة؟ امسحه للانضمام والمشاركة
                    </p>
                    <Link
                      to="/scanner"
                      className="inline-flex items-center justify-center rounded-full bg-secondary text-secondary-foreground px-6 py-2 hover:bg-secondary/90 transition-colors"
                    >
                      مسح الرمز
                    </Link>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>💡 نصيحة: يمكنك إنشاء مناسبات لأفراحك، أعياد ميلادك، رحلاتك وأي مناسبة تريد توثيقها!</p>
                </div>
              </section>
            ) : (
              <>
                {/* Existing sections when user has events */}
                <section>
                  <h2 className="text-2xl font-bold mb-3 text-right">مناسباتي الحالية</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-center">
                    {ownedCurrent.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <div className="text-muted-foreground mb-4">لا توجد مناسبات حالية</div>
                        <Link
                          to="/create-event"
                          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                          </svg>
                          إنشاء مناسبة جديدة
                        </Link>
                      </div>
                    ) : (
                      ownedCurrent.map((e) => (
                        <EventCard
                          key={e.token}
                          event={e as any}
                          linkTo={`/manage/${e.token}`}
                          subtitle="إدارة المناسبة"
                          isOwner
                          onEventDeleted={refreshEvents}
                        />
                      ))
                    )}
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-3">مناسباتي السابقة</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-center">
                    {ownedPast.length === 0 ? (
                      <div className="text-sm text-muted-foreground">لا يوجد</div>
                    ) : (
                      ownedPast.map((e) => (
                        <EventCard
                          key={e.token}
                          event={e as any}
                          linkTo={`/album/${e.token}/intro`}
                          subtitle="اذهب إلى المقدمة"
                          isOwner
                          isPast
                          onEventDeleted={refreshEvents}
                        />
                      ))
                    )}
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-3">مشاركاتي</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-center">
                    {joinedCurrent.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <div className="text-muted-foreground mb-4">لم تنضم لأي مناسبة بعد</div>
                        <Link
                          to="/scanner"
                          className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-4 py-2 hover:bg-secondary/90 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                          </svg>
                          انضم لمناسبة
                        </Link>
                      </div>
                    ) : (
                      joinedCurrent.map((e) => (
                        <EventCard
                          key={e.token}
                          event={e as any}
                          linkTo={`/album/${e.token}/intro`}
                          subtitle="اذهب إلى المقدمة"
                        />
                      ))
                    )}
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-3">سجل المشاركات</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-center">
                    {joinedPast.length === 0 ? (
                      <div className="text-sm text-muted-foreground">لا يوجد</div>
                    ) : (
                      joinedPast.map((e) => (
                        <EventCard
                          key={e.token}
                          event={e as any}
                          linkTo={`/album/${e.token}/intro`}
                          subtitle="اذهب إلى المقدمة"
                          isPast
                        />
                      ))
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
