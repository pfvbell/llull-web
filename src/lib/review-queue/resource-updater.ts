import { ResourceType, updateResourceReviewStatus as updateWithLlullAlgorithm } from '../spaced-repetition';
import { log } from './utils';

/**
 * Updates a resource's review information after a review is completed.
 * This is a wrapper for the Llull Algorithm implementation.
 * 
 * @param resourceId The ID of the resource
 * @param score The score achieved in the review
 * @param total The total possible score
 * @param resourceType The type of resource being reviewed
 * @returns A Promise that resolves to a boolean indicating success
 */
export async function updateResourceReviewStatus(
  resourceId: string, 
  score: number, 
  total: number, 
  resourceType: ResourceType
): Promise<boolean> {
  log(`Updating review status for ${resourceType} ${resourceId} with score ${score}/${total}`);
  return updateWithLlullAlgorithm(resourceId, score, total, resourceType);
}

/**
 * Updates a concept map's review information after a review is completed.
 * This is a wrapper for updateResourceReviewStatus with 'concept-map' type.
 * 
 * @param mapId The ID of the concept map
 * @param score The score achieved in the review
 * @param total The total possible score
 * @returns A Promise that resolves to a boolean indicating success
 * 
 * @deprecated Use updateResourceReviewStatus instead
 */
export async function updateReviewStatus(mapId: string, score: number, total: number): Promise<boolean> {
  log(`Updating concept map review status (deprecated method) for ${mapId}`);
  return updateResourceReviewStatus(mapId, score, total, 'concept-map');
}

/**
 * Updates a flashcard's review information after a review is completed.
 * This is a wrapper for updateResourceReviewStatus with 'flashcard' type.
 * 
 * @param cardId The ID of the flashcard
 * @param score The score achieved in the review
 * @param total The total possible score
 * @returns A Promise that resolves to a boolean indicating success
 * 
 * @deprecated Use updateResourceReviewStatus instead
 */
export async function updateFlashcardReviewStatus(cardId: string, score: number, total: number): Promise<boolean> {
  log(`Updating flashcard review status (deprecated method) for ${cardId}`);
  return updateResourceReviewStatus(cardId, score, total, 'flashcard');
} 