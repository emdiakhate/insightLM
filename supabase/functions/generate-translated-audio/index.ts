import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Split text into chunks at sentence boundaries, respecting max length
function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Find the last sentence boundary within maxLength
    let splitIndex = maxLength;
    const searchArea = remaining.substring(0, maxLength);

    // Try to split at sentence endings (. ! ? followed by space or newline)
    const lastSentence = searchArea.lastIndexOf('. ');
    const lastExclaim = searchArea.lastIndexOf('! ');
    const lastQuestion = searchArea.lastIndexOf('? ');
    const lastNewline = searchArea.lastIndexOf('\n');

    const bestSplit = Math.max(lastSentence, lastExclaim, lastQuestion, lastNewline);

    if (bestSplit > maxLength * 0.3) {
      splitIndex = bestSplit + 1;
    }

    chunks.push(remaining.substring(0, splitIndex).trim());
    remaining = remaining.substring(splitIndex).trim();
  }

  return chunks.filter(c => c.length > 0);
}

// Translate text using GPT-4o-mini
async function translateText(text: string, targetLang: string): Promise<string> {
  const maxChunkSize = 8000; // chars for translation (well within token limits)
  const chunks = chunkText(text, maxChunkSize);
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un traducteur professionnel. Traduis le texte suivant en ${targetLang === 'fr' ? 'français' : targetLang}. Garde le même ton et style. Ne traduis que le contenu, n'ajoute pas de commentaires. Si le texte est déjà en ${targetLang === 'fr' ? 'français' : targetLang}, retourne-le tel quel.`
          },
          { role: 'user', content: chunk }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Translation API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    translatedChunks.push(data.choices[0].message.content);
  }

  return translatedChunks.join('\n\n');
}

// Generate audio using OpenAI TTS API and return audio buffer
async function generateTTSAudio(text: string, voice: string = 'nova'): Promise<Uint8Array> {
  const maxTTSLength = 4000; // OpenAI TTS limit is 4096
  const chunks = chunkText(text, maxTTSLength);
  const audioBuffers: Uint8Array[] = [];

  console.log(`Generating TTS for ${chunks.length} chunks...`);

  for (let i = 0; i < chunks.length; i++) {
    console.log(`TTS chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: chunks[i],
        voice: voice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS API error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    audioBuffers.push(new Uint8Array(arrayBuffer));
  }

  // Concatenate all audio buffers
  const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0);
  const concatenated = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of audioBuffers) {
    concatenated.set(buf, offset);
    offset += buf.length;
  }

  return concatenated;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notebookId, sourceId, targetLanguage = 'fr', voice = 'nova' } = await req.json();

    if (!notebookId) {
      return new Response(
        JSON.stringify({ error: 'notebookId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update notebook status
    await supabase
      .from('notebooks')
      .update({ audio_overview_generation_status: 'generating' })
      .eq('id', notebookId);

    // Return immediately, process in background
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          // Get source content
          let sourceContent = '';

          if (sourceId) {
            const { data: source } = await supabase
              .from('sources')
              .select('content, summary, title')
              .eq('id', sourceId)
              .single();

            sourceContent = source?.content || source?.summary || '';
          } else {
            // Get all sources for this notebook
            const { data: sources } = await supabase
              .from('sources')
              .select('content, summary, title')
              .eq('notebook_id', notebookId)
              .eq('processing_status', 'completed');

            if (sources && sources.length > 0) {
              sourceContent = sources
                .map(s => s.content || s.summary || '')
                .join('\n\n');
            }
          }

          if (!sourceContent || sourceContent.trim().length === 0) {
            console.error('No source content found');
            await supabase
              .from('notebooks')
              .update({ audio_overview_generation_status: 'failed' })
              .eq('id', notebookId);
            return;
          }

          // Limit content to avoid excessive API costs (~30000 chars max)
          const trimmedContent = sourceContent.substring(0, 30000);

          console.log(`Translating ${trimmedContent.length} chars to ${targetLanguage}...`);

          // Step 1: Translate
          const translatedText = await translateText(trimmedContent, targetLanguage);
          console.log(`Translation complete: ${translatedText.length} chars`);

          // Step 2: Generate TTS audio
          const audioBuffer = await generateTTSAudio(translatedText, voice);
          console.log(`TTS complete: ${audioBuffer.length} bytes`);

          // Step 3: Upload to Supabase Storage
          const fileName = `${notebookId}/translated-audio-${Date.now()}.mp3`;

          const { error: uploadError } = await supabase.storage
            .from('audio')
            .upload(fileName, audioBuffer, {
              contentType: 'audio/mpeg',
              upsert: true,
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          // Generate signed URL (24h expiry)
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('audio')
            .createSignedUrl(fileName, 86400); // 24 hours

          if (signedUrlError || !signedUrlData?.signedUrl) {
            throw new Error('Failed to generate signed URL');
          }

          // Update notebook with audio URL
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          await supabase
            .from('notebooks')
            .update({
              audio_overview_url: signedUrlData.signedUrl,
              audio_url_expires_at: expiresAt.toISOString(),
              audio_overview_generation_status: 'completed',
            })
            .eq('id', notebookId);

          // Also save the translated text as a note
          await supabase
            .from('notes')
            .insert({
              notebook_id: notebookId,
              title: `Traduction complète (${targetLanguage.toUpperCase()})`,
              content: translatedText,
              source_type: 'ai_response',
              extracted_text: translatedText.substring(0, 200),
            });

          console.log('Translated audio generation completed successfully');

        } catch (error) {
          console.error('Background processing error:', error);
          await supabase
            .from('notebooks')
            .update({ audio_overview_generation_status: 'failed' })
            .eq('id', notebookId);
        }
      })()
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Translated audio generation started',
        status: 'generating',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-translated-audio:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
