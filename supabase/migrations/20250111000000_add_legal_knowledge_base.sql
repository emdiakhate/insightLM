-- ============================================================================
-- MIGRATION: Ajout de la base de connaissances juridiques sénégalaises
-- Date: 2025-01-11
-- Description: Création de la table legal_knowledge_base pour stocker
--              les codes, lois et procédures du droit sénégalais
-- ============================================================================

-- Créer le type enum pour les catégories juridiques
DO $$ BEGIN
    CREATE TYPE legal_document_type AS ENUM (
        'code_penal',
        'code_civil',
        'code_procedure_penale',
        'code_procedure_civile',
        'code_travail',
        'code_commerce',
        'code_famille',
        'ohada',
        'jurisprudence',
        'loi',
        'decret',
        'arrete'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table principale de la base juridique
CREATE TABLE IF NOT EXISTS public.legal_knowledge_base (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Classification
    type legal_document_type NOT NULL,
    jurisdiction text DEFAULT 'senegal',

    -- Identification
    article_number text, -- Ex: "Art. 379", "Art. L.123-1"
    title text NOT NULL,

    -- Contenu
    content text NOT NULL,
    summary text, -- Résumé court pour affichage

    -- Métadonnées
    metadata jsonb DEFAULT '{}'::jsonb, -- {source, date_publication, version, references}

    -- Recherche vectorielle
    embedding vector(1536),

    -- Statut
    is_active boolean DEFAULT true,
    is_frequently_used boolean DEFAULT false, -- Pour prioriser les articles populaires

    -- Timestamps
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- INDEXES pour performance
-- ============================================================================

-- Index sur le type de document
CREATE INDEX IF NOT EXISTS idx_legal_kb_type
ON public.legal_knowledge_base(type);

-- Index sur la juridiction
CREATE INDEX IF NOT EXISTS idx_legal_kb_jurisdiction
ON public.legal_knowledge_base(jurisdiction);

-- Index sur les articles actifs
CREATE INDEX IF NOT EXISTS idx_legal_kb_active
ON public.legal_knowledge_base(is_active)
WHERE is_active = true;

-- Index sur les articles fréquents
CREATE INDEX IF NOT EXISTS idx_legal_kb_frequent
ON public.legal_knowledge_base(is_frequently_used)
WHERE is_frequently_used = true;

-- Index pour recherche full-text sur le numéro d'article
CREATE INDEX IF NOT EXISTS idx_legal_kb_article_number_text
ON public.legal_knowledge_base USING gin(to_tsvector('french', article_number));

-- Index pour recherche full-text sur le titre
CREATE INDEX IF NOT EXISTS idx_legal_kb_title_text
ON public.legal_knowledge_base USING gin(to_tsvector('french', title));

-- Index vectoriel HNSW pour recherche de similarité (le plus important!)
CREATE INDEX IF NOT EXISTS idx_legal_kb_embedding
ON public.legal_knowledge_base
USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- FONCTION: Recherche dans la base juridique
-- ============================================================================

CREATE OR REPLACE FUNCTION public.match_legal_documents(
    query_embedding vector(1536),
    match_count integer DEFAULT 5,
    filter_type legal_document_type DEFAULT NULL,
    filter_jurisdiction text DEFAULT 'senegal'
)
RETURNS TABLE(
    id uuid,
    type legal_document_type,
    article_number text,
    title text,
    content text,
    summary text,
    metadata jsonb,
    similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        lkb.id,
        lkb.type,
        lkb.article_number,
        lkb.title,
        lkb.content,
        lkb.summary,
        lkb.metadata,
        1 - (lkb.embedding <=> query_embedding) as similarity
    FROM public.legal_knowledge_base lkb
    WHERE
        lkb.is_active = true
        AND lkb.jurisdiction = filter_jurisdiction
        AND (filter_type IS NULL OR lkb.type = filter_type)
    ORDER BY lkb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================================================
-- FONCTION: Recherche par numéro d'article (exact match)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.find_article_by_number(
    article_num text,
    doc_type legal_document_type DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    type legal_document_type,
    article_number text,
    title text,
    content text,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        lkb.id,
        lkb.type,
        lkb.article_number,
        lkb.title,
        lkb.content,
        lkb.metadata
    FROM public.legal_knowledge_base lkb
    WHERE
        lkb.is_active = true
        AND lkb.article_number ILIKE '%' || article_num || '%'
        AND (doc_type IS NULL OR lkb.type = doc_type)
    ORDER BY lkb.type, lkb.article_number
    LIMIT 10;
END;
$$;

-- ============================================================================
-- TRIGGER: Mise à jour automatique du timestamp
-- ============================================================================

CREATE TRIGGER update_legal_kb_updated_at
    BEFORE UPDATE ON public.legal_knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur la table
ALTER TABLE public.legal_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Politique: Tous les utilisateurs authentifiés peuvent lire la base juridique
DROP POLICY IF EXISTS "Authenticated users can view legal knowledge base"
ON public.legal_knowledge_base;

CREATE POLICY "Authenticated users can view legal knowledge base"
    ON public.legal_knowledge_base FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique: Seul le service role peut insérer/modifier (pour l'administration)
DROP POLICY IF EXISTS "Service role can manage legal knowledge base"
ON public.legal_knowledge_base;

CREATE POLICY "Service role can manage legal knowledge base"
    ON public.legal_knowledge_base FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- TABLE: Statistiques d'utilisation des articles (pour analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.legal_article_usage_stats (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id uuid REFERENCES public.legal_knowledge_base(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    notebook_id uuid REFERENCES public.notebooks(id) ON DELETE CASCADE,

    action_type text NOT NULL, -- 'viewed', 'cited', 'used_in_template'

    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour les statistiques
CREATE INDEX IF NOT EXISTS idx_legal_stats_article
ON public.legal_article_usage_stats(article_id);

CREATE INDEX IF NOT EXISTS idx_legal_stats_user
ON public.legal_article_usage_stats(user_id);

-- RLS pour les stats
ALTER TABLE public.legal_article_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage stats"
    ON public.legal_article_usage_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own usage stats"
    ON public.legal_article_usage_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMMENTAIRES pour documentation
-- ============================================================================

COMMENT ON TABLE public.legal_knowledge_base IS
'Base de connaissances juridiques sénégalaises: codes, lois, jurisprudence';

COMMENT ON COLUMN public.legal_knowledge_base.type IS
'Type de document juridique (code_penal, code_civil, etc.)';

COMMENT ON COLUMN public.legal_knowledge_base.article_number IS
'Numéro ou référence de l''article (ex: Art. 379)';

COMMENT ON COLUMN public.legal_knowledge_base.embedding IS
'Vecteur d''embedding (1536 dimensions) pour recherche sémantique';

COMMENT ON FUNCTION public.match_legal_documents IS
'Recherche par similarité vectorielle dans la base juridique';

COMMENT ON FUNCTION public.find_article_by_number IS
'Recherche exacte d''un article par son numéro';
