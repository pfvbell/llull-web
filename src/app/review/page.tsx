'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReviewSession from '@/components/ReviewSession';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[ReviewPage] ${message}`, data ? data : '');
};

export default function ReviewPage() {
  const [isActiveReview, setIsActiveReview] = useState(false);
  const [reviewSize, setReviewSize] = useState<5 | 10 | 25>(5);
  
  // Function to handle session completion
  const handleComplete = () => {
    log('Review session completed');
    setIsActiveReview(false);
  };

  // Handle starting review
  const startReview = () => {
    log(`Starting review with size ${reviewSize}`);
    setIsActiveReview(true);
  };

  if (isActiveReview) {
    return (
      <div className="container mx-auto py-8 px-4">
        <ReviewSession 
          initialLimit={reviewSize}
          onComplete={handleComplete} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Review Now</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Review Session</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Choose how many items to include in your review session:
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                setReviewSize(5);
                log('Review size set to 5');
              }}
              className={`
                px-5 py-2 rounded-full
                ${reviewSize === 5
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
              `}
            >
              5 Items
            </button>
            
            <button
              onClick={() => {
                setReviewSize(10);
                log('Review size set to 10');
              }}
              className={`
                px-5 py-2 rounded-full
                ${reviewSize === 10
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
              `}
            >
              10 Items
            </button>
            
            <button
              onClick={() => {
                setReviewSize(25);
                log('Review size set to 25');
              }}
              className={`
                px-5 py-2 rounded-full
                ${reviewSize === 25
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
              `}
            >
              25 Items
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Your review session will include exactly {reviewSize} items, prioritizing those due for review.
          </p>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium text-lg mb-4">How Our Review System Works</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-100 p-3 rounded-full mb-3 text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h4 className="font-medium mb-1">Smart Learning</h4>
                <p className="text-sm text-gray-600">Items are presented based on what you need to review most</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-100 p-3 rounded-full mb-3 text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-medium mb-1">Optimal Timing</h4>
                <p className="text-sm text-gray-600">Review intervals automatically adjust based on your performance</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-100 p-3 rounded-full mb-3 text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-medium mb-1">Long-term Retention</h4>
                <p className="text-sm text-gray-600">Perfect recall? Intervals grow exponentially for efficient learning</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back to Memory Bank
          </Link>
          
          <button
            onClick={() => startReview()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            Start Review
          </button>
        </div>
      </div>
    </div>
  );
} 