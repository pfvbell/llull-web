import { MultipleChoiceQuestion } from '@/types/index';
import { log } from '../utils';

interface MultipleChoiceContent {
  question?: string;
  options?: string[];
  correctOptionIndex?: number;
  explanation?: string;
  tags?: string[];
  difficulty?: number;
  [key: string]: unknown;
}

interface DatabaseItem {
  id: string;
  title: string;
  description?: string;
  content: MultipleChoiceContent | string;
  created_at: string;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  review_count: number;
  deck_id?: string;
  [key: string]: unknown;
}

/**
 * Process raw database data into a MultipleChoiceQuestion object
 */
export function processMultipleChoiceData(data: DatabaseItem): MultipleChoiceQuestion | null {
  try {
    // Extract content - parse it if it's a string
    let content: MultipleChoiceContent;
    if (typeof data.content === 'string') {
      try {
        content = JSON.parse(data.content) as MultipleChoiceContent;
        log(`Successfully parsed multiple choice content string for ID ${data.id}`);
      } catch (parseError) {
        console.error(`[ReviewQueue] Error parsing multiple choice content string for ID ${data.id}:`, parseError);
        content = { question: '', options: [], correctOptionIndex: 0, explanation: '', tags: [] };
      }
    } else {
      content = data.content || {};
    }
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      question: content.question || '',
      options: content.options || [],
      correctOptionIndex: content.correctOptionIndex || 0,
      explanation: content.explanation || '',
      tags: content.tags || [],
      difficulty: content.difficulty || 1,
      createdAt: data.created_at,
      lastReviewedAt: data.last_reviewed_at === null ? undefined : data.last_reviewed_at,
      nextReviewAt: data.next_review_at === null ? undefined : data.next_review_at,
      reviewCount: data.review_count || 0,
      deck_id: data.deck_id
    };
  } catch (error) {
    console.error(`[ReviewQueue] Error processing multiple choice data for ID ${data?.id}:`, error);
    return null;
  }
} 