'use client';

import { useState, useEffect } from 'react';
import { Flashcard } from '@/types/index';
import { updateResourceReviewStatus } from '@/lib/review-queue';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[FlashcardReview] ${message}`, data ? data : '');
};

interface FlashcardReviewProps {
  flashcard: Flashcard;
  onComplete: (score: number, total: number, viewingAnswers?: boolean, hintsUsed?: boolean) => void;
}

export default function FlashcardReview({ flashcard, onComplete }: FlashcardReviewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selfRating, setSelfRating] = useState<number | null>(null);
  
  // Log component mounting and flashcard changes
  useEffect(() => {
    log('Component mounted or flashcard changed', { id: flashcard.id, title: flashcard.title });
    
    // Reset state when flashcard changes
    setIsFlipped(false);
    setSelfRating(null);
    
    return () => {
      log('Component unmounting', { id: flashcard.id });
    };
  }, [flashcard.id, flashcard.title]);
  
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    log(`Card ${isFlipped ? 'front' : 'back'} side shown`);
  };
  
  const handleSelfRating = (rating: number) => {
    setSelfRating(rating);
    log(`User self-rated as: ${rating}/3`);
    
    // Calculate score based on self-rating (3 = correct, 2 = partially correct, 1 = incorrect)
    const score = rating === 3 ? 1 : rating === 2 ? 0.5 : 0;
    // We don't call onComplete here as we want to show the confirmation screen first
  };
  
  const handleContinue = async () => {
    if (selfRating === null) return;
    
    // Calculate score based on self-rating
    const score = selfRating === 3 ? 1 : selfRating === 2 ? 0.5 : 0;
    log(`Completing review with score: ${score}/1`);
    
    // Update the review status using the Llull Algorithm
    if (flashcard.id) {
      try {
        log('Updating flashcard review status with Llull Algorithm');
        
        const success = await updateResourceReviewStatus(
          flashcard.id,
          score,
          1,
          'flashcard'
        );
        
        if (success) {
          log('Successfully updated flashcard review status');
        } else {
          log('Failed to update flashcard review status');
        }
      } catch (error) {
        console.error('[FlashcardReview] Error updating review status:', error);
      }
    }
    
    // Call the onComplete callback
    onComplete(score, 1, false, false);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-2">{flashcard.title}</h2>
        {flashcard.description && (
          <p className="text-gray-600 mb-2">{flashcard.description}</p>
        )}
        {flashcard.tags && flashcard.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {flashcard.tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div 
        className={`bg-white rounded-xl shadow-md p-6 h-80 flex items-center justify-center cursor-pointer transition-all duration-500 ${
          isFlipped ? 'bg-blue-50' : ''
        }`}
        onClick={handleFlip}
      >
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            {isFlipped ? 'Back Side (Answer)' : 'Front Side (Question)'}
          </p>
          <div className="text-xl whitespace-pre-wrap">
            {isFlipped ? flashcard.back : flashcard.front}
          </div>
          <p className="mt-4 text-sm text-blue-600">Click to flip card</p>
        </div>
      </div>
      
      {isFlipped && !selfRating && (
        <div className="mt-8 text-center">
          <p className="mb-4 font-medium">How well did you know this?</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleSelfRating(1)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              Didn't Know
            </button>
            <button
              onClick={() => handleSelfRating(2)}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
            >
              Partially Knew
            </button>
            <button
              onClick={() => handleSelfRating(3)}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
            >
              Knew It
            </button>
          </div>
        </div>
      )}
      
      {selfRating && (
        <div className="mt-8 text-center">
          <p className="text-green-600 font-medium mb-4">Response recorded!</p>
          <button
            onClick={handleContinue}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
} 