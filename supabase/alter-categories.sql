-- Script para adicionar o suporte a banners publicitários nas Categorias

-- 1. Adiciona a coluna text 'banner_url' se ela ainda não existir na tabela 'categories'
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS banner_url TEXT;
