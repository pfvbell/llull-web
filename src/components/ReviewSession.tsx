'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ConceptMap, 
  Flashcard, 
  MultipleChoiceQuestion,
  Storyboard
} from '@/types/index';
import { ResourceType } from '@/lib/spaced-repetition';
import { 
  generateCombinedReviewQueue, 
  updateResourceReviewStatus,
  ExtendedReviewSession
} from '@/lib/review-queue';
import ConceptMapReview from './ConceptMapReview';
import FlashcardReview from './FlashcardReview';
import MultipleChoiceReview from './MultipleChoiceReview';
import StoryboardReview from './StoryboardReview';
import Link from 'next/link';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[ReviewSession] ${message}`, data ? data : '');
};

interface ReviewSessionProps {
  initialLimit?: number; // Initial review count (3, 5, 10, or 25)
  onComplete?: () => void;
}

interface CompletedResource {
  resourceId: string;
  resourceType: ResourceType;
  score: number;
  total: number;
  completedAt: string;
  hintsUsed?: boolean;
}

export default function ReviewSession({ initialLimit = 5, onComplete }: ReviewSessionProps) {
  const [reviewSession, setReviewSession] = useState<ExtendedReviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedResources, setCompletedResources] = useState<CompletedResource[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [limit] = useState(initialLimit);
  const router = useRouter();

  // Load the review session
  useEffect(() => {
    async function loadReviewSession() {
      try {
        setLoading(true);
        log(`Loading review session with limit: ${limit}`);
        
        // Try to get resources due for review, then fill with other resources if needed
        const session = await generateCombinedReviewQueue(limit, true);
        
        if (!session) {
          setError('No resources found for review. Create some resources first.');
          setLoading(false);
          return;
        }
        
        log('Review session loaded', {
          sessionId: session.sessionId,
          resourceCount: session.resources.length,
          resourceTypes: session.resourceTypes.join(', ')
        });
        
        // Verify we have the expected number of resources
        if (session.resources.length < limit) {
          log(`Warning: Requested ${limit} items but only loaded ${session.resources.length} resources`);
        }
        
        setReviewSession(session);
        setCurrentIndex(0);
        setLoading(false);
      } catch (error) {
        console.error('[ReviewSession] Error loading review session:', error);
        setError('Failed to load review session');
        setLoading(false);
      }
    }
    
    loadReviewSession();
  }, [limit]);
  
  // Get the current resource based on the index
  const currentResource = reviewSession?.resources[currentIndex];
  const currentResourceType = reviewSession?.resourceTypes[currentIndex];

  // Handle completion of a resource review
  const handleReviewComplete = async (score: number, total: number, viewingAnswers?: boolean, hintsUsed?: boolean) => {
    if (!reviewSession || !currentResource || !currentResourceType) return;
    
    const resourceId = currentResource.id;
    if (!resourceId) {
      console.error('[ReviewSession] Resource ID is undefined');
      return;
    }
    
    log(`Review completed for ${currentResourceType} with score ${score}/${total}${hintsUsed ? ' (hints used)' : ''}${viewingAnswers ? ' (viewing answers)' : ''}`);
    
    // If viewing answers mode is on, don't proceed with completion
    if (viewingAnswers) {
      log('User is viewing correct answers - not advancing to next resource');
      return;
    }
    
    try {
      // Check if this resource has already been completed - if so, we're just moving to the next one
      const alreadyCompleted = reviewSession.completed.some(c => c.resourceId === resourceId);
      
      if (!alreadyCompleted) {
        log(`Recording completion for ${currentResourceType} ${resourceId}`);
        
        // Update the review status in the database
        await updateResourceReviewStatus(
          resourceId, 
          score,
          total,
          currentResourceType
        );
        
        // Add to completed resources
        const completedResource: CompletedResource = {
          resourceId,
          resourceType: currentResourceType,
          score,
          total,
          completedAt: new Date().toISOString(),
          hintsUsed
        };
        
        setCompletedResources(prev => [...prev, completedResource]);
        
        // Update session state
        const updatedSession: ExtendedReviewSession = {
          ...reviewSession,
          currentIndex: currentIndex + 1,
          completed: [...reviewSession.completed, {
            resourceId,
            resourceType: currentResourceType,
            score,
            total,
            completedAt: new Date().toISOString(),
            hintsUsed
          }]
        };
        
        setReviewSession(updatedSession);
      } else {
        // This resource was already completed, just move to the next one
        log(`Resource ${resourceId} was already completed, just moving to next`);
        
        const updatedSession: ExtendedReviewSession = {
          ...reviewSession,
          currentIndex: currentIndex + 1
        };
        
        setReviewSession(updatedSession);
      }
      
      // Check if this was the last resource
      if (currentIndex + 1 >= reviewSession.resources.length) {
        log('All resources reviewed, session complete');
        setSessionComplete(true);
      } else {
        // Move to the next resource
        log(`Moving to next resource (${currentIndex + 1}/${reviewSession.resources.length})`);
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error('[ReviewSession] Error handling review completion:', error);
    }
  };

  // Handle starting a new session
  const handleNewSession = () => {
    setReviewSession(null);
    setCurrentIndex(0);
    setCompletedResources([]);
    setSessionComplete(false);
    setLoading(true);
    setError(null);
    
    // Force refresh to start a new session
    router.refresh();
    
    // If there's a completion callback, call it
    if (onComplete) {
      onComplete();
    }
  };
  
  // Render the appropriate review component based on resource type
  const renderReviewComponent = () => {
    if (!currentResource || !currentResourceType) return null;
    
    switch (currentResourceType) {
      case 'concept-map':
        return (
          <ConceptMapReview 
            key={currentResource.id || `concept-map-${currentIndex}`}
            conceptMap={currentResource as ConceptMap} 
            onComplete={handleReviewComplete} 
          />
        );
      case 'flashcard':
        return (
          <FlashcardReview 
            key={currentResource.id || `flashcard-${currentIndex}`}
            flashcard={currentResource as Flashcard} 
            onComplete={handleReviewComplete} 
          />
        );
      case 'multiple-choice':
        return (
          <MultipleChoiceReview 
            key={currentResource.id || `multiple-choice-${currentIndex}`}
            question={currentResource as MultipleChoiceQuestion} 
            onComplete={handleReviewComplete} 
          />
        );
      case 'storyboard':
        log('Rendering storyboard review component with data:', {
          id: currentResource.id,
          title: currentResource.title,
          scenesCount: (currentResource as Storyboard).scenes?.length || 'undefined'
        });
        return (
          <StoryboardReview 
            key={currentResource.id || `storyboard-${currentIndex}`}
            storyboard={currentResource as Storyboard} 
            onComplete={handleReviewComplete} 
          />
        );
      default:
        return <div>Unsupported resource type</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Review Session</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-red-600 mb-6">{error}</p>
          <p className="mb-6">
            No resources are currently due for review. Create more learning materials or check back later.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Memory Bank
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    // Display session summary when all reviews are complete
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Review Session Complete</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Review Results</h2>
          
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {completedResources.map((resource, index) => {
                const resourceObj = reviewSession?.resources.find(r => r.id === resource.resourceId);
                const percentScore = Math.round((resource.score / resource.total) * 100);
                const resourceTypeLabels: Record<ResourceType, string> = {
                  'concept-map': 'Concept Map',
                  'flashcard': 'Flashcard',
                  'multiple-choice': 'Question',
                  'storyboard': 'Storyboard'
                };
                const resourceTypeLabel = resourceTypeLabels[resource.resourceType];
                
                return (
                  <div key={index} className="bg-gray-50 p-4 rounded-md border">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{resourceTypeLabel}</div>
                    <h3 className="font-medium text-lg mb-2">{resourceObj?.title || 'Unnamed Resource'}</h3>
                    <div className="text-3xl font-bold mb-1">
                      {percentScore}%
                      {resource.hintsUsed && <span className="text-xs text-gray-500 ml-1">(with hints)</span>}
                    </div>
                    <div className="text-sm text-gray-600">
                      Score: {resource.score}/{resource.total}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleNewSession}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start New Review Session
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Return to Memory Bank
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentResource || !currentResourceType) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Review Session</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="mb-6">No resources available for review.</p>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Return to Memory Bank
          </Link>
        </div>
      </div>
    );
  }

  // Display the current resource for review
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Review Session</h1>
          <p className="text-gray-600">
            Resource {currentIndex + 1} of {reviewSession?.resources.length}: {currentResource.title}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          Exit Review
        </Link>
      </div>
      
      {renderReviewComponent()}
    </div>
  );
} 