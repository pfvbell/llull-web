/**
 * @jest-environment jsdom
 */

// Note: To run this test, you need to install the following packages:
// pnpm add -D @testing-library/react @testing-library/jest-dom jest @types/jest

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResourceGenerator from '@/components/ResourceGenerator';
import { ConceptMap, Flashcard, MultipleChoiceQuestion } from '@/types/index';

// Debug log helper
const log = (message: string, data?: any) => {
  console.log(`[ResourceGeneratorTest] ${message}`, data ? data : '');
};

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnValue({
      data: [
        { 
          id: 'test-deck-1', 
          title: 'Test Deck', 
          description: 'A test deck', 
          created_at: new Date().toISOString(),
          review_count: 0
        }
      ],
      error: null
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    }
  }
}));

// Mock global fetch
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

describe('ResourceGenerator Component', () => {
  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    log('Test setup: Cleared mocks');

    // Setup default fetch response
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
    log('Test setup: Default fetch mock configured');
  });

  // Helper for setting up mock responses
  const setupFetchMock = (mockData: any) => {
    log('Setting up fetch mock with data:', mockData);
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    );
  };

  test('renders the ResourceGenerator component', async () => {
    log('Starting render test');
    await act(async () => {
      render(<ResourceGenerator />);
    });

    expect(screen.getByText(/Create New Memory/i)).toBeInTheDocument();
    log('Render test completed successfully');
  });

  test('generates a flashcard when the generate button is clicked', async () => {
    log('Starting flashcard generation test');
    // Setup mock response for flashcard generation
    const mockFlashcardResponse = {
      flashcards: [
        {
          title: 'Test Flashcard',
          front: 'Front content',
          back: 'Back content',
        },
      ],
    };
    
    setupFetchMock(mockFlashcardResponse);
    
    // Create a mock callback
    const mockGenerateFlashcard = jest.fn();
    log('Mock callback created');
    
    await act(async () => {
      render(<ResourceGenerator onGenerateFlashcard={mockGenerateFlashcard} />);
    });
    
    // Select flashcard type
    const flashcardButton = screen.getByText('Flashcard');
    log('Found flashcard button');
    await act(async () => {
      fireEvent.click(flashcardButton);
      log('Clicked flashcard button');
    });
    
    // Enter text content
    const textInput = screen.getByPlaceholderText(/What would you like to memorise/i);
    log('Found text input');
    await act(async () => {
      fireEvent.change(textInput, { target: { value: 'Test content for flashcard' } });
      log('Entered text in input');
    });
    
    // Click the generate button
    const generateButton = screen.getByText(/Generate Flashcard/i);
    log('Found generate button');
    await act(async () => {
      fireEvent.click(generateButton);
      log('Clicked generate button');
    });
    
    // Check if fetch was called with the right parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/generate-flashcard'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: expect.stringContaining('Test content for flashcard'),
        })
      );
      log('Fetch was called with correct parameters');
    });
    
    // Wait for callback to be called
    await waitFor(() => {
      expect(mockGenerateFlashcard).toHaveBeenCalled();
      log('Callback was called');
      
      // Check callback parameters
      const calledWithArg = mockGenerateFlashcard.mock.calls[0][0];
      expect(calledWithArg).toHaveProperty('title', 'Test Flashcard');
      log('Callback was called with correct flashcard data');
    }, { timeout: 3000 });
  });
  
  test('generates a multiple choice question when the generate button is clicked', async () => {
    log('Starting multiple choice generation test');
    // Setup mock response for multiple choice generation
    const mockMultipleChoiceResponse = {
      questions: [
        {
          title: 'Test Question',
          question: 'What is the test question?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: 2,
        },
      ],
    };
    
    setupFetchMock(mockMultipleChoiceResponse);
    
    // Create a mock callback
    const mockGenerateMultipleChoice = jest.fn();
    log('Mock callback created');
    
    render(<ResourceGenerator onGenerateMultipleChoice={mockGenerateMultipleChoice} />);
    log('Component rendered');
    
    // Wait for the component to load and fetch decks
    await waitFor(() => {
      expect(screen.getByText('Create New Memory')).toBeInTheDocument();
      log('Component loaded');
    });
    
    // Select multiple choice type
    const multipleChoiceButton = screen.getByText('Multiple Choice');
    log('Found multiple choice button');
    fireEvent.click(multipleChoiceButton);
    log('Clicked multiple choice button');
    
    // Enter text in the manual input
    const textArea = screen.getByPlaceholderText('What would you like to memorise?');
    log('Found text area');
    fireEvent.change(textArea, { target: { value: 'Test content for multiple choice' } });
    log('Entered text in input');
    
    // Click the generate button
    const generateButton = screen.getByText('Generate Multiple Choice Questions');
    log('Found generate button');
    fireEvent.click(generateButton);
    log('Clicked generate button');
    
    // Wait for the generation process to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate-multiple-choice',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test content for multiple choice'),
        })
      );
      log('Fetch was called with correct parameters');
      
      // Verify the callback was called with a MultipleChoiceQuestion object
      expect(mockGenerateMultipleChoice).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Question',
          question: 'What is the test question?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: 2,
        })
      );
      log('Callback was called with correct question data');
    }, { timeout: 3000 });
  });
  
  test('generates a concept map when the generate button is clicked', async () => {
    log('Starting concept map generation test');
    // Setup mock response for concept map generation
    const mockConceptMapResponse = {
      title: 'Test Concept Map',
      description: 'A test concept map',
      nodes: [
        { id: 'node-1', label: 'Concept 1', position: { x: 100, y: 100 } },
        { id: 'node-2', label: 'Concept 2', position: { x: 300, y: 100 } },
      ],
      edges: [
        { id: 'edge-1', source: 'node-1', target: 'node-2', label: 'relates to' },
      ],
    };
    
    setupFetchMock(mockConceptMapResponse);
    
    // Create a mock callback
    const mockGenerateConceptMap = jest.fn();
    log('Mock callback created');
    
    render(<ResourceGenerator onGenerateConceptMap={mockGenerateConceptMap} />);
    log('Component rendered');
    
    // Wait for the component to load and fetch decks
    await waitFor(() => {
      expect(screen.getByText('Create New Memory')).toBeInTheDocument();
      log('Component loaded');
    });
    
    // Concept map is selected by default
    log('Concept map is selected by default');
    
    // Enter text in the manual input
    const textArea = screen.getByPlaceholderText('What would you like to memorise?');
    log('Found text area');
    fireEvent.change(textArea, { target: { value: 'Test content for concept map' } });
    log('Entered text in input');
    
    // Click the generate button
    const generateButton = screen.getByText('Generate Concept Map');
    log('Found generate button');
    fireEvent.click(generateButton);
    log('Clicked generate button');
    
    // Wait for the generation process to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate-concept-map',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test content for concept map'),
        })
      );
      log('Fetch was called with correct parameters');
      
      // Verify the callback was called with a ConceptMap object
      expect(mockGenerateConceptMap).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Concept Map',
          description: 'A test concept map',
          nodes: expect.arrayContaining([
            expect.objectContaining({ label: 'Concept 1' }),
            expect.objectContaining({ label: 'Concept 2' }),
          ]),
          edges: expect.arrayContaining([
            expect.objectContaining({ source: 'node-1', target: 'node-2' }),
          ]),
        })
      );
      log('Callback was called with correct concept map data');
    }, { timeout: 3000 });
    
    log('Concept map test completed successfully');
  });
}); 