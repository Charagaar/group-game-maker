-- Create game_categories table
CREATE TABLE public.game_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  words TEXT[] NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.game_categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read categories
CREATE POLICY "Anyone can view categories"
ON public.game_categories
FOR SELECT
USING (true);

-- Allow authenticated users to update categories
CREATE POLICY "Authenticated users can update categories"
ON public.game_categories
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to insert categories
CREATE POLICY "Authenticated users can insert categories"
ON public.game_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to delete categories
CREATE POLICY "Authenticated users can delete categories"
ON public.game_categories
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_categories_updated_at
BEFORE UPDATE ON public.game_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default game data
INSERT INTO public.game_categories (name, difficulty, words, display_order) VALUES
('TECH GIANTS', 'easy', ARRAY['APPLE', 'GOOGLE', 'AMAZON', 'META'], 1),
('PROGRAMMING LANGUAGES', 'medium', ARRAY['PYTHON', 'JAVA', 'SWIFT', 'RUST'], 2),
('WEB FRAMEWORKS', 'hard', ARRAY['REACT', 'ANGULAR', 'VUE', 'SVELTE'], 3),
('DATABASES', 'expert', ARRAY['POSTGRES', 'MYSQL', 'MONGODB', 'REDIS'], 4);