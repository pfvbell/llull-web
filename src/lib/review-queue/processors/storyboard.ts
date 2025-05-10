import { Storyboard, StoryboardScene } from '@/types/index';
import { log } from '../utils';

interface SceneIcon {
  id: string;
  term: string;
  isPlaceholder?: boolean;
  titleInitial: string;
  [key: string]: unknown;
}

// Adjusted interface to match what StoryboardScene expects
interface IconSearchItem {
  primary_term: string;
  alternative_terms: string[];
}

interface Scene {
  title?: string;
  content_text?: string;
  icon_search?: string[] | IconSearchItem[];
  selectedIcon?: SceneIcon;
  [key: string]: unknown;
}

interface StoryboardContent {
  description?: string;
  scenes?: Scene[];
  [key: string]: unknown;
}

interface DatabaseItem {
  id: string;
  title: string;
  description?: string;
  content: StoryboardContent | string;
  created_at: string;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  review_count: number;
  deck_id?: string;
  [key: string]: unknown;
}

/**
 * Process raw database data into a Storyboard object
 */
export function processStoryboardData(data: DatabaseItem): Storyboard | null {
  try {
    log(`Processing storyboard data: ${data.id} - ${data.title}`);
    
    // Extract content from the database item - parse it if it's a string
    let content: StoryboardContent;
    if (typeof data.content === 'string') {
      log(`Storyboard ${data.id} has string content, attempting to parse`);
      try {
        content = JSON.parse(data.content) as StoryboardContent;
        log(`Successfully parsed storyboard content string for ID ${data.id}`);
      } catch (parseError) {
        console.error(`[ReviewQueue] Error parsing storyboard content string for ID ${data.id}:`, parseError);
        content = { description: '', scenes: [] };
      }
    } else {
      log(`Storyboard ${data.id} has ${data.content ? 'object' : 'null/undefined'} content`);
      content = data.content || {};
    }
    
    if (!content.scenes || !Array.isArray(content.scenes)) {
      log(`Warning: Storyboard ${data.id} has missing or invalid scenes array`, content);
      content.scenes = [];
    }
    
    // Ensure each scene has the required properties
    const processedScenes = content.scenes.map((scene: Scene, index: number) => {
      if (!scene || typeof scene !== 'object') {
        log(`Warning: Scene ${index} in storyboard ${data.id} is not an object`, scene);
        return {
          title: `Scene ${index + 1}`,
          content_text: 'Content not available',
          icon_search: [{
            primary_term: `Scene ${index + 1}`,
            alternative_terms: []
          }],
          selectedIcon: {
            id: `placeholder-${index}`,
            term: `Scene ${index + 1}`,
            isPlaceholder: true,
            titleInitial: `${index + 1}`
          }
        };
      }
      
      // Convert icon_search from string[] to format StoryboardScene expects
      const iconSearch = Array.isArray(scene.icon_search) 
        ? scene.icon_search.map((term: string | IconSearchItem) => {
            if (typeof term === 'string') {
              return {
                primary_term: term,
                alternative_terms: []
              };
            }
            return term;
          })
        : [{
            primary_term: scene.title || `Scene ${index + 1}`,
            alternative_terms: []
          }];
      
      // Ensure required properties exist
      return {
        title: scene.title || `Scene ${index + 1}`,
        content_text: scene.content_text || 'Content not available',
        icon_search: iconSearch,
        selectedIcon: scene.selectedIcon || {
          id: `placeholder-${index}`,
          term: scene.title || `Scene ${index + 1}`,
          isPlaceholder: true,
          titleInitial: (scene.title || `S${index + 1}`).charAt(0).toUpperCase()
        }
      };
    });
    
    log(`Processed storyboard ${data.id}: ${processedScenes.length} scenes`);
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      scenes: processedScenes as StoryboardScene[],
      createdAt: data.created_at,
      lastReviewedAt: data.last_reviewed_at === null ? undefined : data.last_reviewed_at,
      nextReviewAt: data.next_review_at === null ? undefined : data.next_review_at,
      reviewCount: data.review_count || 0,
      deck_id: data.deck_id
    };
  } catch (error) {
    console.error(`[ReviewQueue] Error processing storyboard data for ID ${data?.id}:`, error);
    return null;
  }
} 