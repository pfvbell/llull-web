import { Flashcard } from '@/types/index';
import { log } from '../utils';

interface FlashcardContent {
  front?: string;
  back?: string;
  tags?: string[];
  difficulty?: number;
  [key: string]: unknown;
}

interface DatabaseItem {
  id: string;
  title: string;
  description?: string;
  content: FlashcardContent | string;
  created_at: string;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  review_count: number;
  deck_id?: string;
  [key: string]: unknown;
}

/**
 * Process raw database data into a Flashcard object
 */
export function processFlashcardData(data: DatabaseItem): Flashcard | null {
  try {
    // Extract content - parse it if it's a string
    let content: FlashcardContent;
    if (typeof data.content === 'string') {
      try {
        content = JSON.parse(data.content) as FlashcardContent;
        log(`Successfully parsed flashcard content string for ID ${data.id}`);
      } catch (parseError) {
        console.error(`[ReviewQueue] Error parsing flashcard content string for ID ${data.id}:`, parseError);
        content = { front: '', back: '', tags: [] };
      }
    } else {
      content = data.content || {};
    }
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      front: content.front || '',
      back: content.back || '',
      tags: content.tags || [],
      difficulty: content.difficulty || 1,
      createdAt: data.created_at,
      lastReviewedAt: data.last_reviewed_at === null ? undefined : data.last_reviewed_at,
      nextReviewAt: data.next_review_at === null ? undefined : data.next_review_at,
      reviewCount: data.review_count || 0,
      deck_id: data.deck_id
    };
  } catch (error) {
    console.error(`[ReviewQueue] Error processing flashcard data for ID ${data?.id}:`, error);
    return null;
  }
} 