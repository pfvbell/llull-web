'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[ReviewDashboard] ${message}`, data ? data : '');
};

interface ReviewDashboardProps {
  dueCount?: number;
}

export default function ReviewDashboard({ dueCount = 0 }: ReviewDashboardProps) {
  const [selectedCount, setSelectedCount] = useState<number>(5);
  const router = useRouter();
  
  const reviewCounts = [3, 5, 10, 25];
  
  const handleStartReview = () => {
    log(`Starting review session with ${selectedCount} items`);
    
    // Save selected count to localStorage for persistence
    localStorage.setItem('reviewLimit', selectedCount.toString());
    
    // Navigate to the review session page
    router.push(`/review/session?limit=${selectedCount}`);
  };
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Memory Bank Review</h1>
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Configure Your Review Session</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">How many items would you like to review?</label>
            <div className="flex flex-wrap gap-3">
              {reviewCounts.map(count => (
                <button 
                  key={count} 
                  onClick={() => setSelectedCount(count)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedCount === count 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {count} items
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <h3 className="font-medium text-blue-800 mb-2">About Spaced Repetition</h3>
            <p className="text-blue-700 text-sm mb-2">
              The Llull Memorization Algorithm helps you remember more effectively by adjusting review intervals based on your performance.
            </p>
            <ul className="text-blue-700 text-sm list-disc pl-5 space-y-1">
              <li>Items you know well will appear less frequently</li>
              <li>Items you struggle with will appear more often</li>
              <li>Your review intervals automatically adapt to your learning patterns</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="font-medium text-gray-800 mb-2">Items Due for Review</h3>
            {dueCount > 0 ? (
              <p className="text-gray-700">
                You have <span className="font-bold">{dueCount}</span> items due for review. 
                {dueCount > selectedCount && (
                  <span className="text-amber-600"> Only the {selectedCount} oldest items will be included in this session.</span>
                )}
              </p>
            ) : (
              <p className="text-gray-700">You have no items due for review at this time.</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Back to Memory Bank
          </Link>
          <button
            onClick={handleStartReview}
            disabled={dueCount === 0}
            className={`px-6 py-2 rounded-md ${
              dueCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Start Review Session
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Resource Weights</h2>
        <p className="text-gray-600 mb-4">
          Different resource types have different weights in your review queue:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="font-medium text-gray-800">Concept Maps & Storyboards</h3>
            <p className="text-gray-600">Weight: 2 items</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="font-medium text-gray-800">Flashcards & Multiple Choice</h3>
            <p className="text-gray-600">Weight: 1 item</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          This means that a Concept Map counts as 2 items in your review limit. 
          For example, if you select a limit of 5 items, you might get 2 concept maps and 1 flashcard (total weight: 5).
        </p>
      </div>
    </div>
  );
} 