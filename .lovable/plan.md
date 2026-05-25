
# خطة شاملة: التحقق من الربط + تطوير الكاميرا

سأنفّذها بالتوازي على مرحلتين متداخلتين خلال نفس الجلسة.

---

## الجزء الأول — التحقق الشامل من الربط

### 1) فحص يدوي بالمتصفح لكل المسارات
سأشغّل Browser Automation وأمشي على كل التدفقات الرئيسية وأسجّل أي خلل (UI أو Network أو Console):

| التدفق | المسار | ما سأتأكد منه |
|---|---|---|
| الهوم | `/` | تحميل، CTA، روابط |
| Auth | `/auth` | Email/Password (signup + login) + Forgot Password + Google OAuth + الـ redirect بعد الدخول |
| Reset Password | `/reset-password` | استلام `type=recovery`، تحديث كلمة المرور |
| إنشاء مناسبة | `/choose-plan` → `/payment` → `/create-event` | `RequireAuth`، الحماية، الـ flow بين الصفحات، الحفظ في `events` |
| إدارة | `/manage/:token` | كل التبويبات (Overview, Album, Participants, Statistics, Customization, EventDetails) — استخدام `user_owns_event` + `get_owner_participant_data` + Realtime |
| الحساب | `/account`, `/settings`, `/billing` | يظهر مناسبات المستخدم، يحدّث `profiles` |
| الضيف | `/event/:token` → welcome → camera → submit → submit-success | `get_public_event_info`، تسجيل `participant`، رفع الميديا، إدخال `blessings` |
| التوقيت | `/event/:token/soon` / `ended` | التحويل حسب `start_at` / `end_at` |
| الألبوم | `/album/:token/intro` → `/album/:token` (أو `private`) → `by/:name` | `is_user_event_owner` + `grant_album_access` + RLS |
| QR/دعوات | `/event/:token/invites`, `/scanner` | محمي بالـ Auth، توليد/قراءة الـ QR |
| Admin | `/admin` | `has_role('admin')` |

لكل خلل: سأسجّله ثم أصلحه فوراً (إذا الإصلاح UI/منطق بسيط)، أو أضيفه لقائمة المتابعة (إذا كبير).

### 2) فحص أمني شامل
- تشغيل `security--run_security_scan` + قراءة النتائج
- مراجعة RLS على كل جدول (events, participants, media_submissions, blessings, profiles, user_roles)
- التأكد من عدم تسرّب `owner_id` / `password_hash` للضيوف (الكل صار يستخدم `get_public_event_info` بس راح أتأكد)
- التأكد من حماية مسارات الـ Edge Functions (لا يوجد حالياً)
- فحص storage policies على `event-media` و `event-customization`

### 3) تقرير مكتوب
سأكتب تقرير نهائي بالعربي يحتوي:
- ✅ ما يعمل بشكل كامل
- ⚠️ نواقص بسيطة تم إصلاحها
- ❌ نواقص كبيرة تحتاج قرار/مرحلة لاحقة
- 🔒 ملخّص النتائج الأمنية

---

## الجزء الثاني — إعادة تصميم الكاميرا (iOS / Snapchat-style)

ملف العمل الرئيسي: `src/components/capture/MobileCamera.tsx` (1149 سطر حالياً).

سأعيد هيكلته وأعطيه واجهة احترافية حديثة مع الحفاظ على كل المنطق الشغّال (الرفع، الـ participant lookup، الـ DB inserts).

### A) إعادة التصميم البصري
- **Shutter زر مركزي كبير** بحلقة متدرّجة (gradient ring) مع haptic-style scale animation عند الضغط
- **شريط جانبي (Side Rail)** للأيقونات بأسلوب iOS: تبديل الكاميرا، فلاش، شبكة، تأثيرات، مؤقّت
- **Top bar شفّاف** مع زر إغلاق (X) على اليسار، اسم المناسبة بالمنتصف، عدّاد اللقطات على اليمين — مع blur خفيف
- **Effects Carousel** أفقي قابل للسحب أسفل الفيديو (بدل الأيقونة الحالية)، كل تأثير له معاينة دائرية مصغّرة
- **Recent Thumbnail** بزاوية يسار-سفلى مع badge عدد، عرض animated عند آخر التقاطة (slide-in)
- **Capture Flash Animation** ومضة بيضاء كاملة عند الالتقاط
- **Recording Indicator** نقطة حمراء نابضة + Timer كبير عند تسجيل الفيديو + حلقة تقدّم حول الـ Shutter
- استخدام `framer-motion` للحركات والـ transitions (مثبت أصلاً)

