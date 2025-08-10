import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./tabs/OverviewTab";
import { EventDetailsTab } from "./tabs/EventDetailsTab";
import { ParticipantsTab } from "./tabs/ParticipantsTab";
import { AlbumTab } from "./tabs/AlbumTab";
import { AlbumSettingsTab } from "./tabs/AlbumSettingsTab";
import { StatisticsTab } from "./tabs/StatisticsTab";
import { QRCodesTab } from "./tabs/QRCodesTab";
import { PrivacyTab } from "./tabs/PrivacyTab";
import { CustomizationTab } from "./tabs/CustomizationTab";
import { BarChart3, Users, Image, Settings, Activity, QrCode, Shield, Share2, Palette, Album } from "lucide-react";
import { useLocation } from "react-router-dom";

interface DashboardTabsProps {
  token: string;
  eventData: any;
  onEventUpdate: () => void;
}

export function DashboardTabs({ token, eventData, onEventUpdate }: DashboardTabsProps) {
  const location = useLocation();
  const defaultTab = new URLSearchParams(location.search).get("tab") || "overview";
  return (
    <div className="w-full" dir="rtl">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 bg-muted/50 p-1 rounded-xl gap-1 overflow-x-auto" dir="rtl">
          <TabsTrigger value="overview" className="flex items-center gap-1 rounded-lg flex-row-reverse order-1 min-w-fit px-3">
            <span className="hidden md:inline text-xs lg:text-sm">نظرة عامة</span>
            <BarChart3 className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-1 rounded-lg flex-row-reverse order-2 min-w-fit px-3">
            <span className="hidden md:inline text-xs lg:text-sm">التفاصيل</span>
            <Settings className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-1 rounded-lg flex-row-reverse order-3 min-w-fit px-3">
            <span className="hidden md:inline text-xs lg:text-sm">المشاركين</span>
            <Users className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="album" className="flex items-center gap-1 rounded-lg flex-row-reverse order-4 min-w-fit px-3">
            <span className="hidden md:inline text-xs lg:text-sm">الألبوم</span>
            <Image className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="album-settings" className="flex items-center gap-1 rounded-lg flex-row-reverse order-5 min-w-fit px-3">
            <span className="hidden md:inline text-xs lg:text-sm">إعدادات الألبوم</span>
            <Album className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="customization" className="flex items-center gap-1 rounded-lg flex-row-reverse order-6 min-w-fit px-3">
            <span className="hidden md:inline text-xs lg:text-sm">التنسيق</span>
            <Palette className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="sharing" className="flex items-center gap-1 rounded-lg flex-row-reverse order-7 min-w-fit px-3">
            <span className="hidden md:inline text-xs lg:text-sm">المشاركة</span>
            <Share2 className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1 rounded-lg flex-row-reverse order-8 min-w-fit px-3">
            <span className="hidden md:inline text-xs lg:text-sm">الإحصائيات</span>
            <Activity className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab token={token} eventData={eventData} />
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <EventDetailsTab token={token} eventData={eventData} onEventUpdate={onEventUpdate} />
        </TabsContent>

        <TabsContent value="album-settings" className="mt-6">
          <AlbumSettingsTab token={token} eventData={eventData} onEventUpdate={onEventUpdate} />
        </TabsContent>

        <TabsContent value="album" className="mt-6">
          <AlbumTab token={token} eventData={eventData} onEventUpdate={onEventUpdate} />
        </TabsContent>

        <TabsContent value="participants" className="mt-6">
          <div className="space-y-6">
            <ParticipantsTab token={token} />
            <PrivacyTab token={token} eventData={eventData} onEventUpdate={onEventUpdate} />
          </div>
        </TabsContent>

        <TabsContent value="customization" className="mt-6">
          <CustomizationTab token={token} eventData={eventData} onEventUpdate={onEventUpdate} />
        </TabsContent>

        <TabsContent value="sharing" className="mt-6">
          <QRCodesTab token={token} eventData={eventData} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <StatisticsTab token={token} />
        </TabsContent>
      </Tabs>
    </div>
  );
}