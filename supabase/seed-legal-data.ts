/**
 * Script pour importer la base de connaissances juridiques sénégalaises
 * avec génération d'embeddings OpenAI
 *
 * Usage: deno run --allow-net --allow-read --allow-env seed-legal-data.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://qvbrsumfwifsixlqqtho.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

if (!SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  console.error('   OPENAI_API_KEY:', OPENAI_API_KEY ? '✓' : '✗');
  Deno.exit(1);
}

// Créer client Supabase avec service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Types
interface LegalArticle {
  type: string;
  article_number?: string;
  title: string;
  content: string;
  summary?: string;
  metadata: Record<string, any>;
}

/**
 * Génère un embedding OpenAI pour un texte
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Prépare le texte pour l'embedding (optimisation)
 */
function prepareTextForEmbedding(article: LegalArticle): string {
  const parts = [];

  if (article.article_number) {
    parts.push(`Article ${article.article_number}`);
  }

  parts.push(article.title);
  parts.push(article.content);

  if (article.summary) {
    parts.push(article.summary);
  }

  return parts.join('\n\n');
}

/**
 * Import un article dans la base de données
 */
async function importArticle(article: LegalArticle, index: number, total: number) {
  try {
    console.log(`\n[${index + 1}/${total}] Import: ${article.article_number || article.title}`);

    // Générer l'embedding
    console.log('  → Génération embedding...');
    const text = prepareTextForEmbedding(article);
    const embedding = await generateEmbedding(text);

    // Insérer dans la base
    console.log('  → Insertion en base...');
    const { data, error } = await supabase
      .from('legal_knowledge_base')
      .insert({
        type: article.type,
        article_number: article.article_number || null,
        title: article.title,
        content: article.content,
        summary: article.summary || null,
        metadata: article.metadata,
        embedding: JSON.stringify(embedding),
        jurisdiction: 'senegal',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error(`  ✗ Erreur:`, error.message);
      return false;
    }

    console.log(`  ✓ Importé avec succès (ID: ${data.id})`);
    return true;
  } catch (error) {
    console.error(`  ✗ Erreur lors de l'import:`, error.message);
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Import de la base de connaissances juridiques sénégalaises\n');
  console.log('📍 Supabase URL:', SUPABASE_URL);
  console.log('📍 Utilisation: text-embedding-3-small (OpenAI)\n');

  // Charger les données JSON
  console.log('📖 Chargement des données...');
  const jsonData = await Deno.readTextFile('./seed_legal_data.json');
  const articles: LegalArticle[] = JSON.parse(jsonData);

  console.log(`✓ ${articles.length} articles chargés\n`);

  // Vérifier si des données existent déjà
  const { count } = await supabase
    .from('legal_knowledge_base')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log(`⚠️  La base contient déjà ${count} articles.`);
    const confirmation = prompt('Voulez-vous supprimer les données existantes ? (oui/non): ');

    if (confirmation?.toLowerCase() === 'oui') {
      console.log('🗑️  Suppression des données existantes...');
      const { error } = await supabase
        .from('legal_knowledge_base')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        console.error('❌ Erreur lors de la suppression:', error.message);
        Deno.exit(1);
      }
      console.log('✓ Données supprimées\n');
    } else {
      console.log('❌ Import annulé');
      Deno.exit(0);
    }
  }

  // Import des articles
  console.log('📝 Début de l\'import...\n');
  console.log('─'.repeat(60));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < articles.length; i++) {
    const success = await importArticle(articles[i], i, articles.length);

    if (success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Pause pour éviter rate limiting OpenAI (50 req/min)
    if (i < articles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 Résumé de l\'import:');
  console.log(`  ✓ Succès: ${successCount}`);
  console.log(`  ✗ Erreurs: ${errorCount}`);
  console.log(`  📦 Total: ${articles.length}\n`);

  if (errorCount === 0) {
    console.log('🎉 Import terminé avec succès !');
  } else {
    console.log('⚠️  Import terminé avec des erreurs');
  }

  // Statistiques finales
  const { count: finalCount } = await supabase
    .from('legal_knowledge_base')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📈 Articles en base: ${finalCount}`);

  // Exemples de recherche
  console.log('\n🔍 Test de recherche...');

  const testQuery = "Quelle est la peine pour vol simple ?";
  console.log(`Query: "${testQuery}"`);

  const testEmbedding = await generateEmbedding(testQuery);

  const { data: results, error: searchError } = await supabase.rpc('match_legal_documents', {
    query_embedding: JSON.stringify(testEmbedding),
    match_count: 3,
  });

  if (searchError) {
    console.error('❌ Erreur de recherche:', searchError.message);
  } else if (results && results.length > 0) {
    console.log('\n✓ Résultats:');
    results.forEach((result: any, idx: number) => {
      console.log(`\n  ${idx + 1}. ${result.article_number} - ${result.title}`);
      console.log(`     Similarité: ${(result.similarity * 100).toFixed(2)}%`);
      console.log(`     Type: ${result.type}`);
    });
  } else {
    console.log('❌ Aucun résultat trouvé');
  }

  console.log('\n✅ Script terminé !');
}

// Exécution
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error(error.stack);
    Deno.exit(1);
  }
}
