// src/types/index.ts
export interface ConceptNode {
    id: string;
    label: string;
    position: { x: number; y: number };
    type?: string;
    data?: any;
  }
  
  export interface ConceptEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    type?: string;
    data?: any;
  }
  
  export interface ConceptMapVersion {
    level: number;
    nodes: ConceptNode[];
    edges: ConceptEdge[];
  }
  
  // Add Deck interface
  export interface Deck {
    id: string;
    title: string;
    description?: string;
    user_id?: string;
    created_at: string;
    last_reviewed_at?: string;
    review_count: number;
  }
  
  export interface ConceptMap {
    id?: string;
    title: string;
    description?: string;
    nodes: ConceptNode[];
    edges: ConceptEdge[];
    complexity: number;
    versions: ConceptMapVersion[];
    createdAt?: string;
    updatedAt?: string;
    userId?: string;
    lastReviewedAt?: string;
    nextReviewAt?: string;
    reviewCount?: number;
    deck_id?: string; // Add deck_id field
  }
  
  export interface ReviewAnswer {
    nodeId: string;
    correctLabel: string;
    userLabel: string | null;
    isCorrect: boolean;
  }

  // Flashcard type definition
  export interface Flashcard {
    id: string;
    title: string;
    description?: string;
    front: string;
    back: string;
    tags?: string[];
    difficulty?: number;
    createdAt: string;
    lastReviewedAt?: string;
    nextReviewAt?: string;
    reviewCount: number;
    deck_id?: string; // Add deck_id field
  }

  // Multiple Choice Question type definition
  export interface MultipleChoiceQuestion {
    id: string;
    title: string;
    description?: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
    tags?: string[];
    difficulty?: number;
    createdAt: string;
    lastReviewedAt?: string;
    nextReviewAt?: string;
    reviewCount: number;
    deck_id?: string;
  }

  export interface ReviewSession {
    sessionId: string;
    createdAt: string;
    maps: ConceptMap[];
    currentIndex: number;
    completed: {
      mapId: string;
      score: number;
      total: number;
      completedAt: string;
    }[];
  }

  // Extended review session type that supports concept maps, flashcards, and multiple choice questions
  export interface ExtendedReviewSession {
    sessionId: string;
    createdAt: string;
    resources: (ConceptMap | Flashcard | MultipleChoiceQuestion | Storyboard)[];
    resourceTypes: ('concept-map' | 'flashcard' | 'multiple-choice' | 'storyboard')[];
    currentIndex: number;
    completed: {
      resourceId: string;
      resourceType: 'concept-map' | 'flashcard' | 'multiple-choice' | 'storyboard';
      score: number; 
      total: number;
      completedAt: string;
    }[];
    isForceReview?: boolean;
  }

  export interface StoryboardScene {
    title: string;
    content_text: string;
    icon_search: {
      primary_term: string;
      alternative_terms: string[];
    }[];
    selectedIcon?: {
      id: string;
      term: string;
      preview_url?: string;
      isPlaceholder?: boolean;
      titleInitial?: string;
      attribution?: {
        name: string;
        url?: string;
      };
    };
  }

  export interface Storyboard {
    id: string;
    title: string;
    description: string;
    scenes: StoryboardScene[];
    createdAt: string;
    lastReviewedAt?: string;
    nextReviewAt?: string;
    reviewCount?: number;
    deck_id?: string;
  }