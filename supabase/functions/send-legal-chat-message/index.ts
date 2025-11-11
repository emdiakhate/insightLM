/**
 * Edge Function pour le chat juridique avec recherche hybride
 * Utilise la base juridique sénégalaise + documents du dossier
 * Appelle directement Claude/OpenAI sans passer par N8N
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
interface ChatMessage {
  session_id: string;
  message: string;
  user_id: string;
}

interface LegalDocument {
  id: string;
  type: string;
  article_number: string | null;
  title: string;
  content: string;
  summary: string | null;
  metadata: any;
  similarity: number;
}

interface ClientDocument {
  id: number;
  content: string;
  metadata: any;
  similarity: number;
}

interface Citation {
  citation_id: number;
  source_id: string;
  source_title: string;
  source_type: string;
  excerpt: string;
  article_number?: string;
  page_number?: number;
}

/**
 * Génère un embedding OpenAI
 */
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Recherche hybride: base juridique + documents dossier
 */
async function hybridSearch(
  query: string,
  notebookId: string,
  supabaseClient: any,
  openaiKey: string
): Promise<{ legalDocs: LegalDocument[], clientDocs: ClientDocument[] }> {

  console.log('🔍 Génération embedding pour:', query);
  const queryEmbedding = await generateEmbedding(query, openaiKey);

  // 1. Recherche dans la base juridique (globale)
  console.log('📚 Recherche dans base juridique...');
  const { data: legalDocs, error: legalError } = await supabaseClient
    .rpc('match_legal_documents', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: 5,
      filter_jurisdiction: 'senegal',
    });

  if (legalError) {
    console.error('❌ Erreur recherche juridique:', legalError);
  }

  // 2. Recherche dans documents du dossier client
  console.log('📁 Recherche dans documents dossier...');
  const { data: clientDocs, error: clientError } = await supabaseClient
    .rpc('match_documents', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: 3,
      filter: { notebook_id: notebookId },
    });

  if (clientError) {
    console.error('❌ Erreur recherche documents:', clientError);
  }

  return {
    legalDocs: legalDocs || [],
    clientDocs: clientDocs || [],
  };
}

/**
 * Génère le contexte formaté pour le prompt
 */
function formatContextForPrompt(legalDocs: LegalDocument[], clientDocs: ClientDocument[]): string {
  let context = '';

  // Contexte juridique
  if (legalDocs.length > 0) {
    context += '=== BASE JURIDIQUE SÉNÉGALAISE ===\n\n';
    legalDocs.forEach((doc, idx) => {
      context += `[SOURCE_LEGALE_${idx + 1}]\n`;
      context += `Type: ${doc.type}\n`;
      if (doc.article_number) {
        context += `Article: ${doc.article_number}\n`;
      }
      context += `Titre: ${doc.title}\n`;
      context += `Contenu: ${doc.content}\n`;
      if (doc.summary) {
        context += `Résumé: ${doc.summary}\n`;
      }
      context += `Pertinence: ${(doc.similarity * 100).toFixed(0)}%\n\n`;
    });
  }

  // Documents du dossier client
  if (clientDocs.length > 0) {
    context += '\n=== DOCUMENTS DU DOSSIER ===\n\n';
    clientDocs.forEach((doc, idx) => {
      context += `[DOC_DOSSIER_${idx + 1}]\n`;
      if (doc.metadata?.source_title) {
        context += `Source: ${doc.metadata.source_title}\n`;
      }
      context += `Contenu: ${doc.content}\n`;
      context += `Pertinence: ${(doc.similarity * 100).toFixed(0)}%\n\n`;
    });
  }

  return context;
}

/**
 * Génère les citations depuis les documents
 */
function generateCitations(legalDocs: LegalDocument[], clientDocs: ClientDocument[]): Citation[] {
  const citations: Citation[] = [];
  let citationId = 1;

  // Citations des articles de loi
  legalDocs.forEach((doc) => {
    citations.push({
      citation_id: citationId++,
      source_id: doc.id,
      source_title: doc.article_number
        ? `${doc.article_number} - ${doc.title}`
        : doc.title,
      source_type: 'legal_code',
      excerpt: doc.content.substring(0, 200) + '...',
      article_number: doc.article_number || undefined,
    });
  });

  // Citations des documents du dossier
  clientDocs.forEach((doc) => {
    citations.push({
      citation_id: citationId++,
      source_id: doc.id.toString(),
      source_title: doc.metadata?.source_title || 'Document du dossier',
      source_type: 'client_document',
      excerpt: doc.content.substring(0, 200) + '...',
      page_number: doc.metadata?.page_number,
    });
  });

  return citations;
}

