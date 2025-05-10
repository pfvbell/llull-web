'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MultipleChoiceQuestion } from '@/types/index';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[MultipleChoiceGenerator] ${message}`, data ? data : '');
};

export default function MultipleChoiceGenerator() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckId, setDeckId] = useState('');
  const [decks, setDecks] = useState<{id: string, title: string}[]>([]);
  
  // Fetch user's decks
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const { data, error } = await supabase
          .from('decks')
          .select('id, title')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setDecks(data);
          setDeckId(data[0].id); // Select first deck by default
        }
      } catch (err) {
        console.error('Error fetching decks:', err);
      }
    };
    
    fetchDecks();
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  const handleDeckChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDeckId(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please enter some text to generate multiple choice questions');
      return;
    }
    
    if (!deckId) {
      setError('Please select a deck');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      log(`Generating multiple choice questions for text: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);
      
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
      if (!data || !data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid response data from API');
      }
      
      log(`Received ${data.questions.length} multiple choice questions`);
      
      // Add IDs and timestamps to each question
      const now = new Date().toISOString();
      const questions: MultipleChoiceQuestion[] = data.questions.map((q: any) => ({
        id: uuidv4(),
        title: q.title || 'Untitled Question',
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
      
      if (questions.length === 1) {
        // If there's only one question, navigate to single creation page with data
        log('One question generated, redirecting to single edit page');
        router.push(`/multiple-choice/create?data=${encodeURIComponent(JSON.stringify(questions[0]))}`);
      } else {
        // For multiple questions, navigate to batch create page
        log(`${questions.length} questions generated, redirecting to batch edit page`);
        router.push(`/multiple-choice/create-batch?data=${encodeURIComponent(JSON.stringify(questions))}`);
      }
    } catch (err) {
      console.error('[MultipleChoiceGenerator] Error generating questions:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Generate Multiple Choice Questions</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="deck" className="block text-sm font-medium text-gray-700 mb-1">
            Select Deck
          </label>
          <select
            id="deck"
            value={deckId}
            onChange={handleDeckChange}
            className="w-full p-2 border rounded-md bg-white shadow-sm"
            required
          >
            <option value="" disabled>Select a deck</option>
            {decks.map(deck => (
              <option key={deck.id} value={deck.id}>{deck.title}</option>
            ))}
          </select>
        </div>
      
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Enter text to generate questions from
          </label>
          <textarea
            id="content"
            rows={8}
            className="w-full p-4 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What would you like to create multiple choice questions about?"
            value={text}
            onChange={handleTextChange}
            disabled={isGenerating}
          />
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isGenerating || !text.trim() || !deckId}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isGenerating || !text.trim() || !deckId ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Multiple Choice Questions'}
        </button>
      </form>
    </div>
  );
} 