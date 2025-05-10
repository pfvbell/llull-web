'use client';

import { useState, useEffect } from 'react';
import { Flashcard } from '@/types/index';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[FlashcardEditor] ${message}`, data ? data : '');
};

interface FlashcardEditorProps {
  initialFlashcard: Flashcard;
  onSave: (flashcard: Flashcard) => void;
  onCancel?: () => void;
  saveButtonText?: string;
}

export default function FlashcardEditor({ 
  initialFlashcard, 
  onSave, 
  onCancel,
  saveButtonText = "Save Flashcard" 
}: FlashcardEditorProps) {
  // Create a local state for the flashcard being edited
  const [flashcard, setFlashcard] = useState<Flashcard>(initialFlashcard);
  
  // Update local state when initialFlashcard changes
  useEffect(() => {
    log('Received flashcard for editing', {
      id: initialFlashcard.id,
      title: initialFlashcard.title,
      front: initialFlashcard.front.substring(0, 50) + '...',
      back: initialFlashcard.back.substring(0, 50) + '...',
      deck_id: initialFlashcard.deck_id
    });
    
    // Important: Reset the local state when initialFlashcard changes
    setFlashcard(initialFlashcard);
  }, [initialFlashcard]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFlashcard(prev => ({
      ...prev,
      [name]: value
    }));
    
    log(`Updated ${name} field`, { 
      id: flashcard.id,
      title: flashcard.title,
      fieldName: name,
      newValue: value.substring(0, 30) + '...'
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    log('Saving flashcard', {
      id: flashcard.id,
      title: flashcard.title,
      front: flashcard.front.substring(0, 30) + '...',
      back: flashcard.back.substring(0, 30) + '...'
    });
    onSave(flashcard);
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
          value={flashcard.title}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="front" className="block text-sm font-medium text-gray-700 mb-1">
          Front Side
        </label>
        <textarea
          id="front"
          name="front"
          value={flashcard.front}
          onChange={handleChange}
          rows={4}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="back" className="block text-sm font-medium text-gray-700 mb-1">
          Back Side
        </label>
        <textarea
          id="back"
          name="back"
          value={flashcard.back}
          onChange={handleChange}
          rows={4}
          className="w-full p-2 border rounded-md"
          required
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
        <p>Card ID: {flashcard.id.substring(0, 8)}...</p>
      </div>
    </form>
  );
} 