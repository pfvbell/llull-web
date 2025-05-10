/**
 * This test file focuses on resource processors from the Memory Bank system.
 * It tests the utility functions that transform database data into typed objects.
 */

import {
  processConceptMapData,
  processFlashcardData,
  processMultipleChoiceData,
  processStoryboardData
} from '@/lib/review-queue/processors';

// Add logging for test debugging
const log = (message: string, data?: any) => {
  console.log(`[ProcessorTest] ${message}`, data ? data : '');
};

describe('Memory Bank Resource Processors', () => {
  beforeAll(() => {
    log('Starting resource processor tests...');
  });

  afterAll(() => {
    log('Resource processor tests completed');
  });

  // Test 1: Concept Map Processor
  test('processes concept map data correctly', () => {
    log('Test 1: Concept Map Processor');
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
    
    const conceptMap = processConceptMapData(mockConceptMap);
    
    expect(conceptMap).not.toBeNull();
    
    if (conceptMap) {
      log('Concept Map processed successfully:', {
        id: conceptMap.id,
        title: conceptMap.title,
        nodeCount: conceptMap.nodes.length,
        edgeCount: conceptMap.edges.length
      });
      
      expect(conceptMap.id).toBe('test-concept-map-1');
      expect(conceptMap.title).toBe('Test Concept Map');
      expect(conceptMap.nodes).toHaveLength(2);
      expect(conceptMap.edges).toHaveLength(1);
      expect(conceptMap.description).toBe('Test description');
    } else {
      // This will fail the test if null is returned
      fail('Failed to process concept map');
    }
  });
  
  // Test 2: Flashcard Processor
  test('processes flashcard data correctly', () => {
    log('Test 2: Flashcard Processor');
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
    
    const flashcard = processFlashcardData(mockFlashcard);
    
    expect(flashcard).not.toBeNull();
    
    if (flashcard) {
      log('Flashcard processed successfully:', {
        id: flashcard.id,
        title: flashcard.title,
        front: flashcard.front.substring(0, 30),
        back: flashcard.back.substring(0, 30)
      });
      
      expect(flashcard.id).toBe('test-flashcard-1');
      expect(flashcard.title).toBe('Test Flashcard');
      expect(flashcard.front).toBe('What is the capital of France?');
      expect(flashcard.back).toBe('Paris');
    } else {
      fail('Failed to process flashcard');
    }
  });
  
  // Test 3: Multiple Choice Processor
  test('processes multiple choice data correctly', () => {
    log('Test 3: Multiple Choice Processor');
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
    
    const multipleChoice = processMultipleChoiceData(mockMultipleChoice);
    
    expect(multipleChoice).not.toBeNull();
    
    if (multipleChoice) {
      log('Multiple Choice processed successfully:', {
        id: multipleChoice.id,
        title: multipleChoice.title,
        optionCount: multipleChoice.options.length,
        correctIndex: multipleChoice.correctOptionIndex
      });
      
      expect(multipleChoice.id).toBe('test-multiple-choice-1');
      expect(multipleChoice.title).toBe('Test Multiple Choice');
      expect(multipleChoice.options).toHaveLength(4);
      expect(multipleChoice.correctOptionIndex).toBe(1);
      expect(multipleChoice.options[1]).toBe('Mars');
    } else {
      fail('Failed to process multiple choice');
    }
  });
  
  // Test 4: Storyboard Processor
  test('processes storyboard data correctly', () => {
    log('Test 4: Storyboard Processor');
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
    
    const storyboard = processStoryboardData(mockStoryboard);
    
    expect(storyboard).not.toBeNull();
    
    if (storyboard) {
      log('Storyboard processed successfully:', {
        id: storyboard.id,
        title: storyboard.title,
        sceneCount: storyboard.scenes.length
      });
      
      expect(storyboard.id).toBe('test-storyboard-1');
      expect(storyboard.title).toBe('Test Storyboard');
      expect(storyboard.scenes).toHaveLength(2);
      expect(storyboard.scenes[0].title).toBe('Scene 1');
      expect(storyboard.scenes[1].title).toBe('Scene 2');
    } else {
      fail('Failed to process storyboard');
    }
  });
  
  // Test 5: String content parsing
  test('processes string content correctly', () => {
    log('Test 5: String content parsing');
    
    const stringContentMap = {
      id: 'string-content-map',
      title: 'String Content Map',
      content: JSON.stringify({
        nodes: [{ id: 'node1', label: 'String Node', position: { x: 100, y: 100 } }],
        edges: [],
        description: 'Test string parsing'
      }),
      created_at: new Date().toISOString(),
      last_reviewed_at: null,
      next_review_at: null,
      review_count: 0
    };
    
    const parsedMap = processConceptMapData(stringContentMap);
    
    expect(parsedMap).not.toBeNull();
    
    if (parsedMap) {
      log('String content map processed successfully:', {
        id: parsedMap.id,
        nodeCount: parsedMap.nodes.length
      });
      
      expect(parsedMap.id).toBe('string-content-map');
      expect(parsedMap.title).toBe('String Content Map');
      expect(parsedMap.nodes).toHaveLength(1);
      expect(parsedMap.nodes[0].label).toBe('String Node');
      expect(parsedMap.description).toBe('Test string parsing');
    } else {
      fail('Failed to process string content map');
    }
  });
}); 