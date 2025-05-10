'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flashcard } from '@/types/index';
import FlashcardEditor from '@/components/FlashcardEditor';
import ResourceGenerator from '@/components/ResourceGenerator';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[CreateFlashcard] ${message}`, data ? data : '');
};

export default function CreateFlashcardPage() {
  const router = useRouter();
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  
  const handleGenerateFlashcard = (generatedFlashcard: Flashcard) => {
    log('Flashcard generated', { id: generatedFlashcard.id });
    setFlashcard(generatedFlashcard);
  };
  
  const handleSave = (savedFlashcard: Flashcard) => {
    log('Flashcard saved successfully', { id: savedFlashcard.id });
    router.push('/dashboard');
  };
  
  const handleCancel = () => {
    log('Create flashcard cancelled');
    router.push('/dashboard');
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Create New Flashcard</h1>
      
      {flashcard ? (
        <FlashcardEditor 
          initialFlashcard={flashcard} 
          onSave={handleSave} 
          onCancel={handleCancel} 
        />
      ) : (
        <ResourceGenerator onGenerateFlashcard={handleGenerateFlashcard} />
      )}
    </div>
  );
} 