/**
 * Appelle Claude pour générer la réponse
 */
async function callClaude(
  query: string,
  context: string,
  citations: Citation[],
  anthropicKey: string
): Promise<string> {

  const systemPrompt = `Tu es Maître AI, assistant juridique expert du droit sénégalais.

CONTEXTE DISPONIBLE :
${context}

RÈGLES STRICTES :
1. Base tes réponses EXCLUSIVEMENT sur le droit sénégalais fourni ci-dessus
2. Cite TOUJOURS les articles de loi avec le format : [Art. XXX du Code Pénal sénégalais]
3. Pour chaque affirmation juridique, indique la source avec [SOURCE_LEGALE_X] ou [DOC_DOSSIER_X]
4. Si l'information n'est pas dans le contexte, dis explicitement "Je n'ai pas trouvé de référence dans..."
5. Adapte ton langage à un avocat professionnel
6. Propose des arguments concrets avec fondement juridique
7. Signale les délais procéduraux pertinents quand applicables

FORMAT DE RÉPONSE OBLIGATOIRE :

**📋 RÉSUMÉ JURIDIQUE**
[2-3 lignes de synthèse]

**⚖️ BASE LÉGALE**
[Articles de loi applicables avec citations]

**📊 ANALYSE DU CAS**
[Application des règles au contexte du dossier]

**💡 RECOMMANDATIONS**
[Actions conseillées avec fondement juridique]

CITATIONS DISPONIBLES :
${citations.map(c => `[${c.citation_id}] ${c.source_title}`).join('\n')}

Question de l'avocat :`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: query,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Sauvegarde le message dans l'historique
 */
async function saveToHistory(
  supabaseClient: any,
  sessionId: string,
  type: 'human' | 'ai',
  content: any
) {
  const { error } = await supabaseClient
    .from('n8n_chat_histories')
    .insert({
      session_id: sessionId,
      message: {
        type,
        content,
      },
    });

  if (error) {
    console.error('❌ Erreur sauvegarde historique:', error);
  }
}

/**
 * Handler principal
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, message, user_id }: ChatMessage = await req.json();

    console.log('🚀 Legal chat request:', { session_id, message, user_id });

    // Vérifier les variables d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration manquante');
    }

    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY manquante');
    }

    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY manquante');
    }

    // Créer client Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Sauvegarder message utilisateur
    await saveToHistory(supabase, session_id, 'human', message);

    // Recherche hybride
    const { legalDocs, clientDocs } = await hybridSearch(
      message,
      session_id, // notebook_id = session_id
      supabase,
      openaiKey
    );

    console.log(`📚 Trouvé: ${legalDocs.length} articles juridiques, ${clientDocs.length} docs dossier`);

    // Vérifier qu'on a du contexte
    if (legalDocs.length === 0 && clientDocs.length === 0) {
      const noContextResponse = {
        type: 'ai',
        content: {
          segments: [{
            text: "Je n'ai pas trouvé d'information pertinente dans la base juridique ou dans les documents de votre dossier. Pourriez-vous reformuler votre question ou ajouter des documents au dossier ?",
          }],
          citations: [],
        },
      };

      await saveToHistory(supabase, session_id, 'ai', noContextResponse.content);

      return new Response(
        JSON.stringify({ success: true, data: noContextResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Préparer contexte et citations
    const context = formatContextForPrompt(legalDocs, clientDocs);
    const citations = generateCitations(legalDocs, clientDocs);

    // Appeler Claude
    console.log('🤖 Appel Claude...');
    const aiResponse = await callClaude(message, context, citations, anthropicKey);

    // Formater la réponse
    const formattedResponse = {
      type: 'ai',
      content: {
        segments: [{
          text: aiResponse,
        }],
        citations: citations,
      },
    };

    // Sauvegarder réponse IA
    await saveToHistory(supabase, session_id, 'ai', formattedResponse.content);

    console.log('✅ Réponse juridique générée avec succès');

    return new Response(
      JSON.stringify({ success: true, data: formattedResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in send-legal-chat-message:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Erreur lors de la génération de la réponse juridique',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
