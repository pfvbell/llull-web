'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Storyboard } from '@/types/index';
import { supabase } from '@/lib/supabase';
import StoryboardReview from '@/components/StoryboardReview';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[StoryboardReviewPage] ${message}`, data ? data : '');
};

export default function StoryboardReviewPage() {
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [totalPossible, setTotalPossible] = useState<number | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    async function loadStoryboard() {
      try {
        if (!id) {
          setError('No storyboard ID provided');
          setLoading(false);
          return;
        }
        
        log('Loading storyboard with ID:', id);
        
        const { data, error } = await supabase
          .from('storyboards')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          setError('Storyboard not found');
          setLoading(false);
          return;
        }
        
        log('Received storyboard data from database');
        
        // Parse the content from JSON
        const content = typeof data.content === 'string' 
          ? JSON.parse(data.content) 
          : data.content || {};
        
        const storyboardData: Storyboard = {
          id: data.id,
          title: data.title,
          description: content.description || '',
          scenes: content.scenes || [],
          createdAt: data.created_at,
          lastReviewedAt: data.last_reviewed_at,
          nextReviewAt: data.next_review_at,
          reviewCount: data.review_count || 0,
          deck_id: data.deck_id
        };
        
        log(`Storyboard has ${storyboardData.scenes.length} scenes`);
        setStoryboard(storyboardData);
      } catch (error: any) {
        console.error('Error loading storyboard:', error);
        setError('Failed to load storyboard: ' + (error.message || error));
      } finally {
        setLoading(false);
      }
    }
    
    loadStoryboard();
  }, [id]);

  const handleReviewComplete = async (reviewScore: number, total: number) => {
    if (!storyboard) return;
    
    try {
      log(`Review completed with score ${reviewScore}/${total}`);
      setScore(reviewScore);
      setTotalPossible(total);
      
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
        .from('storyboards')
        .update({
          last_reviewed_at: new Date().toISOString(),
          next_review_at: nextReviewDate.toISOString(),
          review_count: (storyboard.reviewCount || 0) + 1
        })
        .eq('id', storyboard.id);
        
      if (error) throw error;
      
      log('Storyboard review status updated in database');
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

  if (error || !storyboard) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-6">{error || 'Failed to load storyboard'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Memory Bank
        </button>
      </div>
    );
  }
  
  if (storyboard.scenes.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No Scenes to Review</h1>
        <p className="mb-6">This storyboard doesn't contain any scenes to review.</p>
        <div className="flex justify-center space-x-4">
          <Link
            href={`/storyboard/${id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Storyboard
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Return to Memory Bank
          </Link>
        </div>
      </div>
    );
  }

  if (reviewComplete) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Memory Tiles Complete!</h1>
          
          <div className="mb-6">
            <div className="inline-block bg-gray-50 rounded-full p-6 mb-4">
              <div className="text-4xl font-bold text-blue-600">
                {score && totalPossible
                  ? `${Math.round((score / totalPossible) * 100)}%`
                  : '0%'}
              </div>
            </div>
            <p className="text-gray-600">
              {score && totalPossible && score / totalPossible >= 0.9
                ? 'Excellent memory! You matched almost all tiles correctly.'
                : score && totalPossible && score / totalPossible >= 0.7
                ? 'Good work! You remembered most of the connections.'
                : 'Keep practicing to build stronger visual memory connections.'}
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Link
              href={`/storyboard/${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Storyboard
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
        <h1 className="text-2xl font-bold">Memory Tiles: {storyboard.title}</h1>
        <Link
          href="/dashboard"
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          Exit Review
        </Link>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6 text-blue-800">
        <p className="font-medium mb-2">How to play:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Drag each icon to what you think is its matching empty tile</li>
          <li>When you place an icon correctly, the title and description will be revealed</li>
          <li>Try to match all icons to complete the storyboard from memory</li>
        </ol>
      </div>
      
      <StoryboardReview 
        storyboard={storyboard} 
        onComplete={handleReviewComplete} 
      />
    </div>
  );
} 