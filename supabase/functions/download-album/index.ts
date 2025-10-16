import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MediaItem {
  file_name: string;
  file_path: string;
  participants: { name: string } | null;
}

interface Blessing {
  name: string;
  content: string;
  created_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Download album request received');
    
    const url = new URL(req.url);
    const eventToken = url.searchParams.get('token');
    
    // Input validation - defense in depth
    if (!eventToken || typeof eventToken !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Event token is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate token length (tokens are typically short alphanumeric strings)
    if (eventToken.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid event token format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate token characters (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(eventToken)) {
      return new Response(
        JSON.stringify({ error: 'Invalid event token characters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Check if user is event owner
    const { data: isOwner, error: ownerError } = await supabase
      .rpc('is_event_owner', { 
        event_token: eventToken, 
        user_id: user.id 
      });

    if (ownerError || !isOwner) {
      console.error('Ownership check failed:', ownerError);
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('User is event owner, proceeding with download');

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title')
      .eq('token', eventToken)
      .single();

    if (eventError || !event) {
      console.error('Event not found:', eventError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get media files with participant names
    const { data: mediaItems, error: mediaError } = await supabase
      .from('media_submissions')
      .select(`
        file_name,
        file_path,
        participants (name)
      `)
      .eq('event_token', eventToken) as { data: MediaItem[] | null, error: any };

    if (mediaError) {
      console.error('Error fetching media:', mediaError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch media' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get blessings
    const { data: blessings, error: blessingsError } = await supabase
      .from('blessings')
      .select('name, content, created_at')
      .eq('event_token', eventToken)
      .order('created_at', { ascending: false }) as { data: Blessing[] | null, error: any };

    if (blessingsError) {
      console.error('Error fetching blessings:', blessingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch blessings' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${mediaItems?.length || 0} media items and ${blessings?.length || 0} blessings`);

    // Create ZIP file using JSZip
    const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
    const zip = new JSZip();

    // Add media files to ZIP
    if (mediaItems && mediaItems.length > 0) {
      const mediaFolder = zip.folder('الصور');
      
      for (const item of mediaItems) {
        try {
          // Download file from Supabase storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('event-media')
            .download(item.file_path);

          if (downloadError) {
            console.error(`Error downloading ${item.file_name}:`, downloadError);
            continue;
          }

          if (fileData) {
            // Create file name with participant name
            const participantName = item.participants?.name || 'مجهول';
            const fileExtension = item.file_name.split('.').pop() || '';
            const fileName = `${participantName}_${item.file_name}`;
            
            const arrayBuffer = await fileData.arrayBuffer();
            mediaFolder?.file(fileName, arrayBuffer);
            console.log(`Added file: ${fileName}`);
          }
        } catch (error) {
          console.error(`Error processing file ${item.file_name}:`, error);
        }
      }
    }

    // Add blessings as text file
    if (blessings && blessings.length > 0) {
      let blessingsText = `مباركات مناسبة: ${event.title}\n\n`;
      blessingsText += '='.repeat(50) + '\n\n';
      
      blessings.forEach((blessing, index) => {
        const date = new Date(blessing.created_at).toLocaleDateString('ar-SA');
        blessingsText += `${index + 1}. ${blessing.name || 'مجهول'}\n`;
        blessingsText += `التاريخ: ${date}\n`;
        blessingsText += `المباركة: ${blessing.content}\n\n`;
        blessingsText += '-'.repeat(30) + '\n\n';
      });

      zip.file('المباركات.txt', blessingsText);
      console.log('Added blessings file');
    }

    // Generate ZIP
    console.log('Generating ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'uint8array' });
    
    const albumName = event.title || 'الألبوم';
    const filename = `${albumName}_${eventToken}.zip`;

    console.log(`ZIP file generated: ${filename}, size: ${zipBlob.length} bytes`);

    // Return ZIP file
    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': zipBlob.length.toString(),
      },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});