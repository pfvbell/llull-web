'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MultipleChoiceQuestion } from '@/types/index';
import { supabase } from '@/lib/supabase';
import MultipleChoiceEditor from '@/components/MultipleChoiceEditor';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[MultipleChoicePage] ${message}`, data ? data : '');
};

export default function MultipleChoicePage() {
  const [question, setQuestion] = useState<MultipleChoiceQuestion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const handleSave = async (updatedQuestion: MultipleChoiceQuestion) => {
    try {
      log('Saving updated question', { 
        id: updatedQuestion.id,
        title: updatedQuestion.title
      });
      
      // Save to database
      const { error } = await supabase
        .from('multiple_choice_questions')
        .update({
          title: updatedQuestion.title,
          description: updatedQuestion.description,
          content: {
            question: updatedQuestion.question,
            options: updatedQuestion.options,
            correctOptionIndex: updatedQuestion.correctOptionIndex,
            explanation: updatedQuestion.explanation,
            tags: updatedQuestion.tags,
            difficulty: updatedQuestion.difficulty
          }
        })
        .eq('id', updatedQuestion.id);
        
      if (error) throw error;
      
      setQuestion(updatedQuestion);
      setIsEditing(false);
      log('Question updated successfully');
    } catch (error: any) {
      console.error('Error updating question:', error);
      alert('Failed to update question: ' + (error.message || error));
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      log('Deleting question');
      
      const { error } = await supabase
        .from('multiple_choice_questions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      log('Question deleted successfully');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question: ' + (error.message || error));
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

  if (isEditing) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Edit Multiple Choice Question</h1>
        <MultipleChoiceEditor 
          initialQuestion={question} 
          onSave={handleSave} 
          onCancel={() => setIsEditing(false)} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{question.title}</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
          <Link
            href={`/multiple-choice/${id}/review`}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Review
          </Link>
          <Link
            href="/dashboard"
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back
          </Link>
        </div>
      </div>
      
      {question.description && (
        <p className="text-gray-600 mb-4">{question.description}</p>
      )}
      
      {question.tags && question.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {question.tags.map((tag, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h2 className="text-xl font-medium mb-4">{question.question}</h2>
        
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <div 
              key={index}
              className={`p-3 border rounded-md ${
                index === question.correctOptionIndex 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                  index === question.correctOptionIndex 
                    ? 'border-green-500 bg-green-500 text-white' 
                    : 'border-gray-400'
                }`}>
                  {index === question.correctOptionIndex && <span>✓</span>}
                </div>
                <span>{option}</span>
                {index === question.correctOptionIndex && (
                  <span className="ml-auto text-green-600">Correct Answer</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {question.explanation && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm font-medium text-blue-800">Explanation:</p>
            <p className="text-sm text-blue-800">{question.explanation}</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Created: {new Date(question.createdAt).toLocaleDateString()}</p>
        {question.lastReviewedAt && (
          <p>Last reviewed: {new Date(question.lastReviewedAt).toLocaleDateString()}</p>
        )}
        <p>Review count: {question.reviewCount}</p>
        <p>Difficulty: {
          question.difficulty === 1 ? 'Easy' : 
          question.difficulty === 2 ? 'Medium' : 
          question.difficulty === 3 ? 'Hard' : 'Unknown'
        }</p>
      </div>
    </div>
  );
} 