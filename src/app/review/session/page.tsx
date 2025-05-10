'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReviewSession from '@/components/ReviewSession';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[ReviewSessionPage] ${message}`, data ? data : '');
};

// Content component that uses search params
function ReviewSessionContent() {
  const [limit, setLimit] = useState<number>(5);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    // Get limit from URL query param or localStorage
    const limitParam = searchParams.get('limit');
    const storedLimit = localStorage.getItem('reviewLimit');
    
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if ([3, 5, 10, 25].includes(parsedLimit)) {
        log(`Using limit from URL parameter: ${parsedLimit}`);
        setLimit(parsedLimit);
        localStorage.setItem('reviewLimit', parsedLimit.toString());
      }
    } else if (storedLimit) {
      const parsedLimit = parseInt(storedLimit, 10);
      if ([3, 5, 10, 25].includes(parsedLimit)) {
        log(`Using limit from localStorage: ${parsedLimit}`);
        setLimit(parsedLimit);
      }
    } else {
      log('Using default limit: 5');
      localStorage.setItem('reviewLimit', '5');
    }
  }, [searchParams]);
  
  const handleComplete = () => {
    // Navigate back to the review dashboard
    router.push('/review');
  };
  
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mt-8 mb-6 text-center">Review Session</h1>
      <ReviewSession initialLimit={limit} onComplete={handleComplete} />
    </div>
  );
}

// Loading fallback component
function ReviewSessionLoading() {
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mt-8 mb-6 text-center">Review Session</h1>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function ReviewSessionPage() {
  return (
    <Suspense fallback={<ReviewSessionLoading />}>
      <ReviewSessionContent />
    </Suspense>
  );
} 