'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MultipleChoiceQuestion } from '@/types/index';
import MultipleChoiceEditor from '@/components/MultipleChoiceEditor';
import ResourceGenerator from '@/components/ResourceGenerator';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[CreateMultipleChoice] ${message}`, data ? data : '');
};

export default function CreateMultipleChoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<MultipleChoiceQuestion | null>(null);
  
  // Check for question data in URL params
  useEffect(() => {
    const questionData = searchParams.get('data');
    if (questionData) {
      try {
        log('Loading question from URL data');
        const parsedQuestion = JSON.parse(decodeURIComponent(questionData));
        setQuestion(parsedQuestion);
      } catch (err) {
        console.error('Error parsing question data:', err);
        setError('Invalid question data in URL');
      }
    }
  }, [searchParams]);
  
  // Create a blank question template
  const blankQuestion: MultipleChoiceQuestion = {
    id: uuidv4(),
    title: 'New Multiple Choice Question',
    question: '',
    options: ['', '', ''],  // Three empty options by default
    correctOptionIndex: 0,  // First option is pre-selected as correct by default
    difficulty: 2,
    createdAt: new Date().toISOString(),
    reviewCount: 0
  };

  const handleSave = async (savedQuestion: MultipleChoiceQuestion) => {
    try {
      setIsCreating(true);
      setError(null);
      
      log('Saving multiple choice question', { 
        id: savedQuestion.id,
        title: savedQuestion.title
      });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Failed to get current user: ' + userError.message);
      }
      
      // Save to database
      const { error: dbError } = await supabase
        .from('multiple_choice_questions')
        .insert({
          id: savedQuestion.id,
          user_id: user?.id,
          title: savedQuestion.title,
          description: savedQuestion.description,
          content: {
            question: savedQuestion.question,
            options: savedQuestion.options,
            correctOptionIndex: savedQuestion.correctOptionIndex,
            explanation: savedQuestion.explanation,
            tags: savedQuestion.tags,
            difficulty: savedQuestion.difficulty
          },
          deck_id: savedQuestion.deck_id,
          created_at: savedQuestion.createdAt,
          last_reviewed_at: savedQuestion.lastReviewedAt,
          next_review_at: savedQuestion.nextReviewAt,
          review_count: savedQuestion.reviewCount || 0
        });
      
      if (dbError) throw dbError;
      
      log('Multiple choice question created successfully');
      router.push('/dashboard');
    } catch (err) {
      console.error('Error creating multiple choice question:', err);
      setError('Failed to create question: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleCancel = () => {
    log('Create multiple choice cancelled');
    router.push('/dashboard');
  };
  
  const handleGenerateMultipleChoice = (generatedQuestion: MultipleChoiceQuestion) => {
    log('Multiple choice question generated', { id: generatedQuestion.id });
    setQuestion(generatedQuestion);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Create Multiple Choice Question</h1>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {question ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <MultipleChoiceEditor 
            initialQuestion={question} 
            onSave={handleSave} 
            onCancel={handleCancel}
            saveButtonText={isCreating ? "Creating..." : "Create Question"}
          />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Use AI to generate a question</h2>
            <button
              onClick={() => setQuestion(blankQuestion)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
            >
              Create manually instead
            </button>
          </div>
          <ResourceGenerator onGenerateMultipleChoice={handleGenerateMultipleChoice} />
        </div>
      )}
    </div>
  );
} 