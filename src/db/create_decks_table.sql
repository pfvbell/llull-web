-- Create decks table
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  review_count INTEGER DEFAULT 0
);

-- Add RLS (Row Level Security) policies
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own decks
CREATE POLICY "Users can view their own decks" ON decks
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own decks
CREATE POLICY "Users can insert their own decks" ON decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own decks
CREATE POLICY "Users can update their own decks" ON decks
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own decks
CREATE POLICY "Users can delete their own decks" ON decks
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS decks_user_id_idx ON decks (user_id);

-- Comment on table and columns for documentation
COMMENT ON TABLE decks IS 'Stores user-created decks for organizing flashcards and concept maps';
COMMENT ON COLUMN decks.id IS 'Unique identifier for each deck';
COMMENT ON COLUMN decks.user_id IS 'Reference to the user who created the deck';
COMMENT ON COLUMN decks.title IS 'Title of the deck';
COMMENT ON COLUMN decks.description IS 'Optional description of the deck';
COMMENT ON COLUMN decks.created_at IS 'When the deck was created';
COMMENT ON COLUMN decks.last_reviewed_at IS 'When the deck was last reviewed';
COMMENT ON COLUMN decks.review_count IS 'Number of times the deck has been reviewed';

-- Add foreign key constraints to flashcards and concept_maps tables
-- First, we need to alter the flashcards table to add the deck_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'flashcards' AND column_name = 'deck_id'
  ) THEN
    ALTER TABLE flashcards ADD COLUMN deck_id UUID REFERENCES decks(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Then, we need to alter the concept_maps table to add the deck_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'concept_maps' AND column_name = 'deck_id'
  ) THEN
    ALTER TABLE concept_maps ADD COLUMN deck_id UUID REFERENCES decks(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Log when the SQL has been run
DO $$ 
BEGIN
  RAISE NOTICE 'Decks table and related constraints created successfully at %', NOW();
END $$; 