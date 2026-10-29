-- Migration: add charges_mensuelles column to contrats table
ALTER TABLE contrats ADD COLUMN IF NOT EXISTS charges_mensuelles BIGINT NOT NULL DEFAULT 0;
