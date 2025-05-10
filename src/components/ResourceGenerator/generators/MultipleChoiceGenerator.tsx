import React from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { MultipleChoiceQuestion } from '@/types/index';
import { GeneratorProps } from '../types';
import { createLogger } from '../utils';

const log = createLogger('MultipleChoiceGenerator');

interface MultipleChoiceGeneratorProps extends GeneratorProps {
  onGenerateMultipleChoice?: (question: MultipleChoiceQuestion) => void;
}

const MultipleChoiceGenerator = ({
  text,
  deckId,
  isGenerating,
  onGenerate,
  onError,
  onGenerateMultipleChoice
}: MultipleChoiceGeneratorProps) => {
  const router = useRouter();

  const generateMultipleChoice = async () => {
    try {
      onGenerate(true);
      log('Generating multiple choice questions');
      
      const response = await fetch('/api/generate-multiple-choice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate multiple choice questions');
      }
      
      const data = await response.json();
      
      // Validate the response data
      if (!data || typeof data !== 'object' || !data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid response data from API');
      }
      
      log(`Received ${data.questions.length} multiple choice questions from API`, { 
        questionCount: data.questions.length,
        firstQuestion: data.questions.length > 0 ? {
          title: data.questions[0].title,
          question: data.questions[0].question?.substring(0, 50)
        } : null,
        allTitles: data.questions.map((q: any) => q.title)
      });
      
      // Create properly typed MultipleChoiceQuestions with UUIDs
      const now = new Date().toISOString();
      const questions: MultipleChoiceQuestion[] = data.questions.map((q: any) => ({
        id: uuidv4(),
        title: q.title || text.substring(0, 50) || 'Untitled Question',
        description: q.description || '',
        question: q.question || '',
        options: q.options || ['Option A', 'Option B', 'Option C'],
        correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
        explanation: q.explanation || '',
        tags: q.tags || [],
        difficulty: q.difficulty || 2,
        createdAt: now,
        reviewCount: 0,
        deck_id: deckId
      }));
      
      log('Processed multiple choice questions:', { 
        count: questions.length, 
        titles: questions.map(q => q.title),
        deck_id: deckId 
      });
      
      // If we have only a single question and a handler, use it
      // Otherwise, go to batch mode
      if (questions.length === 1 && onGenerateMultipleChoice) {
        log('Using single multiple choice handler for one question');
        onGenerateMultipleChoice(questions[0]);
      } else {
        // Use batch mode for multiple questions
        log(`Navigating to batch editor with ${questions.length} multiple choice questions`);
        
        // Check for duplicate titles before sending to batch editor
        const uniqueTitles = new Set(questions.map(q => q.title)).size;
        
        log('Checking question uniqueness before navigation:', {
          totalQuestions: questions.length,
          uniqueTitles,
          allUnique: uniqueTitles === questions.length
        });
        
        // Ensure each question has a unique title by appending a number if needed
        const uniqueQuestions = questions.map((question, index) => {
          // Count how many questions have this title
          const sameTitle = questions.filter(q => q.title === question.title);
          
          // If this is a duplicate title, make it unique
          if (sameTitle.length > 1) {
            const position = sameTitle.findIndex(q => q.id === question.id) + 1;
            return {
              ...question,
              title: `${question.title} (${position})`
            };
          }
          return question;
        });
        
        log('Final questions after uniqueness check:', {
          count: uniqueQuestions.length,
          uniqueTitlesCount: new Set(uniqueQuestions.map(q => q.title)).size,
          allUnique: new Set(uniqueQuestions.map(q => q.title)).size === uniqueQuestions.length
        });
        
        router.push(`/multiple-choice/create-batch?data=${encodeURIComponent(JSON.stringify(uniqueQuestions))}`);
      }
      
      return questions;
    } catch (err: any) {
      console.error(`Error generating multiple choice questions:`, err);
      onError(err.message || 'Failed to generate multiple choice questions');
      return null;
    } finally {
      onGenerate(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generateMultipleChoice}
      disabled={isGenerating || !text.trim()}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      Generate Multiple Choice
    </button>
  );
};

export default MultipleChoiceGenerator; 