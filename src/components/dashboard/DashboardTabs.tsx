import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./tabs/OverviewTab";
import { EventDetailsTab } from "./tabs/EventDetailsTab";
import { ParticipantsTab } from "./tabs/ParticipantsTab";
import { AlbumTab } from "./tabs/AlbumTab";
import { StatisticsTab } from "./tabs/StatisticsTab";
import { BarChart3, Users, Image, Settings, Activity } from "lucide-react";
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
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 rounded-xl">
        <TabsTrigger value="overview" className="flex items-center gap-2 rounded-lg">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">نظرة عامة</span>
        </TabsTrigger>
        <TabsTrigger value="details" className="flex items-center gap-2 rounded-lg">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">التفاصيل</span>
        </TabsTrigger>
        <TabsTrigger value="participants" className="flex items-center gap-2 rounded-lg">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">المشاركين</span>
        </TabsTrigger>
        <TabsTrigger value="album" className="flex items-center gap-2 rounded-lg">
          <Image className="h-4 w-4" />
          <span className="hidden sm:inline">الألبوم</span>
        </TabsTrigger>
        <TabsTrigger value="stats" className="flex items-center gap-2 rounded-lg">
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">الإحصائيات</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <OverviewTab token={token} eventData={eventData} />
      </TabsContent>

      <TabsContent value="details" className="mt-6">
        <EventDetailsTab token={token} eventData={eventData} onEventUpdate={onEventUpdate} />
      </TabsContent>

      <TabsContent value="participants" className="mt-6">
        <ParticipantsTab token={token} />
      </TabsContent>

      <TabsContent value="album" className="mt-6">
        <AlbumTab token={token} />
      </TabsContent>

      <TabsContent value="stats" className="mt-6">
        <StatisticsTab token={token} />
      </TabsContent>
    </Tabs>
  );
}