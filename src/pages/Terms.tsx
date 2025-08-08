import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";

export default function Terms() {
  useEffect(() => { document.title = "شروط الاستخدام — من عيونكم"; }, []);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-nastaliq mb-4">شروط الاستخدام</h1>
        <article className="prose prose-invert max-w-none text-right">
          <p>باستخدامك لخدمة "من عيونكم"، فإنك توافق على الالتزام بهذه الشروط.</p>
          <ul className="list-disc pr-6">
            <li>المحتوى الذي ترفعه يجب أن يكون مُلكك أو لديك الحق في مشاركته.</li>
            <li>يُمنع رفع أي محتوى مُسيء أو مخالف للقوانين المعمول بها.</li>
            <li>قد نقوم بحذف أي محتوى يخالف سياساتنا دون إشعار مسبق.</li>
          </ul>
          <p>يحق لنا تحديث هذه الشروط من وقت لآخر. استمرارك باستخدام الخدمة يعني موافقتك على التحديثات.</p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
