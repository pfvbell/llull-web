// src/tests/memory-bank-review.test.ts
// We need to mock supabase before other imports
import * as supabaseModule from '@/lib/supabase';

// Create a manual mock for supabase
// TypeScript will use this mock instead of the real implementation
(supabaseModule as any).supabase = {
  auth: {
    getUser: async () => ({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
  },
  from: () => ({
    select: () => ({ 
      eq: () => ({ 
        or: () => ({ 
          gt: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null })
            })
          })
        })
      })
    })
  })
};

import { 
  processConceptMapData,
  processFlashcardData,
  processMultipleChoiceData,
  processStoryboardData
} from '@/lib/review-queue';

// Add logging for test debugging
const testLog = (message: string, data?: any) => {
  console.log(`[MemoryBankTest] ${message}`, data ? data : '');
};

/**
 * Test Memory Bank Review functionality
 * 
 * This test focuses on resource processors, since queue generation
 * and status update would require a real Supabase connection.
 */
async function testMemoryBankReview() {
  testLog('Starting Memory Bank Review tests...');
  
  // Test resource processors with mock data
  testLog('Testing resource processors');
  
  // Mock concept map data
  const mockConceptMap = {
    id: 'test-concept-map-1',
    title: 'Test Concept Map',
    content: {
      nodes: [
        { id: 'node1', label: 'Concept 1', position: { x: 100, y: 100 } },
        { id: 'node2', label: 'Concept 2', position: { x: 300, y: 100 } }
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'node2', label: 'relates to' }
      ],
      description: 'Test description',
      complexity: 2
    },
    created_at: new Date().toISOString(),
    last_reviewed_at: null,
    next_review_at: null,
    review_count: 0
  };
  
  // Mock flashcard data
  const mockFlashcard = {
    id: 'test-flashcard-1',
    title: 'Test Flashcard',
    content: {
      front: 'What is the capital of France?',
      back: 'Paris',
      tags: ['geography', 'europe'],
      difficulty: 1
    },
    created_at: new Date().toISOString(),
    last_reviewed_at: null,
    next_review_at: null,
    review_count: 0
  };
  
  // Mock multiple choice data
  const mockMultipleChoice = {
    id: 'test-multiple-choice-1',
    title: 'Test Multiple Choice',
    content: {
      question: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctOptionIndex: 1,
      explanation: 'Mars is called the Red Planet because of its reddish appearance.',
      tags: ['astronomy', 'planets'],
      difficulty: 1
    },
    created_at: new Date().toISOString(),
    last_reviewed_at: null,
    next_review_at: null,
    review_count: 0
  };
  
  // Mock storyboard data
  const mockStoryboard = {
    id: 'test-storyboard-1',
    title: 'Test Storyboard',
    content: {
      description: 'A test storyboard',
      scenes: [
        {
          title: 'Scene 1',
          content_text: 'This is the first scene of our story.',
          icon_search: ['story', 'beginning']
        },
        {
          title: 'Scene 2',
          content_text: 'This is the second scene with more details.',
          icon_search: ['details', 'exploration']
        }
      ]
    },
    created_at: new Date().toISOString(),
    last_reviewed_at: null,
    next_review_at: null,
    review_count: 0
  };
  
  // Process the mock data
  const conceptMap = processConceptMapData(mockConceptMap);
  const flashcard = processFlashcardData(mockFlashcard);
  const multipleChoice = processMultipleChoiceData(mockMultipleChoice);
  const storyboard = processStoryboardData(mockStoryboard);
  
  // Verify processing results
  testLog('Concept Map Processor Result:', conceptMap ? 'Success' : 'Failed');
  testLog('Flashcard Processor Result:', flashcard ? 'Success' : 'Failed');
  testLog('Multiple Choice Processor Result:', multipleChoice ? 'Success' : 'Failed');
  testLog('Storyboard Processor Result:', storyboard ? 'Success' : 'Failed');
  
  if (conceptMap) testLog('Concept Map Nodes:', conceptMap.nodes.length);
  if (flashcard) testLog('Flashcard Front:', flashcard.front.substring(0, 30));
  if (multipleChoice) testLog('Multiple Choice Options:', multipleChoice.options.length);
  if (storyboard) testLog('Storyboard Scenes:', storyboard.scenes.length);
  
  testLog('Memory Bank Review tests completed');
}

// Execute the tests
testMemoryBankReview().catch(error => {
  console.error('Error running tests:', error);
}); 