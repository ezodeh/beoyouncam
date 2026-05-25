import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getGuestRoute, getStoredParticipantId } from "@/lib/eventRouter";

/**
 * `/event/:token` is a thin router that uses the public RPC to read the event,
 * then sends the guest to the correct screen (soon / ended / welcome / camera).
 */
const EventCapture = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase
        .rpc("get_public_event_info", { event_token: token })
        .maybeSingle();
      if (error || !data) {
        navigate("/404", { replace: true });
        return;
      }
      const hasParticipant = !!getStoredParticipantId(token);
      const route = getGuestRoute(
        {
          token: data.token,
          start_at: data.start_at,
          end_at: data.end_at,
          is_album_published: data.is_album_published,
        },
        hasParticipant
      );
      navigate(route, { replace: true });
    })();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar compact />
      <main className="flex-1 grid place-items-center text-muted-foreground">جاري التحويل…</main>
      <Footer />
    </div>
  );
};

export default EventCapture;
