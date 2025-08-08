import React from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type Props = { url?: string };

const DesktopGate: React.FC<Props> = ({ url }) => {
  const href = url || (typeof window !== "undefined" ? (() => {
    const u = new URL(window.location.href);
    const parts = u.pathname.split("/");
    if (parts[1] === "event" && parts[2]) u.pathname = `/event/${parts[2]}/welcome`;
    return u.toString();
  })() : "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      alert("تم نسخ الرابط");
    } catch (_) {}
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: href });
      } else {
        await navigator.clipboard.writeText(href);
        alert("تم نسخ الرابط للمشاركة");
      }
    } catch (_) {}
  };

  return (
    <div className="w-full min-h-[70vh] grid place-items-center px-4" dir="rtl">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-3">افتح الرابط من هاتفك أو جهاز لوحي</h1>
        <p className="text-center text-muted-foreground mb-6">المشاركة عبر الجوال فقط لأفضل تجربة تصوير.</p>
        <div className="bg-background rounded-xl p-4 border border-border mx-auto w-full max-w-xs">
          <QRCode value={href} size={192} className="mx-auto" />
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={share} className="rounded-full px-6">مشاركة</Button>
          <Button variant="outline" onClick={copy} className="rounded-full px-6">نسخ الرابط</Button>
        </div>
        <div className="mt-4 text-center">
          <Link to="/create-event" className="text-sm underline">بدك تنشئ مناسبة؟</Link>
        </div>
      </div>
    </div>
  );
};

export default DesktopGate;
