alter table public.game_categories
add column if not exists puzzle_fact text not null default '';
