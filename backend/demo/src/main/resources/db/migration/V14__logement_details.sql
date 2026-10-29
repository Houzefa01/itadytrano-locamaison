-- Caractéristiques détaillées des logements (cahier des charges §3)
ALTER TABLE public.logements
    ADD COLUMN IF NOT EXISTS nbr_chambres integer,
    ADD COLUMN IF NOT EXISTS wc           boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS caution      numeric(38,2),
    ADD COLUMN IF NOT EXISTS avance       numeric(38,2),
    ADD COLUMN IF NOT EXISTS video_url    varchar(255),
    ADD COLUMN IF NOT EXISTS eau_distance varchar(100);
