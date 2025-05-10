-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  next_review_at TIMESTAMP WITH TIME ZONE,
  review_count INTEGER DEFAULT 0
);

-- Add RLS (Row Level Security) policies
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own flashcards
CREATE POLICY "Users can view their own flashcards" ON flashcards
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own flashcards
CREATE POLICY "Users can insert their own flashcards" ON flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own flashcards
CREATE POLICY "Users can update their own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own flashcards
CREATE POLICY "Users can delete their own flashcards" ON flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS flashcards_user_id_idx ON flashcards (user_id);
CREATE INDEX IF NOT EXISTS flashcards_next_review_at_idx ON flashcards (next_review_at);

-- Comment on table and columns for documentation
COMMENT ON TABLE flashcards IS 'Stores user-created flashcards for the memory bank';
COMMENT ON COLUMN flashcards.id IS 'Unique identifier for each flashcard';
COMMENT ON COLUMN flashcards.user_id IS 'Reference to the user who created the flashcard';
COMMENT ON COLUMN flashcards.title IS 'Title of the flashcard';
COMMENT ON COLUMN flashcards.description IS 'Optional description of the flashcard';
COMMENT ON COLUMN flashcards.content IS 'JSON content of the flashcard, includes front, back, tags, etc.';
COMMENT ON COLUMN flashcards.created_at IS 'When the flashcard was created';
COMMENT ON COLUMN flashcards.last_reviewed_at IS 'When the flashcard was last reviewed';
COMMENT ON COLUMN flashcards.next_review_at IS 'When the flashcard is due for review next';
COMMENT ON COLUMN flashcards.review_count IS 'Number of times the flashcard has been reviewed'; 