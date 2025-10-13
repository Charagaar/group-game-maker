-- Update RLS policies to allow public access since we're using simple password auth
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.game_categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.game_categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.game_categories;

-- Create new policies that allow anyone to modify
CREATE POLICY "Anyone can insert categories" 
ON public.game_categories 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update categories" 
ON public.game_categories 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete categories" 
ON public.game_categories 
FOR DELETE 
USING (true);