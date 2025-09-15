// Secure helper functions for participant data access
import { supabase } from "@/integrations/supabase/client";

/**
 * Get public participant data (safe for album viewing)
 * Only returns non-sensitive fields for published albums
 */
export async function getPublicParticipantData(eventToken: string) {
  const { data, error } = await supabase.rpc(
    'get_public_participant_data',
    { event_token_param: eventToken }
  );
  
  if (error) {
    console.error('Error fetching public participant data:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get full participant data for event owners
 * Includes all sensitive information like email and phone
 */
export async function getOwnerParticipantData(eventToken: string, ownerUserId: string) {
  const { data, error } = await supabase.rpc(
    'get_owner_participant_data',
    { 
      event_token_param: eventToken,
      owner_user_id: ownerUserId
    }
  );
  
  if (error) {
    console.error('Error fetching owner participant data:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Search for participants by name (safe lookup for albums)
 * Only returns ID and name for participant matching in album pages
 */
export async function getParticipantByName(eventToken: string, participantName: string) {
  const { data, error } = await supabase.rpc(
    'get_participant_by_name',
    { 
      event_token_param: eventToken,
      participant_name: participantName
    }
  );
  
  if (error) {
    console.error('Error searching participant by name:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Check if current user is event owner
 */
export async function isCurrentUserEventOwner(eventToken: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return false;

  const { data, error } = await supabase.rpc(
    'is_user_event_owner',
    {
      user_id: session.user.id,
      event_token: eventToken
    }
  );

  if (error) {
    console.error('Error checking event ownership:', error);
    return false;
  }

  return data || false;
}