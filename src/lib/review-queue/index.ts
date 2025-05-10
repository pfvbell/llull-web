// Export types and main functions
import { v4 as uuidv4 } from 'uuid';
import { 
  ConceptMap, 
  Flashcard, 
  MultipleChoiceQuestion, 
  Storyboard,
  ReviewSession
} from '@/types/index';
import { ResourceType } from '../spaced-repetition';

// Import and re-export shared utilities
export { log } from './utils';

// Define an updated ExtendedReviewSession interface that includes storyboards
export interface ExtendedReviewSession {
  sessionId: string;
  createdAt: string;
  resources: (ConceptMap | Flashcard | MultipleChoiceQuestion | Storyboard)[];
  resourceTypes: ResourceType[];
  currentIndex: number;
  completed: {
    resourceId: string;
    resourceType: ResourceType;
    score: number; 
    total: number;
    completedAt: string;
    hintsUsed?: boolean;
  }[];
}

// Re-export everything from other files
export * from '@/lib/review-queue/queue-generator';
export * from '@/lib/review-queue/resource-updater';
export * from '@/lib/review-queue/processors'; 