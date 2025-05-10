'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flashcard } from '@/types/index';
import { supabase } from '@/lib/supabase';
import FlashcardEditor from '@/components/FlashcardEditor';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[FlashcardPage] ${message}`, data ? data : '');
};

export default function FlashcardPage() {
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    async function loadFlashcard() {
      try {
        if (!id) {
          setError('No flashcard ID provided');
          setLoading(false);
          return;
        }
        
        log('Loading flashcard with ID:', id);
        
        const { data, error } = await supabase
          .from('flashcards')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          setError('Flashcard not found');
          setLoading(false);
          return;
        }
        
        log('Received flashcard data from database');
        
        // Transform the data to match our Flashcard type
        const content = data.content || {};
        
        const flashcardData: Flashcard = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          front: content.front || '',
          back: content.back || '',
          tags: content.tags || [],
          difficulty: content.difficulty || 1,
          createdAt: data.created_at,
          lastReviewedAt: data.last_reviewed_at,
          nextReviewAt: data.next_review_at,
          reviewCount: data.review_count || 0
        };
        
        setFlashcard(flashcardData);
      } catch (error: any) {
        console.error('Error loading flashcard:', error);
        setError('Failed to load flashcard: ' + (error.message || error));
      } finally {
        setLoading(false);
      }
    }
    
    loadFlashcard();
  }, [id]);

  const handleSave = (updatedFlashcard: Flashcard) => {
    setFlashcard(updatedFlashcard);
    setIsEditing(false);
    log('Flashcard updated successfully');
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    
    try {
      log('Deleting flashcard');
      
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      log('Flashcard deleted successfully');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error deleting flashcard:', error);
      alert('Failed to delete flashcard: ' + (error.message || error));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !flashcard) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-6">{error || 'Failed to load flashcard'}</p>
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
        <h1 className="text-2xl font-bold mb-6">Edit Flashcard</h1>
        <FlashcardEditor 
          initialFlashcard={flashcard} 
          onSave={handleSave} 
          onCancel={() => setIsEditing(false)} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{flashcard.title}</h1>
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
            href={`/flashcard/${id}/review`}
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
      
      {flashcard.description && (
        <p className="text-gray-600 mb-4">{flashcard.description}</p>
      )}
      
      {flashcard.tags && flashcard.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {flashcard.tags.map((tag, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div 
        className={`bg-white rounded-xl shadow-md p-8 h-96 flex items-center justify-center cursor-pointer transition-all duration-500 ${
          isFlipped ? 'bg-blue-50' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            {isFlipped ? 'Back Side (Answer)' : 'Front Side (Question)'}
          </p>
          <div className="text-2xl whitespace-pre-wrap">
            {isFlipped ? flashcard.back : flashcard.front}
          </div>
          <p className="mt-6 text-sm text-blue-600">Click to flip card</p>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Created: {new Date(flashcard.createdAt).toLocaleDateString()}</p>
        {flashcard.lastReviewedAt && (
          <p>Last reviewed: {new Date(flashcard.lastReviewedAt).toLocaleDateString()}</p>
        )}
        <p>Review count: {flashcard.reviewCount}</p>
        <p>Difficulty: {
          flashcard.difficulty === 1 ? 'Easy' : 
          flashcard.difficulty === 2 ? 'Medium' : 
          flashcard.difficulty === 3 ? 'Hard' : 'Unknown'
        }</p>
      </div>
    </div>
  );
} 