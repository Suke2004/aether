import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid quest types for validation
const VALID_QUEST_TYPES = ['reading', 'drawing', 'homework', 'chores', 'exercise', 'music', 'custom'];

// Max image size: 10MB (base64 encoded ~13.3M chars)
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

// Rate limit configuration: 5 requests per 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('Request rejected: Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT token with user client
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !user) {
      console.warn('Request rejected: Invalid or expired token', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated request from user: ${user.id}`);

    // Create service role client for rate limiting (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Server-side rate limiting check
    const { data: isAllowed, error: rateLimitError } = await supabaseAdmin.rpc('check_rate_limit', {
      _user_id: user.id,
      _action_type: 'quest_verification',
      _max_requests: RATE_LIMIT_MAX_REQUESTS,
      _window_seconds: RATE_LIMIT_WINDOW_SECONDS
    });

    if (rateLimitError) {
      console.error(`User ${user.id}: Rate limit check failed:`, rateLimitError);
      // On error, allow the request but log it
    } else if (!isAllowed) {
      console.warn(`User ${user.id}: Rate limit exceeded for quest_verification`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many verification requests. Please wait a minute before trying again.',
          retryAfter: RATE_LIMIT_WINDOW_SECONDS
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record the rate limit entry before processing
    const { error: recordError } = await supabaseAdmin.rpc('record_rate_limit', {
      _user_id: user.id,
      _action_type: 'quest_verification'
    });

    if (recordError) {
      console.error(`User ${user.id}: Failed to record rate limit:`, recordError);
      // Continue even if recording fails
    }

    const { questType, imageBase64 } = await req.json();

    // Input validation: Required fields
    if (!questType || !imageBase64) {
      console.warn(`User ${user.id}: Missing required fields`);
      return new Response(
        JSON.stringify({ error: 'Missing questType or imageBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation: Quest type whitelist
    if (!VALID_QUEST_TYPES.includes(questType)) {
      console.warn(`User ${user.id}: Invalid quest type: ${questType}`);
      return new Response(
        JSON.stringify({ error: 'Invalid quest type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation: Image size check
    const estimatedBytes = (imageBase64.length * 3) / 4;
    if (estimatedBytes > MAX_IMAGE_SIZE_BYTES) {
      console.warn(`User ${user.id}: Image too large: ${Math.round(estimatedBytes / 1024 / 1024)}MB`);
      return new Response(
        JSON.stringify({ error: 'Image too large. Maximum 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation: Basic base64 format check (allow data URL prefix)
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Regex.test(base64Data)) {
      console.warn(`User ${user.id}: Invalid base64 format`);
      return new Response(
        JSON.stringify({ error: 'Invalid image format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create quest-specific prompts for all quest types
    const questPrompts: Record<string, string> = {
      reading: "You are analyzing an image to verify if it shows proof of a reading activity. Look for: an open book, reading material, newspapers, magazines, e-readers, or someone actively reading. The image should clearly show reading activity.",
      drawing: "You are analyzing an image to verify if it shows proof of a drawing/art activity. Look for: drawings, sketches, paintings, art supplies in use, colored pencils, crayons, or creative artwork being made. The image should show artistic creation.",
      homework: "You are analyzing an image to verify if it shows proof of homework completion. Look for: worksheets, notebooks with written work, math problems solved, completed assignments, study materials, or educational work in progress.",
      chores: "You are analyzing an image to verify if it shows proof of completing household chores. Look for: a clean room, made bed, organized space, dishes being washed/put away, laundry being folded, vacuuming, sweeping, or any visible cleaning activity. The image should show the completed chore or the activity in progress.",
      exercise: "You are analyzing an image to verify if it shows proof of physical exercise or sports activity. Look for: someone exercising, playing sports, running, cycling, stretching, yoga poses, sports equipment in use, workout gear, or any physical activity. The image should show active movement or exercise.",
      music: "You are analyzing an image to verify if it shows proof of music practice. Look for: a musical instrument being played or held, sheet music, piano keys, guitar, violin, drums, or any instrument. The image should show someone practicing or learning music.",
      custom: "You are analyzing an image to verify if it shows proof of completing a task or activity. Look for evidence that the described activity was performed. Be fair but verify that the image shows genuine completion of a task.",
    };

    const systemPrompt = questPrompts[questType] || questPrompts.custom;

    console.log(`User ${user.id}: Verifying ${questType} quest with AI...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}

You must respond with a JSON object in exactly this format:
{
  "valid": true or false,
  "confidence": number between 0 and 100,
  "reason": "brief explanation of your decision"
}

Be encouraging but fair. If the image clearly shows the activity, mark it valid. If it's unclear or doesn't show the activity, mark it invalid with a helpful reason.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this image and determine if it shows valid proof of a ${questType} activity. Respond with JSON only.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`User ${user.id}: AI Gateway error:`, response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log(`User ${user.id}: AI Response:`, content);

    // Parse the JSON response from the AI
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error(`User ${user.id}: Failed to parse AI response:`, parseError);
      // Default to success if parsing fails but we got a response
      result = {
        valid: true,
        confidence: 70,
        reason: 'Verification completed'
      };
    }

    return new Response(
      JSON.stringify({
        valid: result.valid === true,
        confidence: result.confidence || 80,
        reason: result.reason || 'Quest verified successfully!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-quest function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Verification failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
