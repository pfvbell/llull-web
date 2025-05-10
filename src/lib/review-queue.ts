/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import directly from '@/lib/review-queue' instead.
 */

/**
 * This module contains functions and types for the review queue system.
 * The implementation has been modularized for better maintainability,
 * but this file provides backwards compatibility with existing imports.
 */

// Re-export the main interfaces and types
export type {
  ExtendedReviewSession
} from './review-queue/index';

// Re-export logging utility
export { log } from './review-queue/utils';

// Re-export main functionality
export {
  generateCombinedReviewQueue,
  generateReviewQueue
} from './review-queue/queue-generator';

export {
  updateResourceReviewStatus,
  updateReviewStatus,
  updateFlashcardReviewStatus
} from './review-queue/resource-updater';

// Re-export processors
export {
  processConceptMapData,
  processFlashcardData,
  processMultipleChoiceData,
  processStoryboardData
} from './review-queue/processors'; 