import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Mail, MessageCircle, Trash2 } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  method: string;
  created_at: string;
}

interface ParticipantsTabProps {
  token: string;
}

export function ParticipantsTab({ token }: ParticipantsTabProps) {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipants();
  }, [token]);

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("event_token", token)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      toast({
        title: "خطأ في تحميل المشاركين",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeParticipant = async (participantId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المشارك؟")) return;

    try {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", participantId);

      if (error) throw error;

      setParticipants(prev => prev.filter(p => p.id !== participantId));
      toast({ title: "تم حذف المشارك بنجاح" });
    } catch (error) {
      toast({
        title: "فشل في حذف المشارك",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  const sendInvite = (participant: Participant) => {
    const eventUrl = `${window.location.origin}/event/${token}`;
    
    if (participant.email) {
      window.open(`mailto:${participant.email}?subject=دعوة للمشاركة في المناسبة&body=أهلاً ${participant.name}، مدعو للمشاركة في المناسبة: ${eventUrl}`);
    } else if (participant.phone) {
      window.open(`https://wa.me/${participant.phone}?text=أهلاً ${participant.name}، مدعو للمشاركة في المناسبة: ${eventUrl}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>جاري تحميل المشاركين...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            المشاركون ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد مشاركون حتى الآن
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">التواصل</TableHead>
                  <TableHead className="text-right">طريقة الدخول</TableHead>
                  <TableHead className="text-right">تاريخ الانضمام</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">
                      {participant.name || "غير محدد"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {participant.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {participant.email}
                          </div>
                        )}
                        {participant.phone && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {participant.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{participant.method}</TableCell>
                    <TableCell>
                      {new Date(participant.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendInvite(participant)}
                        >
                          دعوة
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeParticipant(participant.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}