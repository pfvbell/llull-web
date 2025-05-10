/**
 * src/lib/spaced-repetition.ts
 * 
 * Implements the Llull Memorization Algorithm for optimized spaced repetition
 * and provides standardized performance scoring across different resource types.
 */

import { supabase } from './supabase';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[SpacedRepetition] ${message}`, data ? data : '');
};

// Resource type definitions
export type ResourceType = 'concept-map' | 'flashcard' | 'multiple-choice' | 'storyboard';

// Performance bands for standardized scoring
export enum PerformanceBand {
  Poor = 0.3,    // Significant difficulty recalling
  Fair = 0.5,    // Partial recall with effort
  Good = 0.8,    // Good recall with minor hesitation
  Perfect = 1.0  // Immediate and confident recall
}

/**
 * Helper function to convert resource type to database table name
 * 
 * @param resourceType The type of resource
 * @returns The corresponding database table name
 */
export function getTableName(resourceType: ResourceType): string {
  switch (resourceType) {
    case 'concept-map':
      return 'concept_maps';
    case 'flashcard':
      return 'flashcards';
    case 'multiple-choice':
      return 'multiple_choice_questions';
    case 'storyboard':
      return 'storyboards';
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }
}

/**
 * Maps raw performance scores to standardized performance bands
 * 
 * @param score The raw score achieved
 * @param total The total possible score
 * @param resourceType The type of resource being reviewed
 * @returns A standardized performance band value
 */
export function calculateStandardizedPerformance(
  score: number,
  total: number,
  resourceType: ResourceType
): number {
  // Calculate raw performance ratio
  const rawPerformance = total > 0 ? score / total : 0;
  
  log(`Raw performance for ${resourceType}: ${rawPerformance.toFixed(2)} (${score}/${total})`);
  
  // Map to standardized performance bands
  if (rawPerformance >= 0.95) {
    return PerformanceBand.Perfect;
  } else if (rawPerformance >= 0.8) {
    return PerformanceBand.Good;
  } else if (rawPerformance >= 0.6) {
    return PerformanceBand.Fair;
  } else {
    return PerformanceBand.Poor;
  }
}

/**
 * Calculate the next review date based on the Llull Algorithm
 * 
 * @param performance Standardized performance (0.3, 0.5, 0.8, 1.0)
 * @param reviewCount Number of previous reviews (0 for first review)
 * @returns Number of days until next review
 */
export function calculateNextReview(performance: number, reviewCount: number): number {
  // Base values for each performance band at first review
  const baseIntervals = {
    [PerformanceBand.Poor]: 1,     // 1 day for poor performance
    [PerformanceBand.Fair]: 3,     // 3 days for fair performance
    [PerformanceBand.Good]: 5,     // 5 days for good performance
    [PerformanceBand.Perfect]: 7   // 7 days for perfect performance
  };
  
  // Get the base interval for this performance
  let interval = baseIntervals[performance as PerformanceBand] || baseIntervals[PerformanceBand.Fair];
  
  // Apply the Llull Algorithm scaling factors based on review count
  if (reviewCount > 0) {
    // For subsequent reviews, scale the interval up:
    // - For perfect recall: multiply by ~1.5-2x per review
    // - For good recall: multiply by ~1.3-1.5x per review
    // - For fair recall: multiply by ~1.1-1.2x per review
    // - For poor recall: reset to 1 day
    
    if (performance === PerformanceBand.Perfect) {
      // Perfect recall - more aggressive scaling
      interval = Math.round(interval * Math.pow(1.8, Math.min(reviewCount, 5)));
      
      // Cap at 180 days (6 months) maximum
      interval = Math.min(interval, 180);
    } 
    else if (performance === PerformanceBand.Good) {
      // Good recall - moderate scaling
      interval = Math.round(interval * Math.pow(1.4, Math.min(reviewCount, 5)));
      
      // Cap at 60 days (2 months) maximum
      interval = Math.min(interval, 60);
    }
    else if (performance === PerformanceBand.Fair) {
      // Fair recall - conservative scaling
      interval = Math.round(interval * Math.pow(1.15, Math.min(reviewCount, 5)));
      
      // Cap at 14 days (2 weeks) maximum
      interval = Math.min(interval, 14);
    }
    else {
      // Poor recall - reset to 1 day regardless of review count
      interval = 1;
    }
  }
  
  log(`Calculated review interval: ${interval} days (performance: ${performance}, review count: ${reviewCount})`);
  return interval;
}

/**
 * Updates a resource's review information in the database after a review is completed.
 * Applies the Llull Algorithm to determine the next review date.
 * 
 * @param resourceId The ID of the resource
 * @param score The raw score achieved in the review
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
  try {
    log(`Updating review status for ${resourceType} ${resourceId}: ${score}/${total}`);
    
    // Get the table name for this resource type
    const tableName = getTableName(resourceType);
    
    // Get the current resource to retrieve its review count
    const { data: currentResource, error: getError } = await supabase
      .from(tableName)
      .select('review_count')
      .eq('id', resourceId)
      .single();
    
    if (getError) {
      console.error(`[SpacedRepetition] Error getting current ${resourceType}:`, getError);
      return false;
    }
    
    // Calculate standardized performance
    const standardizedPerformance = calculateStandardizedPerformance(score, total, resourceType);
    
    // Get current review count (default to 0 if not available)
    const reviewCount = currentResource?.review_count || 0;
    
    // Calculate days until next review using the Llull Algorithm
    const daysUntilNextReview = calculateNextReview(standardizedPerformance, reviewCount);
    
    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilNextReview);
    
    log(`Next review scheduled for ${resourceType} ${resourceId}: ${nextReviewDate.toISOString()} (in ${daysUntilNextReview} days)`);
    log(`Review statistics: performance band ${standardizedPerformance}, review count ${reviewCount + 1}`);
    
    // Update the resource in the database
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        last_reviewed_at: new Date().toISOString(),
        next_review_at: nextReviewDate.toISOString(),
        review_count: reviewCount + 1
      })
      .eq('id', resourceId);
    
    if (updateError) {
      console.error(`[SpacedRepetition] Error updating ${resourceType} review status:`, updateError);
      return false;
    }
    
    log(`Successfully updated ${resourceType} review status`);
    return true;
  } catch (error) {
    console.error(`[SpacedRepetition] Error updating ${resourceType} review status:`, error);
    return false;
  }
}

/**
 * Gets the appropriate weight for a resource type for queue generation
 * Concept maps and storyboards count as 2, others as 1
 * 
 * @param resourceType The type of resource
 * @returns The resource weight
 */
export function getResourceWeight(resourceType: ResourceType): number {
  switch (resourceType) {
    case 'concept-map':
    case 'storyboard':
      return 2;
    default:
      return 1;
  }
}

/**
 * Checks if a resource is due for review
 * 
 * @param nextReviewAt The timestamp when the resource is next due for review
 * @returns Boolean indicating if the resource is due
 */
export function isResourceDueForReview(nextReviewAt: string | null | undefined): boolean {
  if (!nextReviewAt) return true; // If no review date set, it's due
  
  const now = new Date();
  const reviewDate = new Date(nextReviewAt);
  
  return reviewDate <= now;
} 