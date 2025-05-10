'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flashcard } from '@/types/index';
import { supabase } from '@/lib/supabase';
import FlashcardReview from '@/components/FlashcardReview';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[FlashcardReviewPage] ${message}`, data ? data : '');
};

export default function FlashcardReviewPage() {
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    async function loadFlashcard() {
      try {
        if (!id) {
          setError('No flashcard ID provided');
          setLoading(false);
          return;
        }
        
        log('Loading flashcard with ID:', id);
        
        const { data, error } = await supabase
          .from('flashcards')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          setError('Flashcard not found');
          setLoading(false);
          return;
        }
        
        log('Received flashcard data from database');
        
        // Transform the data to match our Flashcard type
        const content = data.content || {};
        
        const flashcardData: Flashcard = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          front: content.front || '',
          back: content.back || '',
          tags: content.tags || [],
          difficulty: content.difficulty || 1,
          createdAt: data.created_at,
          lastReviewedAt: data.last_reviewed_at,
          nextReviewAt: data.next_review_at,
          reviewCount: data.review_count || 0
        };
        
        setFlashcard(flashcardData);
      } catch (error: any) {
        console.error('Error loading flashcard:', error);
        setError('Failed to load flashcard: ' + (error.message || error));
      } finally {
        setLoading(false);
      }
    }
    
    loadFlashcard();
  }, [id]);

  const handleReviewComplete = async (reviewScore: number, total: number) => {
    if (!flashcard) return;
    
    try {
      log(`Review completed with score ${reviewScore}/${total}`);
      setScore(reviewScore);
      
      // Calculate next review date based on performance
      const performance = reviewScore / total;
      const nextReviewDate = new Date();
      
      if (performance >= 0.9) {
        // ≥90% correct: 7 days
        nextReviewDate.setDate(nextReviewDate.getDate() + 7);
        log('Performance ≥90%, next review in 7 days');
      } else if (performance >= 0.7) {
        // ≥70% correct: 3 days
        nextReviewDate.setDate(nextReviewDate.getDate() + 3);
        log('Performance ≥70%, next review in 3 days');
      } else {
        // <70% correct: 1 day
        nextReviewDate.setDate(nextReviewDate.getDate() + 1);
        log('Performance <70%, next review in 1 day');
      }
      
      // Update the review status in the database
      const { error } = await supabase
        .from('flashcards')
        .update({
          last_reviewed_at: new Date().toISOString(),
          next_review_at: nextReviewDate.toISOString(),
          review_count: (flashcard.reviewCount || 0) + 1
        })
        .eq('id', flashcard.id);
        
      if (error) throw error;
      
      log('Flashcard review status updated in database');
      setReviewComplete(true);
    } catch (error: any) {
      console.error('Error updating review status:', error);
      alert('Error updating review status: ' + (error.message || error));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !flashcard) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-6">{error || 'Failed to load flashcard'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Memory Bank
        </button>
      </div>
    );
  }

  if (reviewComplete) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Review Complete</h1>
          
          <div className="mb-6">
            <div className="inline-block bg-gray-50 rounded-full p-6 mb-4">
              <div className="text-4xl font-bold text-blue-600">
                {score === 1 ? '100%' : score === 0.5 ? '50%' : '0%'}
              </div>
            </div>
            <p className="text-gray-600">
              {score === 1 
                ? 'Great job! You knew this card well.'
                : score === 0.5 
                ? 'You partially knew this card. Keep practicing!'
                : 'You need more practice with this card.'}
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Link
              href={`/flashcard/${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Flashcard
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Return to Memory Bank
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Review: {flashcard.title}</h1>
        <Link
          href="/dashboard"
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          Exit Review
        </Link>
      </div>
      
      <FlashcardReview 
        flashcard={flashcard} 
        onComplete={handleReviewComplete} 
      />
    </div>
  );
} 