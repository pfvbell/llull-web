'use client';

import { useState, useEffect } from 'react';
import { MultipleChoiceQuestion } from '@/types/index';
import { v4 as uuidv4 } from 'uuid';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[MultipleChoiceEditor] ${message}`, data ? data : '');
};

interface MultipleChoiceEditorProps {
  initialQuestion: MultipleChoiceQuestion;
  onSave: (question: MultipleChoiceQuestion) => void;
  onCancel?: () => void;
  saveButtonText?: string;
}

export default function MultipleChoiceEditor({ 
  initialQuestion, 
  onSave, 
  onCancel,
  saveButtonText = "Save Question" 
}: MultipleChoiceEditorProps) {
  // Create a local state for the question being edited
  const [question, setQuestion] = useState<MultipleChoiceQuestion>(initialQuestion);
  
  // Update local state when initialQuestion changes
  useEffect(() => {
    log('Received question for editing', {
      id: initialQuestion.id,
      title: initialQuestion.title,
      question: initialQuestion.question?.substring(0, 50) + '...',
      optionsCount: initialQuestion.options?.length,
      correctOptionIndex: initialQuestion.correctOptionIndex
    });
    
    // Important: Reset the local state when initialQuestion changes
    setQuestion(initialQuestion);
  }, [initialQuestion]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuestion(prev => ({
      ...prev,
      [name]: value
    }));
    
    log(`Updated ${name} field`, { 
      id: question.id,
      fieldName: name,
      newValue: value.substring(0, 30) + '...'
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[index] = value;
    
    setQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
    
    log(`Updated option ${index}`, { 
      newValue: value.substring(0, 30) + '...'
    });
  };

  const handleCorrectOptionChange = (index: number) => {
    setQuestion(prev => ({
      ...prev,
      correctOptionIndex: index
    }));
    
    log(`Updated correct option index to ${index}`);
  };
  
  const addOption = () => {
    if (question.options.length < 5) { // Limit to 5 options max
      setQuestion(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
      log('Added new option');
    }
  };
  
  const removeOption = (index: number) => {
    if (question.options.length > 2) { // Keep at least 2 options
      const newOptions = [...question.options];
      newOptions.splice(index, 1);
      
      // Adjust correct option index if needed
      let newCorrectIndex = question.correctOptionIndex;
      if (index === question.correctOptionIndex) {
        newCorrectIndex = 0; // Default to first option if removing the correct one
      } else if (index < question.correctOptionIndex) {
        newCorrectIndex--; // Decrement if removing an option before the correct one
      }
      
      setQuestion(prev => ({
        ...prev,
        options: newOptions,
        correctOptionIndex: newCorrectIndex
      }));
      
      log(`Removed option ${index}`, {
        newCorrectIndex,
        optionsRemaining: newOptions.length
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    log('Saving multiple choice question', {
      id: question.id,
      title: question.title,
      question: question.question?.substring(0, 30) + '...',
      optionsCount: question.options?.length,
      correctOptionIndex: question.correctOptionIndex
    });
    onSave(question);
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={question.title}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
          Question
        </label>
        <textarea
          id="question"
          name="question"
          value={question.question}
          onChange={handleChange}
          rows={3}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Options (select the correct answer)
        </label>
        {question.options.map((option, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="radio"
              id={`option-${index}`}
              name="correctOption"
              checked={question.correctOptionIndex === index}
              onChange={() => handleCorrectOptionChange(index)}
              className="mr-2"
              required
            />
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="flex-grow p-2 border rounded-md"
              placeholder={`Option ${index + 1}`}
              required
            />
            {question.options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="ml-2 p-1 text-red-600 hover:text-red-800"
                title="Remove option"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {question.options.length < 5 && (
          <button
            type="button"
            onClick={addOption}
            className="mt-1 text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Option
          </button>
        )}
      </div>
      
      <div className="mb-6">
        <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-1">
          Explanation (Optional)
        </label>
        <textarea
          id="explanation"
          name="explanation"
          value={question.explanation || ''}
          onChange={handleChange}
          rows={2}
          className="w-full p-2 border rounded-md"
          placeholder="Explain why the correct answer is right (shown after answering)"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {saveButtonText}
        </button>
      </div>
      
      {/* Debug info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>Question ID: {question.id.substring(0, 8)}...</p>
      </div>
    </form>
  );
} 