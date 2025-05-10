import React from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Flashcard } from '@/types/index';
import { GeneratorProps } from '../types';
import { createLogger } from '../utils';

const log = createLogger('FlashcardGenerator');

interface FlashcardGeneratorProps extends GeneratorProps {
  onGenerateFlashcard?: (flashcard: Flashcard) => void;
}

const FlashcardGenerator = ({
  text,
  deckId,
  isGenerating,
  onGenerate,
  onError,
  onGenerateFlashcard
}: FlashcardGeneratorProps) => {
  const router = useRouter();

  const generateFlashcard = async () => {
    try {
      onGenerate(true);
      log('Generating flashcard');
      
      const response = await fetch('/api/generate-flashcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate flashcards');
      }
      
      const data = await response.json();
      
      // Validate the response data
      if (!data || typeof data !== 'object' || !data.flashcards || !Array.isArray(data.flashcards)) {
        throw new Error('Invalid response data from API');
      }
      
      log(`Received ${data.flashcards.length} flashcards from API`, { 
        flashcardCount: data.flashcards.length,
        firstCard: data.flashcards.length > 0 ? {
          title: data.flashcards[0].title,
          front: data.flashcards[0].front.substring(0, 50)
        } : null,
        allTitles: data.flashcards.map((card: any) => card.title)
      });
      
      // Create properly typed Flashcards with UUIDs
      const flashcards: Flashcard[] = data.flashcards.map((card: any) => ({
        id: uuidv4(),
        title: card.title || text.substring(0, 50) || 'Untitled Flashcard',
        description: card.description || '',
        front: card.front || text,
        back: card.back || '',
        tags: card.tags || [],
        difficulty: card.difficulty || 1,
        createdAt: new Date().toISOString(),
        reviewCount: 0,
        deck_id: deckId
      }));
      
      log('Processed flashcards:', { 
        count: flashcards.length, 
        titles: flashcards.map(card => card.title),
        deck_id: deckId 
      });
      
      // If we have only a single flashcard and a single flashcard handler, use it
      // Otherwise, regardless of handler presence, go to batch mode
      if (flashcards.length === 1 && onGenerateFlashcard) {
        log('Using single flashcard handler for one card');
        onGenerateFlashcard(flashcards[0]);
      } else {
        // Always use batch mode for multiple cards (even if handler exists)
        log(`Navigating to batch editor with ${flashcards.length} flashcards`);
        
        // Check for duplicate titles before sending to batch editor
        const uniqueTitles = new Set(flashcards.map(card => card.title)).size;
        const uniqueFronts = new Set(flashcards.map(card => card.front)).size;
        const uniqueBacks = new Set(flashcards.map(card => card.back)).size;
        
        log('Checking flashcard uniqueness before navigation:', {
          totalCards: flashcards.length,
          uniqueTitles,
          uniqueFronts,
          uniqueBacks,
          allUnique: uniqueTitles === flashcards.length
        });
        
        // Ensure each flashcard has a unique title by appending a number if needed
        const uniqueFlashcards = flashcards.map((card, index) => {
          // Count how many cards have this title
          const sameTitle = flashcards.filter(c => c.title === card.title);
          
          // If this is a duplicate title, make it unique
          if (sameTitle.length > 1) {
            const position = sameTitle.findIndex(c => c.id === card.id) + 1;
            return {
              ...card,
              title: `${card.title} (${position})`
            };
          }
          return card;
        });
        
        log('Final flashcards after uniqueness check:', {
          count: uniqueFlashcards.length,
          uniqueTitlesCount: new Set(uniqueFlashcards.map(c => c.title)).size,
          allUnique: new Set(uniqueFlashcards.map(c => c.title)).size === uniqueFlashcards.length,
          titles: uniqueFlashcards.map(c => c.title)
        });
        
        router.push(`/flashcard/create-batch?data=${encodeURIComponent(JSON.stringify(uniqueFlashcards))}`);
      }
      
      return flashcards;
    } catch (err: any) {
      console.error(`Error generating flashcard:`, err);
      onError(err.message || 'Failed to generate flashcard');
      return null;
    } finally {
      onGenerate(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generateFlashcard}
      disabled={isGenerating || !text.trim()}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      Generate Flashcards
    </button>
  );
};

export default FlashcardGenerator; 