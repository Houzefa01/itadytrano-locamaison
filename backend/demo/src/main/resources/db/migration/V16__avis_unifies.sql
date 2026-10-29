-- Fusion avis / commentaires : note optionnelle + réponses (fil de discussion)
ALTER TABLE public.avis ALTER COLUMN note DROP NOT NULL;
ALTER TABLE public.avis ADD COLUMN IF NOT EXISTS parent_id bigint;
ALTER TABLE public.avis ADD CONSTRAINT fk_avis_parent
    FOREIGN KEY (parent_id) REFERENCES public.avis (id) ON DELETE CASCADE;
