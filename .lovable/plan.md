## الهدف
ربط كل صفحات التطبيق (الجاهزة من ناحية UI/UX) بالـ Backend (Lovable Cloud) مع تدفّق صحيح من البداية للنهاية، وإصلاح أي روابط ناقصة أو غير متّسقة.

## الحالة الحالية (مما تم فحصه)
- معظم الصفحات تستخدم الـ backend فعلاً (Auth, CreateEvent, EventAlbum, FinalSubmit، dashboard tabs).
- قاعدة البيانات + RLS + RPC functions جاهزة وآمنة (تم تأكيدها في المراجعة الأمنية).
- النواقص أساسها: **توحيد تدفق الجلسة**، **حماية المسارات**، **ربط بعض الصفحات المتبقّية** (Payment, ChoosePlan, Invites, EventWelcome/Soon/Ended, Scanner, BillingHistory, Admin)، و**تنسيق التحويلات (redirects) بين الخطوات**.

---

## التدفقات (Flows) — الترتيب النهائي المستهدف

### 1) تدفّق المصادقة (Auth)
```
/  →  /auth (إذا غير مسجّل)
     ├─ Email + Password (signup/login)  →  إنشاء profile تلقائياً  →  /account
     └─ Google OAuth (مُدار من Cloud)    →  /account
/auth?next=/create-event  →  بعد الدخول يحوّل لـ next
```
**العمل المطلوب:**
- إضافة `AuthProvider` (Context) في `src/hooks/useAuth.tsx` يستمع `onAuthStateChange` ثم `getSession` (بالترتيب الصحيح)، ويوفّر `{ user, session, loading, signOut }`.
- إضافة مكوّن `<RequireAuth />` لحماية المسارات الخاصة.
- إضافة DB trigger `handle_new_user` ينشئ سجل في `profiles` تلقائياً عند التسجيل (بدل الـ upsert اليدوي في Auth.tsx).
- دعم `?next=` redirect param في `/auth`.
- صفحة `/reset-password` (مطلوبة لإعادة تعيين كلمة المرور).

### 2) تدفّق إنشاء الفعالية (Owner)
```
/account → "New event" → /choose-plan → /payment → /create-event → /manage/:token
```
**العمل المطلوب:**
- حماية `/choose-plan`, `/payment`, `/create-event`, `/manage/:token` بـ `<RequireAuth />`.
- ربط `ChoosePlan` (تخزين الخطة المختارة محلياً ثم استخدامها في `/payment`).
- `Payment`: حالياً مجرد UI — اختياري: إمّا تفعيل Stripe لاحقاً، أو وضع "Mark as paid (demo)" يحوّل مباشرة إلى `/create-event`.
- بعد نجاح إنشاء الفعالية في `CreateEvent` → التحويل إلى `/manage/:token` (بدل أي صفحة وسيطة).
- `/account` يعرض فعالياتي عبر query على `events` بـ `owner_id = user.id` (موجود جزئياً — التأكد من React Query + invalidation عند إنشاء/حذف).

### 3) تدفّق الضيف (Guest)
```
/event/:token  →  (يقرر حسب وقت الفعالية + الحالة)
   ├─ لم تبدأ:        /event/:token/soon
   ├─ منتهية:         /event/:token/ended  →  زر للذهاب للألبوم
   ├─ جارية + جديد:   /event/:token/welcome  →  تسجيل اسم/إيميل/هاتف (participants)
   ├─ جارية + معروف:  /event/:token/camera
   ├─ بعد التصوير:    /event/:token/submit  →  /event/:token/submit-success
```
**العمل المطلوب:**
- جعل `/event/:token` صفحة **router** صغيرة تقرأ `get_public_event_info` ثم تحوّل للصفحة الصحيحة.
- في `EventWelcome`: إنشاء سجل في `participants` (أو ربطه إذا المستخدم مسجّل دخول)، حفظ `participant_id` في localStorage بمفتاح `participant:{token}`.
- `EventCamera`: يلتقط الصور/الفيديو محلياً (state أو IndexedDB).
- `EventFinalSubmit`: يرفع كل الملفات لـ bucket `event-media` تحت `{token}/{participant_id}/...` ثم `insert` في `media_submissions`، ثم يحوّل إلى `submit-success`.
- `EventEnded` و `EventSoon`: عرض معلومات + CTA للألبوم/الإشعار.

### 4) تدفّق الألبوم (Public/Private)
```
/album/:token/intro
   ├─ public + published:   /album/:token
   ├─ private + password:   /album/:token/private  →  RPC grant_album_access  →  /album/:token
   └─ private بدون كلمة:    يحتاج تسجيل دخول + participant
/album/:token/by/:name  →  صور مشارك معيّن
```
**العمل المطلوب:**
- `EventAlbumIntro`: يقرأ `get_public_event_info`، يقرر أي حالة، ويعرض CTA مناسب.
- `EventAlbumPrivate`: نموذج كلمة مرور → `grant_album_access` → حفظ `albumAccess:{token}` في sessionStorage مع `expires_at`.
- `EventAlbum`: يفحص الوصول (مالك / participant / public / sessionAccess) ثم يحمّل الوسائط من Storage + يستعمل `get_public_participant_data` للأسماء.
- `EventAlbumByEyes`: استخدام `get_participant_by_name` لجلب الـ id ثم فلترة `media_submissions` بـ `participant_id`.
- البلاسنغز (Blessings): قراءة/إضافة عبر RLS الموجود.

