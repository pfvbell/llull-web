'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flashcard } from '@/types/index';
import FlashcardEditor from '@/components/FlashcardEditor';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[CreateFlashcardBatch] ${message}`, data ? data : '');
};

export default function CreateFlashcardBatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{success: number, failed: number}>({success: 0, failed: 0});
  
  // State for debug mode
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  useEffect(() => {
    // Check if we have flashcard data in the URL
    loadFlashcardsFromURL();
  }, [searchParams]);
  
  // Function to reload flashcards from URL
  const loadFlashcardsFromURL = () => {
    const flashcardData = searchParams.get('data');
    if (flashcardData) {
      try {
        log('Raw flashcard data from URL (first 100 chars):', flashcardData.substring(0, 100) + '...');
        
        // Try to decode the URL parameter first, then parse it
        const decodedData = decodeURIComponent(flashcardData);
        log('Decoded data length:', decodedData.length);
        
        const parsedData = JSON.parse(decodedData);
        log('Found flashcard data in URL', { 
          count: Array.isArray(parsedData) ? parsedData.length : 1,
          isArray: Array.isArray(parsedData),
          titles: Array.isArray(parsedData) ? parsedData.map((card: any) => card.title) : [parsedData.title],
          // Log the first few characters of each card's front content
          frontPreviews: Array.isArray(parsedData) 
            ? parsedData.map((card: any) => card.front.substring(0, 30) + '...') 
            : [parsedData.front.substring(0, 30) + '...']
        });
        
        const processedFlashcards = Array.isArray(parsedData) ? parsedData : [parsedData];
        
        // Check for duplicate titles - this will help diagnose the issue
        const titleCounts = processedFlashcards.reduce((acc: Record<string, number>, card: any) => {
          acc[card.title] = (acc[card.title] || 0) + 1;
          return acc;
        }, {});
        
        const duplicateTitles = Object.entries(titleCounts)
          .filter(([_, count]) => (count as number) > 1)
          .map(([title]) => title);
        
        // Also check for duplicate fronts and backs
        const frontCounts = processedFlashcards.reduce((acc: Record<string, number>, card: any) => {
          acc[card.front] = (acc[card.front] || 0) + 1;
          return acc;
        }, {});
        
        const duplicateFronts = Object.entries(frontCounts)
          .filter(([_, count]) => (count as number) > 1)
          .map(([front]) => front.substring(0, 30) + '...');
        
        log('Processed flashcards for display', {
          count: processedFlashcards.length,
          firstCard: processedFlashcards[0]?.title,
          allDistinct: new Set(processedFlashcards.map((c: any) => c.title)).size === processedFlashcards.length,
          duplicateTitles: duplicateTitles.length > 0 ? duplicateTitles : 'none',
          duplicateFronts: duplicateFronts.length > 0 ? duplicateFronts : 'none'
        });
        
        // Ensure we have unique IDs for each flashcard
        const uniqueFlashcards = processedFlashcards.map((card: any, index: number) => {
          // If we somehow got duplicate IDs, regenerate them
          if (processedFlashcards.filter((c: any) => c.id === card.id).length > 1) {
            log('Found duplicate ID, regenerating', { 
              duplicateId: card.id,
              title: card.title,
              index
            });
            return { ...card, id: uuidv4() };
          }
          return card;
        });
        
        // Final check for uniqueness
        const finalUniqueCount = new Set(uniqueFlashcards.map(c => c.title)).size;
        log('Final flashcard set', {
          count: uniqueFlashcards.length,
          uniqueTitlesCount: finalUniqueCount,
          allUnique: finalUniqueCount === uniqueFlashcards.length
        });
        
        setFlashcards(uniqueFlashcards);
        setCurrentIndex(0); // Reset to first card when reloading
      } catch (err) {
        console.error('Error parsing flashcard data from URL:', err);
        log('Error details:', { 
          message: (err as Error).message,
          stack: (err as Error).stack
        });
      }
    } else {
      log('No flashcard data found in URL');
    }
  };
  
  const handleSave = async (updatedFlashcard: Flashcard) => {
    // Update the current flashcard in our array
    const updatedFlashcards = [...flashcards];
    updatedFlashcards[currentIndex] = updatedFlashcard;
    
    log('Flashcard updated', { 
      index: currentIndex, 
      id: updatedFlashcard.id,
      title: updatedFlashcard.title,
      front: updatedFlashcard.front.substring(0, 30) + '...',
      totalCards: updatedFlashcards.length,
      allTitles: updatedFlashcards.map(card => card.title)
    });
    
    setFlashcards(updatedFlashcards);
    
    // Move to the next flashcard if available
    if (currentIndex < flashcards.length - 1) {
      const nextIndex = currentIndex + 1;
      log('Moving to next flashcard', { 
        from: currentIndex, 
        to: nextIndex,
        nextCardTitle: flashcards[nextIndex]?.title 
      });
      setCurrentIndex(nextIndex);
    } else {
      // We've reached the end, save all flashcards
      log('Reached last flashcard, saving all', { 
        totalToSave: updatedFlashcards.length,
        allIds: updatedFlashcards.map(card => card.id)
      });
      await saveAllFlashcards(updatedFlashcards);
    }
  };
  
  const saveAllFlashcards = async (cardsToSave: Flashcard[]) => {
    setIsSaving(true);
    log('Saving all flashcards', { count: cardsToSave.length });
    
    let successCount = 0;
    let failedCount = 0;
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Failed to get current user: ' + userError.message);
      }
      
      // Save each flashcard
      for (const card of cardsToSave) {
        try {
          const { error: dbError } = await supabase
            .from('flashcards')
            .upsert({
              id: card.id,
              user_id: user?.id,
              title: card.title,
              description: card.description,
              content: {
                front: card.front,
                back: card.back,
                tags: card.tags,
                difficulty: card.difficulty
              },
              deck_id: card.deck_id,
              created_at: card.createdAt,
              last_reviewed_at: card.lastReviewedAt,
              next_review_at: card.nextReviewAt,
              review_count: card.reviewCount || 0
            });
          
          if (dbError) throw dbError;
          successCount++;
          log('Saved flashcard successfully', { id: card.id });
        } catch (err) {
          failedCount++;
          console.error('Error saving flashcard:', err);
        }
      }
      
      setSaveStatus({ success: successCount, failed: failedCount });
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error in batch save process:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    log('Create flashcard batch cancelled');
    router.push('/dashboard');
  };
  
  const handleSkip = () => {
    if (currentIndex < flashcards.length - 1) {
      const nextIndex = currentIndex + 1;
      log('Skipping to next flashcard', { 
        from: currentIndex, 
        to: nextIndex,
        currentCardTitle: flashcards[currentIndex]?.title,
        nextCardTitle: flashcards[nextIndex]?.title
      });
      setCurrentIndex(nextIndex);
    }
  };
  
  const currentFlashcard = flashcards[currentIndex];
  
  // Add log when current card changes
  useEffect(() => {
    if (currentFlashcard) {
      log('Current flashcard changed', { 
        index: currentIndex, 
        id: currentFlashcard.id,
        title: currentFlashcard.title,
        front: currentFlashcard.front.substring(0, 30) + '...',
        back: currentFlashcard.back.substring(0, 30) + '...',
        deck_id: currentFlashcard.deck_id
      });
      
      // Log all flashcards to see if they're unique
      log('All flashcards in batch', {
        count: flashcards.length,
        cards: flashcards.map(card => ({
          id: card.id,
          title: card.title,
          frontPreview: card.front.substring(0, 20) + '...'
        }))
      });
    }
  }, [currentIndex, currentFlashcard]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Create Flashcards</h1>
      
      {flashcards.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">
              Flashcard {currentIndex + 1} of {flashcards.length}
            </div>
            
            <div className="flex gap-2">
              {/* Toggle debug info button */}
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className={`px-3 py-1 text-xs ${showDebugInfo ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-md hover:opacity-90 flex items-center`}
                title="Show debug information"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Debug
              </button>
              
              {/* Reset button */}
              <button
                onClick={loadFlashcardsFromURL}
                className="px-3 py-1 text-xs bg-gray-200 rounded-md hover:bg-gray-300 flex items-center"
                title="Reset flashcards from URL data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
              
              {isSaving ? (
                <div className="text-blue-600">
                  Saving flashcards... ({saveStatus.success} saved, {saveStatus.failed} failed)
                </div>
              ) : currentIndex < flashcards.length - 1 ? (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Skip to Next
                </button>
              ) : null}
            </div>
          </div>
          
          {/* Add a progress bar to show position in the batch */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            ></div>
          </div>
          
          {/* Add a preview of all flashcards in the batch */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {flashcards.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full 
                  ${idx === currentIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} 
                  ${idx < currentIndex ? 'ring-2 ring-green-500' : ''}`}
                title={card.title}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          
          {/* Display current card info */}
          <div className="text-sm text-gray-700 mb-2">
            <strong>Current Flashcard:</strong> {currentFlashcard?.title}
          </div>
          
          {/* Debug information panel */}
          {showDebugInfo && (
            <div className="mt-4 p-4 border border-gray-300 rounded-md bg-gray-50 mb-6 overflow-auto max-h-60">
              <h3 className="font-bold mb-2 text-gray-700">Debug Information</h3>
              <p className="text-xs mb-2">
                Total Cards: {flashcards.length} | 
                Unique Titles: {new Set(flashcards.map(f => f.title)).size} | 
                Current Index: {currentIndex}
              </p>
              <div className="text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 text-left">Index</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">ID</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Title</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Front (preview)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flashcards.map((card, idx) => (
                      <tr key={card.id} className={idx === currentIndex ? 'bg-blue-100' : ''}>
                        <td className="border border-gray-300 px-2 py-1">{idx}</td>
                        <td className="border border-gray-300 px-2 py-1">{card.id.substring(0, 8)}...</td>
                        <td className="border border-gray-300 px-2 py-1">{card.title}</td>
                        <td className="border border-gray-300 px-2 py-1">{card.front.substring(0, 40)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {currentFlashcard ? (
        <FlashcardEditor 
          initialFlashcard={currentFlashcard} 
          onSave={handleSave} 
          onCancel={handleCancel}
          saveButtonText={currentIndex < flashcards.length - 1 ? "Save & Continue" : "Save All Flashcards"}
        />
      ) : (
        <div className="bg-yellow-100 p-4 rounded-md">
          No flashcard data found. Please go back and generate flashcards.
        </div>
      )}
    </div>
  );
} 