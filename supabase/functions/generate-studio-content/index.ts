import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROMPTS: Record<string, string> = {
  faq: `Tu es un assistant expert. À partir du contenu fourni, génère une liste de 10 à 15 questions fréquemment posées (FAQ) avec leurs réponses détaillées.

Format de sortie en Markdown :
## FAQ

### 1. [Question] ?
[Réponse détaillée]

### 2. [Question] ?
[Réponse détaillée]

...

Règles :
- Les questions doivent couvrir les points clés du document
- Les réponses doivent être claires, précises et basées uniquement sur le contenu fourni
- Réponds TOUJOURS en français`,

  briefingDoc: `Tu es un assistant expert en rédaction. À partir du contenu fourni, génère un document de synthèse structuré et professionnel.

Format de sortie en Markdown :
## Document de synthèse

### Résumé exécutif
[2-3 paragraphes résumant les points essentiels]

### Points clés
- [Point 1]
- [Point 2]
- ...

### Analyse détaillée
[Développement structuré des thèmes principaux]

### Conclusions et recommandations
[Conclusions principales et recommandations si applicable]

Règles :
- Le document doit être formel et professionnel
- Basé uniquement sur le contenu fourni
- Réponds TOUJOURS en français`,

  studyGuide: `Tu es un assistant pédagogique expert. À partir du contenu fourni, génère un guide d'étude complet.

Format de sortie en Markdown :
## Guide d'étude

### Objectifs d'apprentissage
- [Objectif 1]
- [Objectif 2]
- ...

### Concepts clés
Pour chaque concept :
#### [Nom du concept]
**Définition :** [définition claire]
**Explication :** [explication détaillée]

### Résumé structuré
[Résumé organisé par thèmes]

### Points à retenir
- [Point essentiel 1]
- [Point essentiel 2]
- ...

### Questions de révision
1. [Question de compréhension]
2. [Question d'analyse]
3. ...

Règles :
- Le guide doit être pédagogique et progressif
- Basé uniquement sur le contenu fourni
- Réponds TOUJOURS en français`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notebookId, featureType } = await req.json();

    if (!notebookId || !featureType) {
      return new Response(
        JSON.stringify({ error: 'notebookId and featureType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = PROMPTS[featureType];
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: `Unknown feature type: ${featureType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all completed sources for this notebook
    const { data: sources, error: sourcesError } = await supabaseClient
      .from('sources')
      .select('title, content, summary')
      .eq('notebook_id', notebookId)
      .eq('processing_status', 'completed');

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sources' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No processed sources found for this notebook' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from sources (limit to avoid token overflow)
    const sourceTexts = sources.map((s, i) => {
      const content = s.content || s.summary || '';
      // Limit each source to ~3000 chars to stay within token limits
      const truncated = content.substring(0, 3000);
      return `--- Source ${i + 1}: ${s.title} ---\n${truncated}`;
    });

    const combinedContent = sourceTexts.join('\n\n');
    // Limit total content to ~12000 chars
    const finalContent = combinedContent.substring(0, 12000);

    console.log(`Generating ${featureType} for notebook ${notebookId} with ${sources.length} sources`);

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Voici le contenu des sources :\n\n${finalContent}` }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log(`Successfully generated ${featureType} content`);

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        featureType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-studio-content:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
