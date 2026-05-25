## خطة الإصلاحات الأربعة

### 1) منع تخزين كلمات السر كنص واضح للمناسبات الخاصة

**المشكلة**: عند إنشاء مناسبة خاصة في `CreateEvent.tsx` يتم تخزين كلمة السر في عمود `password` كنص واضح، و دالة `validate_event_password` تقارن بـ `password = provided_password` (نص واضح).

**الحل**:
- إنشاء migration:
  - دالة `hash_event_password(text)` تستخدم `crypt(pw, gen_salt('bf'))` (pgcrypto).
  - تعديل `validate_event_password(event_token, provided_password)` لتقارن بـ `password_hash = crypt(provided_password, password_hash)` بدل النص الواضح، وتكون نتيجتها صحيحة حتى لو كان `password` فارغًا.
  - Trigger `BEFORE INSERT OR UPDATE ON events`: إذا كان `password` غير فارغ، يحوّله إلى `password_hash` ويصفّر `password` تلقائيًا — هذا يحمي حتى لو نسي أي كود في الواجهة.
  - Backfill: تحويل أي صفوف حالية فيها `password` نصي إلى `password_hash` ومسح `password`.
- في `CreateEvent.tsx`: بدل إرسال `password: password.trim()` نرسل `password: null` و نستدعي RPC جديدة `set_event_password(token, plain)` (أو نعتمد على الـ trigger مباشرة بإرسال النص لمرة واحدة ثم يقوم الـ trigger بالتشفير). الأسهل: الإبقاء على إرسال النص للـ INSERT ثم الـ trigger يحوّله — لا يبقى نص واضح في DB.
- في `PrivacyTab.tsx`: إزالة منطق التشفير اليدوي (يصبح غير صحيح ومكرر) واعتماد الـ trigger.

### 2) صفحة البداية للمسجّل دخوله = الـ Dashboard

**التعديل في `src/pages/Index.tsx`**:
- استخدام `useAuth()` بدلاً من قراءة الجلسة يدويًا.
- إذا `user` موجود → `Navigate` إلى `/account` (Dashboard الحالي للمستخدم).
- الزائر غير المسجّل يبقى يرى الـ Landing.

### 3) إظهار شرح الترحيب (WelcomeTour) مرة واحدة للمستخدم الجديد فقط

**المشكلة**: المنطق الحالي يعتمد فقط على `localStorage.seenOnboarding`، فإذا تغيّر الجهاز/المتصفح يظهر من جديد.

**الحل**:
- إضافة عمود `onboarded_at timestamptz` في جدول `profiles` عبر migration.
- في `Index.tsx` (أو الـ Dashboard بعد التحويل): إظهار `WelcomeTour` فقط إذا `profiles.onboarded_at IS NULL` ولا توجد مناسبات.
- عند إغلاق/إكمال الجولة: تحديث `profiles.onboarded_at = now()` + ضبط `localStorage` كنسخة احتياطية.
- نتيجة: تظهر مرة واحدة فقط لكل حساب على كل الأجهزة.

### 4) ظهور اللقطات الأخيرة كصور مكسورة عند العودة للكاميرا

**السبب الجذري**: `MobileCamera.tsx` يخزّن `recent` في `localStorage` مع `url` كـ `blob:` URL ينتهي عند إغلاق التبويب → صور مكسورة عند العودة.

**الحل في `MobileCamera.tsx`**:
- لا نخزّن `blob:` URLs، بل نخزّن فقط `{ filePath, type }` بعد نجاح الرفع.
- عند التحميل (mount):
  1. قراءة الـ `recent` من `localStorage` (مسارات فقط).
  2. لكل مسار: استدعاء `supabase.storage.from("event-media").createSignedUrl(filePath, 3600)` للحصول على رابط صالح.
  3. عرض الصور بهذه الروابط.
- يمكن مرحليًا الإبقاء على blob URL مؤقت أثناء الجلسة قبل اكتمال الرفع، لكن لا نحفظه في localStorage.
- مزامنة احتياطية: عند فتح الكاميرا نجلب أيضًا قائمة `media_submissions` الخاصة بـ `participant_id` الحالي ونعرضها (مصدر الحقيقة من السيرفر).

---

### تفاصيل تقنية مختصرة

ملفات ستُعدّل:
- migration جديد: trigger التشفير + تعديل `validate_event_password` + عمود `profiles.onboarded_at` + backfill.
- `src/pages/CreateEvent.tsx` (إزالة إرسال كلمة سر نصية صريحة في الحفظ النهائي — أو الاعتماد على الـ trigger).
- `src/components/dashboard/tabs/PrivacyTab.tsx` (تبسيط الحفظ).
- `src/pages/Index.tsx` (Redirect للمسجّل + شرط onboarded_at).
- `src/components/onboarding/WelcomeTour.tsx` (استدعاء تحديث `profiles.onboarded_at` عند الإغلاق).
- `src/components/capture/MobileCamera.tsx` (حفظ مسارات الملفات فقط + Signed URLs + مزامنة من DB).

لن يتم تغيير: تدفّقات الـ Auth، صلاحيات RLS الأخرى، تصميم الكاميرا الحالي.
