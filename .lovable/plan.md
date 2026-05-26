## ملخص المشاكل والحلول

سبع نقاط، معظمها واجهة + مشكلتان في الـ backend (رفع الصورة + خطأ RLS عند التسجيل).

---

### 1) إدخال الدقائق يدوياً عند اختيار وقت المناسبة
**الملف:** `src/pages/CreateEvent.tsx` (مكوّن اختيار الوقت)
- استبدال قائمة الدقائق الجاهزة (كل 5 دقائق) بحقل إدخال رقمي حر `0–59` بجانب الساعة.
- إبقاء التحقق: رقم صحيح بين 0 و 59، تعبئة تلقائية بصفر يساري عند العرض (`05`).

### 2) أيقونة "عين" لإظهار/إخفاء كلمة سر المناسبة
**الملف:** `src/components/dashboard/tabs/PrivacyTab.tsx`
- المنطق موجود فعلياً (`showPassword` + أيقونة `Eye/EyeOff`)، لكن سأتأكد أن الزر يعمل بصرياً وأضيفه أيضاً في **شاشة إنشاء المناسبة** `CreateEvent.tsx` إذا كان حقل كلمة السر موجوداً هناك.

### 3) توحيد الاسم والوصف افتراضياً عبر الشاشات
**القاعدة:** اسم/وصف المناسبة المُدخل أول مرة في `CreateEvent` يصبح:
- اسم الترحيب (`welcome_title`) ← `title`
- نص الترحيب (`welcome_text`) ← `description`
- عنوان الألبوم (`album_title`) ← `title`
- وصف الألبوم (`album_description`) ← `description`
ما لم يعدّلها المستخدم يدوياً.

**التنفيذ (بدون migration):**
- في `src/lib/eventSettings.ts` داخل `getPublicEventInfo` و `getEventSettings`: استخدام fallback ← `welcome_title ?? title`, `welcome_text ?? description`, `album_title ?? title`, `album_description ?? description`.
- مراجعة شاشات `EventWelcome.tsx`, `EventAlbumIntro.tsx`, `EventAlbum.tsx` لتستهلك القيمة المرجعة بدل قراءة العمود مباشرة.
- تبويبات لوحة التحكم (Privacy / Album / Customization): إظهار الـ placeholder بقيمة المناسبة الأصلية ليفهم المستخدم أنها هي الافتراضية.

### 4) فشل رفع صورة المناسبة عند الإنشاء
السبب الأرجح: في آخر migration للأمان قيّدنا الكتابة على bucket `event-customization` بـ "owner فقط حسب أول مجلد = token". لكن عند **إنشاء** مناسبة جديدة الـ token لسه ما اتسجل كصاحب، أو المسار المستخدم بالكود لا يبدأ بـ `<token>/`.

**الخطة:**
- قراءة `CreateEvent.tsx` و `CustomizationTab.tsx` لمعرفة مسار الرفع الفعلي على `event-customization`.
- ثم migration واحدة تُصلح سياسة الـ INSERT/UPDATE/DELETE على bucket `event-customization` لتتطابق مع المسار الحقيقي (إما `covers/<token>/...` أو `<token>/...`)، مع السماح للمالك المسجَّل دخوله.

### 5) شعار "بعيون كام" كصورة افتراضية للمناسبة
- في كل مكان يُعرض فيه `cover_url`/`album_cover_url`: إضافة fallback ← `src/assets/logo.png` (أو الـ Logo component الحالي) عند `null`.
- الملفات المرشّحة: `EventWelcome.tsx`, `EventAlbumIntro.tsx`, `EventCamera`, `AccountEventCard.tsx`, تبويب Overview.

### 6) خطأ RLS عند تسجيل الدخول في مناسبة خاصة بكود
الخطأ: `new row violates row-level security policy for table "participants"`.

**السبب:** سياسة INSERT الحالية على `participants`:
```
EXISTS (SELECT 1 FROM events WHERE token = event_token AND is_hidden = false)
```
لا تشترط `user_id = auth.uid()`، لكنها تفشل إذا الحدث محجوب. الأرجح أن المشكلة تكمن في: المستخدم سجل دخوله ثم الكود يحاول إدراج صف بـ `user_id = null` بينما auth موجود → ولا تشترط السياسة وجود تطابق، فالسبب الفعلي قد يكون:
- المناسبة `is_hidden = true` (لم تُنشر بعد)، أو
- يوجد trigger خفي / تكرار unique يفشل بنفس الرسالة.

**الخطة:**
- migration تضيف سياسة INSERT أوضح:
  - إذا `auth.uid() IS NOT NULL` يجب `user_id = auth.uid()`،
  - السماح بالانضمام حتى لو `is_hidden = true` طالما الرابط معروف (لأن صاحب المناسبة قد يختبرها قبل النشر) — لكن **فقط** للمستخدمين المسجَّلين.
- إضافة معالجة خطأ واضحة في الواجهة (`EventWelcome.tsx`) برسالة عربية مفهومة بدل النص الخام.

### 7) زر "تخطي" في لوحة الإنشاء يكون نصاً بدون مربع
- البحث عن زر "تخطي" في `CreateEvent.tsx` / لوحة الخطوات، وتحويل `variant` إلى `ghost` أو `link` وإزالة الـ border/background.

---

## ترتيب التنفيذ
1. قراءة الملفات: `CreateEvent.tsx`, `CustomizationTab.tsx`, `EventWelcome.tsx`, `EventAlbum.tsx`, `EventAlbumIntro.tsx` لمعرفة المسارات والمسميات الفعلية.
2. Migration واحدة تجمع: إصلاح سياسة `event-customization` (نقطة 4) + سياسة `participants` INSERT (نقطة 6).
3. تعديلات الواجهة للنقاط 1, 2, 3, 5, 7 في نفس الجولة.
4. اختبار سريع بعد كل تعديل.

## سؤال واحد قبل أن أبدأ
هل تريدني أُطبّق كل النقاط السبع دفعة واحدة الآن، أم نبدأ بالاثنتين الحرجتين فقط (رفع الصورة + خطأ التسجيل) ونكمل الباقي بعدها؟