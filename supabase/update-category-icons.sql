-- Atualizar os ícones das categorias para os nomes Lucide profissionais
-- Use este script no Editor SQL do Supabase

UPDATE categories SET icon = 'Laptop' WHERE id = 'technology' OR icon = '💻';
UPDATE categories SET icon = 'Palette' WHERE id = 'design' OR icon = '🎨';
UPDATE categories SET icon = 'TrendingUp' WHERE id = 'marketing' OR icon = '📈';
UPDATE categories SET icon = 'Hammer' WHERE id = 'construction' OR icon = '🏗️';
UPDATE categories SET icon = 'GraduationCap' WHERE id = 'education' OR icon = '📚';
UPDATE categories SET icon = 'Activity' WHERE id = 'health' OR icon = '🧘';
UPDATE categories SET icon = 'Camera' WHERE id = 'photography' OR icon = '📷';
UPDATE categories SET icon = 'Sparkles' WHERE id = 'beauty' OR icon = '💅';
UPDATE categories SET icon = 'Briefcase' WHERE id = 'consulting' OR icon = '💼';
UPDATE categories SET icon = 'Zap' WHERE id = 'other' OR icon = '⚡';
