// Just a test file to verify imports
import { 
  generateCombinedReviewQueue, 
  updateResourceReviewStatus, 
  ExtendedReviewSession,
  log
} from '@/lib/review-queue';

async function testFunction() {
  // Log a message to test the logger
  log('Testing imports', { success: true });
  
  // Try to get a review session
  const session = await generateCombinedReviewQueue(5, true);
  if (session) {
    log(`Got session with ${session.resources.length} resources`);
  }

  // Try to update a resource
  const updated = await updateResourceReviewStatus('some-id', 5, 10, 'flashcard');
  log(`Update result: ${updated}`);
}

// This file is only for testing imports, not for actual use
export const testSession: ExtendedReviewSession = {
  sessionId: 'test',
  createdAt: new Date().toISOString(),
  resources: [],
  resourceTypes: [],
  currentIndex: 0,
  completed: []
}; 