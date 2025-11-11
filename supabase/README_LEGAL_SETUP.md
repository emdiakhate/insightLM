# 🏛️ Configuration de la Base Juridique Sénégalaise

Ce guide explique comment configurer la base de connaissances juridiques pour LexAI Sénégal.

## 📋 Prérequis

- Compte Supabase avec projet configuré
- Clé API OpenAI (pour embeddings)
- Clé API Anthropic Claude (pour génération réponses)
- Deno installé localement (https://deno.land/)

## 🚀 Installation

### 1. Appliquer la Migration SQL

```bash
# Via CLI Supabase
supabase db push

# Ou directement dans le Dashboard Supabase -> SQL Editor
# Copier-coller le contenu de: supabase/migrations/20250111000000_add_legal_knowledge_base.sql
```

Cette migration crée :
- Table `legal_knowledge_base` (50 articles de lois)
- Table `legal_article_usage_stats` (analytics)
- Fonctions PostgreSQL : `match_legal_documents()`, `find_article_by_number()`
- Index vectoriel HNSW pour recherche rapide

### 2. Configurer les Variables d'Environnement

Dans Supabase Dashboard → Settings → Secrets, ajouter :

```bash
# OpenAI (pour embeddings)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Anthropic (pour Claude)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### 3. Importer les Données Juridiques

```bash
cd supabase

# Définir les variables localement
export SUPABASE_URL="https://qvbrsumfwifsixlqqtho.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="votre_service_role_key"
export OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxx"

# Exécuter le script d'import
deno run --allow-net --allow-read --allow-env seed-legal-data.ts
```

**Durée estimée** : ~2-3 minutes (50 articles × 1.5s pause)

**Coût estimé** : ~$0.02 (50 embeddings × text-embedding-3-small)

### 4. Déployer l'Edge Function Juridique

```bash
# Déployer la nouvelle Edge Function
supabase functions deploy send-legal-chat-message
```

## 📊 Vérification

### Test SQL Direct

```sql
-- Compter les articles importés
SELECT COUNT(*), type
FROM legal_knowledge_base
GROUP BY type
ORDER BY COUNT(*) DESC;

-- Test de recherche vectorielle
SELECT
  article_number,
  title,
  type,
  1 - (embedding <=> '[votre_embedding]'::vector) as similarity
FROM legal_knowledge_base
ORDER BY similarity DESC
LIMIT 5;
```

### Test Edge Function

```bash
curl -X POST https://qvbrsumfwifsixlqqtho.supabase.co/functions/v1/send-legal-chat-message \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-notebook-id",
    "message": "Quelle est la peine pour vol simple au Sénégal ?",
    "user_id": "test-user-id"
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "type": "ai",
    "content": {
      "segments": [{
        "text": "**📋 RÉSUMÉ JURIDIQUE**\nLe vol simple au Sénégal est sanctionné par une peine d'emprisonnement...\n\n**⚖️ BASE LÉGALE**\n[Art. 379 du Code Pénal sénégalais]..."
      }],
      "citations": [
        {
          "citation_id": 1,
          "source_title": "Art. 379 - Vol simple",
          "source_type": "legal_code",
          "excerpt": "Quiconque soustrait frauduleusement..."
        }
      ]
    }
  }
}
```

## 📁 Structure des Fichiers

```
supabase/
├── migrations/
│   └── 20250111000000_add_legal_knowledge_base.sql  # Migration DB
├── functions/
│   ├── send-chat-message/                           # EXISTANT (N8N)
│   │   └── index.ts
│   └── send-legal-chat-message/                     # NOUVEAU (Juridique)
│       └── index.ts
├── seed_legal_data.json                              # 50 articles de lois
├── seed-legal-data.ts                                # Script d'import
└── README_LEGAL_SETUP.md                             # Ce fichier
```

## 🔄 Workflow de Développement

### Mode POC (Actuel)

```
Frontend → send-legal-chat-message → Claude → Réponse
              ↓
         Recherche hybride:
         - legal_knowledge_base (base juridique)
         - documents (docs dossier)
```

### Mode Production (Plus tard)

```
Frontend → send-chat-message → N8N Workflow → Claude → Réponse
                                   ↓
                              Recherche hybride
                              + Caching
                              + Analytics
```

## 🛠️ Maintenance

### Ajouter de Nouveaux Articles

1. Éditer `seed_legal_data.json`
2. Ajouter nouvel article :

```json
{
  "type": "code_penal",
  "article_number": "Art. 400",
  "title": "Votre titre",
  "content": "Contenu complet de l'article...",
  "summary": "Résumé court",
  "metadata": {
    "source": "Code Pénal sénégalais",
    "date_publication": "1965-07-21"
  }
}
```

3. Relancer l'import :

```bash
deno run --allow-net --allow-read --allow-env seed-legal-data.ts
```

### Mettre à Jour un Article

```sql
UPDATE legal_knowledge_base
SET
  content = 'Nouveau contenu...',
  embedding = NULL, -- Sera regénéré
  updated_at = NOW()
WHERE article_number = 'Art. 379';
```

Puis régénérer l'embedding avec le script.

## 🐛 Troubleshooting

### Erreur "Webhook responded with status: 404"

**Cause** : Frontend appelle encore l'ancienne Edge Function

**Solution** : Modifier le frontend pour utiliser `send-legal-chat-message`

### Erreur "OPENAI_API_KEY manquante"

**Cause** : Variable d'environnement non configurée

**Solution** :
```bash
# Ajouter dans Supabase Dashboard → Secrets
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

### Erreur "No embeddings found"

**Cause** : Données pas importées ou embeddings NULL

**Solution** :
```sql
-- Vérifier
SELECT COUNT(*) FROM legal_knowledge_base WHERE embedding IS NOT NULL;

-- Si 0, relancer l'import
```

### Performance lente

**Cause** : Index vectoriel pas créé

**Solution** :
```sql
-- Vérifier les index
\d legal_knowledge_base

-- Recréer si nécessaire
CREATE INDEX idx_legal_kb_embedding ON legal_knowledge_base
USING hnsw (embedding vector_cosine_ops);
```

## 📈 Analytics

### Articles les Plus Utilisés

```sql
SELECT
  lkb.article_number,
  lkb.title,
  COUNT(*) as usage_count
FROM legal_article_usage_stats laus
JOIN legal_knowledge_base lkb ON laus.article_id = lkb.id
WHERE laus.created_at > NOW() - INTERVAL '30 days'
GROUP BY lkb.id, lkb.article_number, lkb.title
ORDER BY usage_count DESC
LIMIT 10;
```

### Taux de Couverture par Domaine

```sql
SELECT
  type,
  COUNT(*) as article_count,
  COUNT(*) FILTER (WHERE is_frequently_used) as frequently_used
FROM legal_knowledge_base
WHERE is_active = true
GROUP BY type
ORDER BY article_count DESC;
```

## 🎯 Prochaines Étapes

- [ ] Ajouter 50 articles supplémentaires (objectif: 100 total)
- [ ] Créer workflow N8N pour production
- [ ] Implémenter caching des recherches fréquentes
- [ ] Ajouter jurisprudence sénégalaise
- [ ] Intégrer textes OHADA complets
- [ ] Dashboard analytics en temps réel

## 📞 Support

Pour toute question :
- Documentation Supabase : https://supabase.com/docs
- Documentation OpenAI Embeddings : https://platform.openai.com/docs/guides/embeddings
- Documentation Anthropic Claude : https://docs.anthropic.com/

---

**Version** : POC v1.0
**Date** : 11 Janvier 2025
**Auteur** : LexAI Team
