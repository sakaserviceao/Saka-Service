-- SQL Migration: Agendamento de Resets de Analítica (pg_cron)
-- Execute este script se o seu Supabase tiver a extensão pg_cron habilitada.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Reset Diário (Todo os dias às 00:00)
SELECT cron.schedule('reset-daily-views', '0 0 * * *', $$
  UPDATE public.professionals SET daily_views = 0;
  UPDATE public.site_stats SET daily_visits = 0 WHERE id = 'global';
$$);

-- 2. Reset Mensal (Todo o dia 1 às 00:00)
SELECT cron.schedule('reset-monthly-views', '0 0 1 * *', $$
  UPDATE public.professionals SET monthly_views = 0;
  UPDATE public.site_stats SET monthly_visits = 0 WHERE id = 'global';
$$);

-- 3. Reset Anual (1 de Janeiro às 00:00)
SELECT cron.schedule('reset-yearly-views', '0 0 1 1 *', $$
  UPDATE public.professionals SET yearly_views = 0;
  UPDATE public.site_stats SET yearly_visits = 0 WHERE id = 'global';
$$);
