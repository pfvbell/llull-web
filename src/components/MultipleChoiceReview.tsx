'use client';

import { useState } from 'react';
import { MultipleChoiceQuestion } from '@/types/index';
import { updateResourceReviewStatus } from '@/lib/review-queue';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[MultipleChoiceReview] ${message}`, data ? data : '');
};

interface MultipleChoiceReviewProps {
  question: MultipleChoiceQuestion;
  onComplete: (score: number, total: number, viewingAnswers?: boolean, hintsUsed?: boolean) => void;
}

export default function MultipleChoiceReview({ question, onComplete }: MultipleChoiceReviewProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const handleOptionSelect = (index: number) => {
    if (isAnswered) return; // Prevent changing answer after submission
    setSelectedOption(index);
    log(`User selected option ${index + 1}`);
  };
  
  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    
    setIsAnswered(true);
    const isCorrect = selectedOption === question.correctOptionIndex;
    log(`Answer submitted: ${isCorrect ? 'Correct' : 'Incorrect'}`);
    
    // We don't call onComplete here as we want to show the feedback first
  };
  
  const handleContinue = async () => {
    if (selectedOption === null) return;
    
    // Calculate score based on correctness (1 for correct, 0 for incorrect)
    const score = selectedOption === question.correctOptionIndex ? 1 : 0;
    log(`Completing review with score: ${score}/1`);
    
    // Update the review status using the Llull Algorithm
    if (question.id) {
      try {
        log('Updating multiple choice review status with Llull Algorithm');
        
        const success = await updateResourceReviewStatus(
          question.id,
          score,
          1,
          'multiple-choice'
        );
        
        if (success) {
          log('Successfully updated multiple choice review status');
        } else {
          log('Failed to update multiple choice review status');
        }
      } catch (error) {
        console.error('[MultipleChoiceReview] Error updating review status:', error);
      }
    }
    
    // Call the onComplete callback
    onComplete(score, 1, false, false);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-2">{question.title}</h2>
        {question.description && (
          <p className="text-gray-600 mb-2">{question.description}</p>
        )}
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {question.tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <p className="text-lg font-medium mb-4">{question.question}</p>
          
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div 
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`p-3 border rounded-md cursor-pointer transition-all ${
                  selectedOption === index 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                } ${
                  isAnswered && index === question.correctOptionIndex
                    ? 'bg-green-100 border-green-500'
                    : isAnswered && selectedOption === index
                      ? 'bg-red-100 border-red-500'
                      : ''
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                    selectedOption === index 
                      ? 'border-blue-500 bg-blue-500 text-white' 
                      : 'border-gray-400'
                  }`}>
                    {selectedOption === index && <span>✓</span>}
                  </div>
                  <span>{option}</span>
                  
                  {isAnswered && index === question.correctOptionIndex && (
                    <span className="ml-auto text-green-600">✓ Correct</span>
                  )}
                  {isAnswered && selectedOption === index && index !== question.correctOptionIndex && (
                    <span className="ml-auto text-red-600">✗ Incorrect</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {isAnswered && question.explanation && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm font-medium text-blue-800">Explanation:</p>
            <p className="text-sm text-blue-800">{question.explanation}</p>
          </div>
        )}
        
        {!isAnswered ? (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className={`px-6 py-2 rounded-md ${
                selectedOption === null
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Submit Answer
            </button>
          </div>
        ) : (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleContinue}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 