### 5) لوحة إدارة المالك `/manage/:token`
**العمل المطلوب:**
- تأكيد أن كل التابات تستخدم `user_owns_event` للحماية وتستعمل `get_owner_participant_data` للمشاركين.
- تابات: Overview, EventDetails, Customization, Privacy, Participants, Album, Statistics, Invites — التأكد أن كل update يستعمل `events` update مع RLS، وأن invalidation يحدّث الواجهة.
- `Invites` (`/event/:token/invites`): توليد روابط دعوة + مشاركة (QR / واتساب / إيميل / SMS) — كله client-side، لا يحتاج backend.
- `Scanner`: ماسح QR يفتح `/event/:token` — كله client-side.
- Realtime: تفعيل live updates لـ `media_submissions` و `blessings` و `participants` في لوحة الإدارة وفي الألبوم العام.

### 6) Account / Settings / Billing / Admin
- `/account`: عرض الفعاليات الخاصة بي + إنشاء جديد.
- `/settings`: تحديث `profiles` (display_name, phone, country, ...).
- `/billing`: حالياً UI فقط — تركها كقائمة فارغة حتى تُفعَّل المدفوعات لاحقاً.
- `/admin`: محمي بـ `has_role(uid, 'admin')` — التحقق client-side **و** عبر RLS.

---

## التغييرات التقنية بالتفصيل

### A. ملفات جديدة
- `src/hooks/useAuth.tsx` — AuthContext + Provider + hook.
- `src/components/auth/RequireAuth.tsx` — wrapper guard للمسارات الخاصة.
- `src/pages/ResetPassword.tsx` — صفحة `/reset-password`.
- `src/lib/queries/events.ts` — React Query hooks (useMyEvents, useEvent, useUpdateEvent, ...).
- `src/lib/queries/participants.ts` — `useJoinEvent`, `useOwnerParticipants`, ...
- `src/lib/queries/media.ts` — رفع وقراءة الوسائط + Storage helpers.
- `src/lib/queries/blessings.ts`.
- `src/lib/eventRouter.ts` — منطق "أين أرسل الضيف؟" حسب الوقت/الحالة.

### B. تعديلات على App.tsx
- لفّ `<Routes>` بـ `<AuthProvider>`.
- لفّ المسارات الخاصة بـ `<RequireAuth>`: `/account`, `/settings`, `/create-event`, `/choose-plan`, `/payment`, `/manage/:token`, `/billing`, `/admin`, `/event/:token/invites`.
- إضافة `<Route path="/reset-password" />`.

### C. قاعدة البيانات (migration واحدة)
```sql
-- 1) Trigger ينشئ profile تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) تفعيل realtime على الجداول الحيّة
ALTER PUBLICATION supabase_realtime ADD TABLE public.media_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blessings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER TABLE public.media_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.blessings REPLICA IDENTITY FULL;
ALTER TABLE public.participants REPLICA IDENTITY FULL;
```

### D. إعداد المصادقة
- تفعيل Google OAuth عبر `configure_social_auth(['google'])` (مُدار من Cloud — لا يحتاج credentials).
- إبقاء Email/Password مفعّل بدون auto-confirm (المستخدم يأكد الإيميل).
- تفعيل HIBP password protection (`password_hibp_enabled: true`).

### E. ضبط الـ redirects الحالية
- في `Auth.tsx` + أي مكان يستعمل OAuth: استخدام `redirectTo: ${window.location.origin}/auth/callback` أو إبقاء `/account` كما هو، **مع التأكد** من قراءة `?next=` بعد الرجوع.
- إزالة الـ upsert اليدوي لـ profiles من Auth.tsx (الـ trigger أصبح يتكفّل).

---

## ترتيب التنفيذ
1. Migration (trigger + realtime) + إعداد OAuth + HIBP.
2. AuthProvider + RequireAuth + ResetPassword + حماية المسارات في App.tsx.
3. طبقة React Query (events/participants/media/blessings) واستخدامها بدل الـ fetch المباشر في الصفحات.
4. ربط تدفق الضيف: EventCapture (router) → Welcome → Camera → FinalSubmit → SubmitSuccess.
5. ربط تدفق الألبوم: Intro → Private → Album → ByEyes + blessings + realtime.
6. مراجعة لوحة الإدارة (manage tabs) + Invites + Scanner.
7. مراجعة Account/Settings/Admin + التحقق من has_role للأدمن.
8. اختبار end-to-end لكل تدفق + إصلاح أي خلل.

## خارج النطاق (تتم لاحقاً عند الطلب)
- تفعيل Stripe/Paddle للدفع الحقيقي.
- إرسال إيميلات الدعوة فعلياً عبر transactional email.
- تخصيص قوالب إيميلات المصادقة.
