'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MultipleChoiceQuestion } from '@/types/index';
import MultipleChoiceEditor from '@/components/MultipleChoiceEditor';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[CreateMultipleChoiceBatch] ${message}`, data ? data : '');
};

export default function CreateMultipleChoiceBatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{success: number, failed: number}>({success: 0, failed: 0});
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  useEffect(() => {
    // Check if we have question data in the URL
    loadQuestionsFromURL();
  }, [searchParams]);
  
  // Function to reload questions from URL
  const loadQuestionsFromURL = () => {
    const questionData = searchParams.get('data');
    if (questionData) {
      try {
        log('Loading questions from URL data');
        
        // Try to decode the URL parameter first, then parse it
        const decodedData = decodeURIComponent(questionData);
        const parsedData = JSON.parse(decodedData);
        
        const processedQuestions = Array.isArray(parsedData) ? parsedData : [parsedData];
        
        // Ensure we have unique IDs for each question
        const uniqueQuestions = processedQuestions.map((q: any, index: number) => {
          // If we somehow got duplicate IDs, regenerate them
          if (processedQuestions.filter((c: any) => c.id === q.id).length > 1) {
            return { ...q, id: uuidv4() };
          }
          return q;
        });
        
        setQuestions(uniqueQuestions);
        setCurrentIndex(0); // Reset to first question when reloading
      } catch (err) {
        console.error('Error parsing question data from URL:', err);
      }
    }
  };
  
  const handleSave = async (updatedQuestion: MultipleChoiceQuestion) => {
    try {
      setIsSaving(true);
      
      log('Saving question', { 
        id: updatedQuestion.id,
        title: updatedQuestion.title
      });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Failed to get current user: ' + userError.message);
      }
      
      // Save to database
      const { error: dbError } = await supabase
        .from('multiple_choice_questions')
        .upsert({
          id: updatedQuestion.id,
          user_id: user?.id,
          title: updatedQuestion.title,
          description: updatedQuestion.description,
          content: {
            question: updatedQuestion.question,
            options: updatedQuestion.options,
            correctOptionIndex: updatedQuestion.correctOptionIndex,
            explanation: updatedQuestion.explanation,
            tags: updatedQuestion.tags,
            difficulty: updatedQuestion.difficulty
          },
          deck_id: updatedQuestion.deck_id,
          created_at: updatedQuestion.createdAt,
          last_reviewed_at: updatedQuestion.lastReviewedAt,
          next_review_at: updatedQuestion.nextReviewAt,
          review_count: updatedQuestion.reviewCount || 0
        });
      
      if (dbError) throw dbError;
      
      // Update the questions array
      const updatedQuestions = [...questions];
      updatedQuestions[currentIndex] = updatedQuestion;
      setQuestions(updatedQuestions);
      
      // Update save status
      setSaveStatus(prev => ({
        success: prev.success + 1,
        failed: prev.failed
      }));
      
      // Move to next question or redirect if done
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        log('All questions saved successfully');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error saving question:', err);
      alert('Failed to save question: ' + (err instanceof Error ? err.message : 'Unknown error'));
      
      // Update save status
      setSaveStatus(prev => ({
        success: prev.success,
        failed: prev.failed + 1
      }));
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    log('Create multiple choice batch cancelled');
    router.push('/dashboard');
  };
  
  const handleSkip = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const currentQuestion = questions[currentIndex];
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Create Multiple Choice Questions</h1>
      
      {questions.length > 0 && (
        <div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600">
                Question {currentIndex + 1} of {questions.length}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="px-3 py-1 text-xs bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Debug
                </button>
                <button
                  onClick={loadQuestionsFromURL}
                  className="px-3 py-1 text-xs bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Reset
                </button>
                
                {isSaving ? (
                  <div className="text-blue-600">
                    Saving... ({saveStatus.success} saved, {saveStatus.failed} failed)
                  </div>
                ) : currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Skip
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          
          {/* Debug info */}
          {showDebugInfo && (
            <div className="mt-4 p-4 border border-gray-300 rounded-md bg-gray-50 mb-6">
              <h3 className="font-bold mb-2">Debug Information</h3>
              <p className="text-xs">
                Total Questions: {questions.length} | 
                Current Index: {currentIndex}
              </p>
            </div>
          )}
        </div>
      )}
      
      {currentQuestion ? (
        <MultipleChoiceEditor 
          initialQuestion={currentQuestion} 
          onSave={handleSave} 
          onCancel={handleCancel}
          saveButtonText={currentIndex < questions.length - 1 ? "Save & Continue" : "Save All Questions"}
        />
      ) : (
        <div className="bg-yellow-100 p-4 rounded-md">
          No question data found. Please go back and generate questions.
        </div>
      )}
    </div>
  );
} 