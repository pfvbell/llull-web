'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReviewSession from '@/components/ReviewSession';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[ReviewSessionPage] ${message}`, data ? data : '');
};

export default function ReviewSessionPage() {
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