### B) تجربة استخدام محسّنة
- **Tap-to-focus**: تحديد نقطة التركيز بالنقر على الفيديو (focus reticle animation)
- **Pinch-to-zoom**: محسّن مع زر زوم سريع (1x / 2x) أسفل الـ Shutter
- **Zoom slider عمودي** يظهر مؤقتاً عند بدء الـ pinch
- **Swipe between modes**: سحب يمين/يسار للتبديل بين Photo / Video (إذا الفيديو مفعّل)
- **Long-press = video** (محفوظ من الكود الحالي)، tap = صورة
- **Self-timer**: 3s / 10s مع countdown overlay كبير
- **Front camera mirror**: عكس تلقائي للسلفي (مع خيار تعطيل في الإعدادات)
- **Toast بسيط ومضغوط** بدل الـ toasts الحالية المتعدّدة
- **حفظ آخر التأثير المستخدم** في localStorage

### C) إعادة الهيكلة (Refactor)
تقسيم `MobileCamera.tsx` (1149 سطر) إلى مكوّنات أصغر:
```
src/components/capture/
├── MobileCamera.tsx        (orchestrator فقط)
├── CameraStream.tsx        (الفيديو + permissions + zoom + tap-to-focus)
├── CameraTopBar.tsx        (الـ navbar الجديد)
├── CameraSideRail.tsx      (الأزرار الجانبية)
├── CameraShutter.tsx       (الزر المركزي + recording state)
├── CameraEffectsCarousel.tsx (التأثيرات)
├── CameraRecentThumb.tsx   (آخر صورة + معرض)
├── CameraTimer.tsx         (self-timer + countdown)
└── hooks/
    ├── useCameraStream.ts
    ├── useCameraUpload.ts  (المنطق الحالي لإيجاد participant ورفع الملف)
    └── useCameraEffects.ts
```
الـ business logic (uploadFile، participant lookup، DB insert) ينتقل كما هو لـ `useCameraUpload` بدون تغيير في التواصل مع Backend.

### D) خارج نطاق هذه الخطة (لمرحلة لاحقة)
- AR Face filters (يحتاج مكتبة ثقيلة مثل MediaPipe/TensorFlow)
- Sticker overlays متقدمة
- Video trim/pause/resume
- Manual exposure/ISO/HDR (دعم المتصفح محدود)
سأذكر هذه كمقترحات في التقرير النهائي.

---

## ترتيب التنفيذ في جلسة واحدة

1. تشغيل الفحص الأمني + قراءة logs (5 دقائق)
2. فحص يدوي للمسارات بالـ Browser + تسجيل ملاحظات
3. إصلاح أي خلل صغير اكتشفته (RLS، routing، missing field…)
4. تقسيم `MobileCamera.tsx` لمكوّنات + hooks (نقل المنطق كما هو)
5. تطبيق التصميم الجديد على كل مكوّن
6. إضافة الميزات الجديدة (tap-to-focus، self-timer، swipe modes، capture flash)
7. اختبار الكاميرا بالـ Browser (نظري — الكاميرا الحقيقية تحتاج جهاز)
8. كتابة التقرير النهائي

## التفاصيل التقنية

- **لا يوجد تغيير على Backend**: الـ RPCs والـ RLS كلها صحيحة
- **لا يوجد migration جديد**
- **لا تغيير في schema**: نفس الجداول، نفس الأعمدة
- **التوافق**: التصميم mobile-first (الكاميرا تشتغل على الموبايل فقط أصلاً)، مع DesktopGate كما هو
