import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Globe, Save, LogOut, Trash2, Shield, Calendar, Edit3, Download } from "lucide-react";

interface Event {
  token: string;
  title: string;
  description?: string;
  expected_guests: number;
  max_shots: number;
  created_at: string;
  end_at?: string;
}

export default function Settings() {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("+962");
  const [country, setCountry] = useState<string>("Jordan");
  const [gender, setGender] = useState<string>("");
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "الإعدادات — من عيونكم";
    loadUserData();
    loadUserEvents();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        const meta = user.user_metadata || {};
        setName(meta.full_name || meta.name || "");
        
        // Load profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile) {
          setPhone(profile.phone || "");
          setCountryCode(profile.country_code || "+962");
          setCountry(profile.country || "Jordan");
          setGender(profile.gender || "");
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("المستخدم غير مسجل الدخول");

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: name,
          name: name
        }
      });
      if (authError) throw authError;

      // Upsert profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: name,
          phone: phone,
          country_code: countryCode,
          country: country,
          gender: gender || null,
          updated_at: new Date().toISOString()
        });
      if (profileError) throw profileError;

      toast({ title: "تم حفظ الإعدادات بنجاح" });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ 
        title: "خطأ في الحفظ", 
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const loadUserEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: eventsData } = await supabase
        .from("events")
        .select("token, title, description, expected_guests, max_shots, created_at, end_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (eventsData) {
        setEvents(eventsData as Event[]);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const updateEvent = async (eventToken: string, updates: { title?: string; description?: string }) => {
    try {
      const { error } = await supabase
        .from("events")
        .update(updates)
        .eq("token", eventToken);

      if (error) throw error;

      setEvents(prev => prev.map(event => 
        event.token === eventToken ? { ...event, ...updates } : event
      ));
      
      toast({ title: "تم تحديث المناسبة بنجاح" });
      setEditingEvent(null);
    } catch (error) {
      console.error("Error updating event:", error);
      toast({ 
        title: "خطأ في التحديث", 
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  const downloadEventAlbum = async (eventToken: string, eventTitle: string) => {
    setDownloading(eventToken);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", variant: "destructive" });
        return;
      }

      const response = await supabase.functions.invoke('download-album', {
        body: JSON.stringify({ token: eventToken }),
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Create download link
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventTitle}_${eventToken}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "تم تنزيل الألبوم بنجاح" });
    } catch (error) {
      console.error('Download error:', error);
      toast({ 
        title: "خطأ في التنزيل", 
        description: "تعذّر تنزيل الألبوم. يرجى المحاولة مرة أخرى",
        variant: "destructive" 
      });
    } finally {
      setDownloading(null);
    }
  };

  const countries = [
    { code: "+962", name: "Jordan", nameAr: "الأردن" },
    { code: "+966", name: "Saudi Arabia", nameAr: "السعودية" },
    { code: "+971", name: "UAE", nameAr: "الإمارات" },
    { code: "+965", name: "Kuwait", nameAr: "الكويت" },
    { code: "+974", name: "Qatar", nameAr: "قطر" },
    { code: "+973", name: "Bahrain", nameAr: "البحرين" },
    { code: "+968", name: "Oman", nameAr: "عُمان" },
    { code: "+961", name: "Lebanon", nameAr: "لبنان" },
    { code: "+963", name: "Syria", nameAr: "سوريا" },
    { code: "+964", name: "Iraq", nameAr: "العراق" },
    { code: "+970", name: "Palestine", nameAr: "فلسطين" },
    { code: "+20", name: "Egypt", nameAr: "مصر" },
    { code: "+216", name: "Tunisia", nameAr: "تونس" },
    { code: "+213", name: "Algeria", nameAr: "الجزائر" },
    { code: "+212", name: "Morocco", nameAr: "المغرب" },
    { code: "+218", name: "Libya", nameAr: "ليبيا" },
    { code: "+249", name: "Sudan", nameAr: "السودان" },
    { code: "+967", name: "Yemen", nameAr: "اليمن" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto grid gap-6">
          <header className="text-right">
            <h1 className="text-3xl font-extrabold mb-2">إعدادات الحساب</h1>
            <p className="text-sm text-muted-foreground">إدارة معلوماتك الشخصية وتفضيلات الحساب</p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                المعلومات الشخصية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </Label>
                <Input 
                  id="email" 
                  value={email} 
                  readOnly 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input 
                  id="name"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="اسمك الكامل" 
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    البلد
                  </Label>
                  <Select value={countryCode} onValueChange={(value) => {
                    setCountryCode(value);
                    const country = countries.find(c => c.code === value);
                    setCountry(country?.nameAr || "");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر البلد" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.nameAr} ({country.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    رقم الهاتف
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={countryCode} 
                      readOnly 
                      className="w-20 bg-muted text-center"
                    />
                    <Input 
                      id="phone"
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="رقم الهاتف"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="gender">الجنس *</Label>
                <Select value={gender} onValueChange={setGender} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                    <SelectItem value="other">آخر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إعدادات الخصوصية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>الإشعارات</Label>
                  <p className="text-sm text-muted-foreground">استقبال إشعارات حول المناسبات</p>
                </div>
                <Switch 
                  checked={notifications} 
                  onCheckedChange={setNotifications}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={saveSettings} disabled={saving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              تسجيل الخروج
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إعدادات الأمان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  onClick={() => alert("تغيير كلمة المرور: سيتم إضافتها قريبًا")}
                  className="w-full"
                >
                  تغيير كلمة المرور
                </Button>
                <a 
                  href="mailto:support@manyoyonkom.app" 
                  className="text-center py-2 px-4 border rounded-lg hover:bg-muted/50 transition-colors block"
                >
                  تواصل معنا
                </a>
                <Button
                  variant="outline"
                  onClick={() => alert("سجل الفوترة: سيتم إظهاره قريبًا")}
                  className="w-full"
                >
                  سجل الفوترة
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("هل أنت متأكد من حذف الحساب؟\n\nسيتم حذف جميع بياناتك ومناسباتك نهائياً.")) {
                      supabase.auth.signOut();
                      alert("تم إرسال طلب حذف الحساب");
                      window.location.href = "/";
                    }
                  }}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  حذف الحساب نهائياً
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                مناسباتي السابقة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد مناسبات بعد</p>
              ) : (
                events.map((event) => {
                  const isEventEnded = event.end_at ? new Date(event.end_at) < new Date() : false;
                  const canEdit = !isEventEnded;
                  
                  return (
                  <div key={event.token} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        {isEventEnded && (
                          <p className="text-xs text-muted-foreground">انتهت المناسبة - يمكن تعديل الاسم والوصف فقط</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadEventAlbum(event.token, event.title)}
                          disabled={downloading === event.token}
                          title="تنزيل الألبوم الكامل"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingEvent(editingEvent === event.token ? null : event.token)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {editingEvent === event.token ? (
                      <div className="space-y-3">
                        <div className="grid gap-2">
                          <Label>عنوان المناسبة</Label>
                          <Input
                            value={event.title}
                            onChange={(e) => setEvents(prev => 
                              prev.map(ev => ev.token === event.token ? { ...ev, title: e.target.value } : ev)
                            )}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>وصف المناسبة</Label>
                          <Textarea
                            value={event.description || ""}
                            onChange={(e) => setEvents(prev => 
                              prev.map(ev => ev.token === event.token ? { ...ev, description: e.target.value } : ev)
                            )}
                            placeholder="وصف المناسبة"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>عدد الضيوف المتوقع</Label>
                            <Input
                              value={event.expected_guests}
                              readOnly
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">لا يمكن تغيير عدد الضيوف</p>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label>عدد الصور المسموح</Label>
                            <Input
                              value={event.max_shots}
                              readOnly
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">لا يمكن تغيير عدد الصور</p>
                          </div>
                        </div>

                        {!canEdit && (
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label>عدد الضيوف المتوقع</Label>
                              <Input
                                value={event.expected_guests}
                                readOnly
                                className="bg-muted"
                              />
                              <p className="text-xs text-muted-foreground">لا يمكن تغيير عدد الضيوف</p>
                            </div>
                            
                            <div className="grid gap-2">
                              <Label>عدد الصور المسموح</Label>
                              <Input
                                value={event.max_shots}
                                readOnly
                                className="bg-muted"
                              />
                              <p className="text-xs text-muted-foreground">لا يمكن تغيير عدد الصور</p>
                            </div>
                          </div>
                        )}

                        <div className="grid gap-2">
                          <Label>رمز المناسبة</Label>
                          <Input
                            value={event.token}
                            readOnly
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">لا يمكن تغيير رمز المناسبة</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => updateEvent(event.token, {
                              title: event.title,
                              description: event.description
                            })}
                            size="sm"
                          >
                            حفظ التغييرات
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingEvent(null)}
                            size="sm"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>الرمز:</strong> {event.token}</p>
                        <p><strong>عدد الضيوف:</strong> {event.expected_guests}</p>
                        <p><strong>عدد الصور:</strong> {event.max_shots}</p>
                        {event.description && <p><strong>الوصف:</strong> {event.description}</p>}
                        <p><strong>تاريخ الإنشاء:</strong> {new Date(event.created_at).toLocaleDateString('en-GB')}</p>
                      </div>
                    )}
                  </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
