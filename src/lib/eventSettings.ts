import { supabase } from "@/integrations/supabase/client";

export interface EventSettings {
  token: string;
  title: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  max_shots: number;
  expected_guests: number;
  enable_video: boolean;
  is_private: boolean;
  country_code: string;
  cover_url?: string;
  sign_in_method: "phone" | "email";
  calendar_type: "gregorian" | "hijri";
  published_at?: string;
  
  // Privacy and sharing settings
  password?: string;
  share_method?: "email" | "whatsapp";
  album_publish_time?: string;
  custom_publish_delay?: number;
  
  // Welcome page customization
  welcome_title?: string;
  welcome_text?: string;
  invite_button_text?: string;
  
  // Album settings
  album_title?: string;
  album_description?: string;
  album_cover_url?: string;
  is_album_published?: boolean;
  show_header?: boolean;
}

export interface UserProfile {
  id: string;
  display_name?: string;
  phone?: string;
  country_code: string;
  country?: string;
  gender?: string;
}

// Get event settings with proper fallbacks
export async function getEventSettings(token: string): Promise<EventSettings | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;

  return {
    token: data.token,
    title: data.title || "مناسبة جديدة",
    description: data.description,
    start_at: data.start_at,
    end_at: data.end_at,
    max_shots: data.max_shots || 120,
    expected_guests: data.expected_guests || 100,
    enable_video: data.enable_video ?? true,
    is_private: data.is_private ?? false,
    country_code: data.country_code || "+962",
    cover_url: data.cover_url,
    sign_in_method: (data.sign_in_method as "phone" | "email") || "phone",
    calendar_type: (data.calendar_type as "gregorian" | "hijri") || "gregorian",
    published_at: data.published_at,
    
    // Privacy and sharing settings
    password: (data as any).password,
    share_method: ((data as any).share_method as "email" | "whatsapp") || "email",
    album_publish_time: (data as any).album_publish_time || "after_event",
    custom_publish_delay: (data as any).custom_publish_delay || 24,
    
    // Welcome page customization
    welcome_title: (data as any).welcome_title,
    welcome_text: (data as any).welcome_text,
    invite_button_text: (data as any).invite_button_text,
    
    // Album settings
    album_title: (data as any).album_title,
    album_description: (data as any).album_description,
    album_cover_url: (data as any).album_cover_url,
    is_album_published: (data as any).is_album_published ?? false,
    show_header: (data as any).show_header !== false,
  };
}

// Update event settings
export async function updateEventSettings(token: string, settings: Partial<EventSettings>): Promise<boolean> {
  const { error } = await supabase
    .from("events")
    .update(settings)
    .eq("token", token);

  return !error;
}

// Get user profile with defaults
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;

  return {
    id: userId,
    display_name: data?.display_name,
    phone: data?.phone,
    country_code: data?.country_code || "+962",
    country: data?.country,
    gender: data?.gender,
  };
}

// Update user profile
export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      ...profile,
      updated_at: new Date().toISOString(),
    });

  return !error;
}

// Check if event is active (between start and end times)
export function isEventActive(settings: EventSettings): boolean {
  const now = new Date();
  const start = settings.start_at ? new Date(settings.start_at) : null;
  const end = settings.end_at ? new Date(settings.end_at) : null;

  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

// Check if event has started
export function hasEventStarted(settings: EventSettings): boolean {
  const now = new Date();
  const start = settings.start_at ? new Date(settings.start_at) : null;
  return !start || now >= start;
}

// Check if event has ended
export function hasEventEnded(settings: EventSettings): boolean {
  const now = new Date();
  const end = settings.end_at ? new Date(settings.end_at) : null;
  return end ? now > end : false;
}

// Get supported countries
export function getSupportedCountries() {
  return [
    { code: "+962", name: "Jordan", nameAr: "الأردن" },
    { code: "+966", name: "Saudi Arabia", nameAr: "السعودية" },
    { code: "+971", name: "UAE", nameAr: "الإمارات" },
    { code: "+965", name: "Kuwait", nameAr: "الكويت" },
    { code: "+974", name: "Qatar", nameAr: "قطر" },
    { code: "+973", name: "Bahrain", nameAr: "البحرين" },
    { code: "+968", name: "Oman", nameAr: "عُمان" },
    { code: "+961", name: "Lebanon", nameAr: "لبنان" },
    { code: "+963", name: "Syria", nameAr: "سوريا" },
    { code: "+964", name: "Iraq", nameAr: "العراق" },
    { code: "+970", name: "Palestine", nameAr: "فلسطين" },
    { code: "+20", name: "Egypt", nameAr: "مصر" },
    { code: "+216", name: "Tunisia", nameAr: "تونس" },
    { code: "+213", name: "Algeria", nameAr: "الجزائر" },
    { code: "+212", name: "Morocco", nameAr: "المغرب" },
    { code: "+218", name: "Libya", nameAr: "ليبيا" },
    { code: "+249", name: "Sudan", nameAr: "السودان" },
    { code: "+967", name: "Yemen", nameAr: "اليمن" }
  ];
}

// Auto-detect country code from browser
export function detectCountryCode(): string {
  try {
    const lang = navigator.language || "";
    const langMap: Record<string, string> = {
      "MA": "+212", "DZ": "+213", "LY": "+218", "TN": "+216",
      "EG": "+20", "SD": "+249", "YE": "+967", "SY": "+963",
      "PS": "+970", "LB": "+961", "JO": "+962", "SA": "+966",
      "AE": "+971", "QA": "+974", "BH": "+973", "OM": "+968",
      "KW": "+965", "IQ": "+964"
    };
    
    for (const [countryCode, phoneCode] of Object.entries(langMap)) {
      if (lang.includes(countryCode)) {
        return phoneCode;
      }
    }
    return "+962"; // Default to Jordan
  } catch {
    return "+962";
  }
}