'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MultipleChoiceQuestion } from '@/types/index';
import { supabase } from '@/lib/supabase';
import MultipleChoiceReview from '@/components/MultipleChoiceReview';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[MultipleChoiceReviewPage] ${message}`, data ? data : '');
};

export default function MultipleChoiceReviewPage() {
  const [question, setQuestion] = useState<MultipleChoiceQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    async function loadQuestion() {
      try {
        if (!id) {
          setError('No question ID provided');
          setLoading(false);
          return;
        }
        
        log('Loading multiple choice question with ID:', id);
        
        const { data, error } = await supabase
          .from('multiple_choice_questions')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          setError('Question not found');
          setLoading(false);
          return;
        }
        
        log('Received question data from database');
        
        // Transform the data to match our MultipleChoiceQuestion type
        const content = data.content || {};
        
        const questionData: MultipleChoiceQuestion = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          question: content.question || '',
          options: content.options || ['Option A', 'Option B', 'Option C'],
          correctOptionIndex: content.correctOptionIndex || 0,
          explanation: content.explanation || '',
          tags: content.tags || [],
          difficulty: content.difficulty || 1,
          createdAt: data.created_at,
          lastReviewedAt: data.last_reviewed_at,
          nextReviewAt: data.next_review_at,
          reviewCount: data.review_count || 0,
          deck_id: data.deck_id
        };
        
        setQuestion(questionData);
      } catch (error: any) {
        console.error('Error loading question:', error);
        setError('Failed to load question: ' + (error.message || error));
      } finally {
        setLoading(false);
      }
    }
    
    loadQuestion();
  }, [id]);

  const handleReviewComplete = async (reviewScore: number, total: number) => {
    if (!question) return;
    
    try {
      log(`Review completed with score ${reviewScore}/${total}`);
      setScore(reviewScore);
      
      // Calculate next review date based on performance
      const nextReviewDate = new Date();
      
      if (reviewScore === 1) {
        // Correct: 7 days
        nextReviewDate.setDate(nextReviewDate.getDate() + 7);
        log('Answer correct, next review in 7 days');
      } else {
        // Incorrect: 1 day
        nextReviewDate.setDate(nextReviewDate.getDate() + 1);
        log('Answer incorrect, next review in 1 day');
      }
      
      // Update the review status in the database
      const { error } = await supabase
        .from('multiple_choice_questions')
        .update({
          last_reviewed_at: new Date().toISOString(),
          next_review_at: nextReviewDate.toISOString(),
          review_count: (question.reviewCount || 0) + 1
        })
        .eq('id', question.id);
        
      if (error) throw error;
      
      log('Question review status updated in database');
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

  if (error || !question) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-6">{error || 'Failed to load question'}</p>
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
                {score === 1 ? '100%' : '0%'}
              </div>
            </div>
            <p className="text-gray-600">
              {score === 1 
                ? 'Great job! You answered correctly.'
                : 'You answered incorrectly. Keep practicing!'}
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Link
              href={`/multiple-choice/${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Question
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
        <h1 className="text-2xl font-bold">Review: {question.title}</h1>
        <Link
          href="/dashboard"
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          Exit Review
        </Link>
      </div>
      
      <MultipleChoiceReview 
        question={question} 
        onComplete={handleReviewComplete} 
      />
    </div>
  );
} 