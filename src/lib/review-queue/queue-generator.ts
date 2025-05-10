import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase';
import { 
  ConceptMap, 
  Flashcard, 
  MultipleChoiceQuestion, 
  Storyboard,
  ReviewSession
} from '@/types/index';
import { ResourceType } from '../spaced-repetition';
import { ExtendedReviewSession } from './index';
import { log } from './utils';
import { 
  processConceptMapData, 
  processFlashcardData, 
  processMultipleChoiceData, 
  processStoryboardData 
} from './processors';

/**
 * Resource data as returned from database queries
 */
interface DatabaseItem {
  id: string;
  title: string;
  description?: string;
  content: Record<string, unknown> | string;
  created_at: string;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  review_count: number;
  deck_id?: string;
  user_id?: string;
  [key: string]: unknown;
}

/**
 * Resource with type information
 */
interface Resource {
  type: ResourceType;
  data: DatabaseItem;
}

/**
 * Generates a review queue based on spaced repetition principles.
 * Selects concept maps that are due for review (next_review_at is null or in the past)
 * and sorts them alphabetically by title.
 * 
 * @param limit The maximum number of concept maps to include in the queue (default: 3)
 * @returns A Promise that resolves to a ReviewSession object
 * 
 * @deprecated Use generateCombinedReviewQueue instead
 */
export async function generateReviewQueue(limit: number = 3): Promise<ReviewSession | null> {
  try {
    log('Generating concept map review queue with limit:', limit);
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[ReviewQueue] Error getting user:', userError);
      return null;
    }
    
    // Query the database for concept maps due for review
    const { data, error } = await supabase
      .from('concept_maps')
      .select('*')
      .or('next_review_at.is.null,next_review_at.lte.now()')
      .order('title', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('[ReviewQueue] Error querying concept maps:', error);
      return null;
    }
    
    // If no maps are found, return null
    if (!data || data.length === 0) {
      log('No concept maps found for review');
      return null;
    }
    
    log(`Found ${data.length} concept maps for review`);
    
    // Transform the data to match our ConceptMap type
    const maps: ConceptMap[] = data
      .map(item => processConceptMapData(item as DatabaseItem))
      .filter(Boolean) as ConceptMap[];
    
    // Create a new review session
    const reviewSession: ReviewSession = {
      sessionId: uuidv4(),
      createdAt: new Date().toISOString(),
      maps,
      currentIndex: 0,
      completed: []
    };
    
    log('Created review session:', {
      sessionId: reviewSession.sessionId,
      mapCount: reviewSession.maps.length,
      firstMapTitle: reviewSession.maps[0]?.title
    });
    
    return reviewSession;
  } catch (error) {
    console.error('[ReviewQueue] Error generating review queue:', error);
    return null;
  }
}

/**
 * Generates a combined review queue with a mix of different resource types.
 * First prioritizes resources that are due for review, then fills remaining slots with other resources.
 * 
 * @param limit The maximum number of resources to include in the queue (default: 5)
 * @param includeAll Whether to include non-due resources if needed to meet the limit (default: true)
 * @returns A Promise that resolves to an ExtendedReviewSession object
 */
export async function generateCombinedReviewQueue(
  limit: number = 5,
  includeAll: boolean = true
): Promise<ExtendedReviewSession | null> {
  try {
    if (![3, 5, 10, 25].includes(limit)) {
      limit = 5; // Default to 5 if an invalid limit is provided
    }
    
    log(`Generating combined review queue with limit: ${limit}, includeAll: ${includeAll}`);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[ReviewQueue] Error getting user:', userError);
      return null;
    }
    
    if (!user) {
      log('No user found');
      return null;
    }
    
    // Calculate the fetch limit - fetch more items than needed
    const fetchLimit = limit * 3; // Fetch more to ensure we have enough
    
    // Current timestamp for comparing review dates
    const now = new Date().toISOString();
    const userId = user.id;
    
    // Define resource types to query
    const resourceTypesToQuery: ResourceType[] = ['concept-map', 'flashcard', 'multiple-choice', 'storyboard'];
    
    log(`Querying for resources. User ID: ${userId}`);
    
    // Store resources that are due for review and other resources separately
    let dueResources: Resource[] = [];
    let otherResources: Resource[] = [];
    
    // Query each resource type
    for (const type of resourceTypesToQuery) {
      const tableName = type === 'concept-map' ? 'concept_maps' :
                      type === 'flashcard' ? 'flashcards' :
                      type === 'multiple-choice' ? 'multiple_choice_questions' :
                      'storyboards';
      
      // First get resources due for review
      log(`Querying ${tableName} for resources due for review`);
      const { data: dueData, error: dueError } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .or(`next_review_at.lte.${now},next_review_at.is.null`)
        .order('last_reviewed_at', { ascending: true, nullsFirst: true })
        .limit(fetchLimit);
      
      if (dueError) {
        console.error(`[ReviewQueue] Error querying ${type} for due resources:`, dueError);
        continue;
      }
      
      if (dueData && dueData.length > 0) {
        log(`Found ${dueData.length} ${type} resources due for review`);
        dueResources = [...dueResources, ...dueData.map(item => ({ 
          type, 
          data: item as DatabaseItem 
        }))];
      } else {
        log(`No ${type} resources found due for review`);
      }
      
      // If we need to include all resources to meet the limit
      if (includeAll) {
        // Get non-due resources if needed
        log(`Querying ${tableName} for non-due resources`);
        const { data: otherData, error: otherError } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', userId)
          .gt('next_review_at', now)
          .order('last_reviewed_at', { ascending: true, nullsFirst: true })
          .limit(fetchLimit);
        
        if (otherError) {
          console.error(`[ReviewQueue] Error querying ${type} for other resources:`, otherError);
          continue;
        }
        
        if (otherData && otherData.length > 0) {
          log(`Found ${otherData.length} additional ${type} resources`);
          otherResources = [...otherResources, ...otherData.map(item => ({ 
            type, 
            data: item as DatabaseItem 
          }))];
        }
      }
    }
    
    // If no resources are found at all
    if (dueResources.length === 0 && otherResources.length === 0) {
      log('No resources found for review');
      return null;
    }
    
    // Log the breakdown by type
    const dueTypeCounts = dueResources.reduce((counts, resource) => {
      counts[resource.type] = (counts[resource.type] || 0) + 1;
      return counts;
    }, {} as Record<ResourceType, number>);
    
    log('Due resources by type:', dueTypeCounts);
    
    // Sort by last reviewed date (oldest first, null values first)
    dueResources.sort((a, b) => {
      if (!a.data.last_reviewed_at) return -1;
      if (!b.data.last_reviewed_at) return 1;
      return new Date(a.data.last_reviewed_at).getTime() - new Date(b.data.last_reviewed_at).getTime();
    });
    
    otherResources.sort((a, b) => {
      if (!a.data.last_reviewed_at) return -1;
      if (!b.data.last_reviewed_at) return 1;
      return new Date(a.data.last_reviewed_at).getTime() - new Date(b.data.last_reviewed_at).getTime();
    });
    
    log(`Found ${dueResources.length} total resources due for review and ${otherResources.length} other resources`);
    
    // Select exactly the number of resources specified by the limit
    const selectedResources: Resource[] = [];
    
    // First add due resources until we reach the limit - count by actual items, not weight
    for (const resource of dueResources) {
      // If we've reached the limit, stop
      if (selectedResources.length >= limit) break;
      
      selectedResources.push(resource);
      log(`Selected due ${resource.type}, count: ${selectedResources.length}/${limit}`);
    }
    
    // If we still haven't reached the limit and includeAll is true, add other resources
    if (selectedResources.length < limit && includeAll) {
      for (const resource of otherResources) {
        // If we've reached the limit, stop
        if (selectedResources.length >= limit) break;
        
        selectedResources.push(resource);
        log(`Selected non-due ${resource.type}, count: ${selectedResources.length}/${limit}`);
      }
    }
    
    // Log the final selection breakdown by type
    const selectedCounts = selectedResources.reduce((counts, resource) => {
      counts[resource.type] = (counts[resource.type] || 0) + 1;
      return counts;
    }, {} as Record<ResourceType, number>);
    
    log(`Selected ${selectedResources.length} resources`);
    log('Selected resources by type:', selectedCounts);
    
    // Process the resources
    const resources: (ConceptMap | Flashcard | MultipleChoiceQuestion | Storyboard)[] = [];
    const resourceTypesForSession: ResourceType[] = [];
    
    for (const item of selectedResources) {
      let processedResource = null;
      
      switch (item.type) {
        case 'concept-map':
          processedResource = processConceptMapData(item.data);
          break;
        case 'flashcard':
          processedResource = processFlashcardData(item.data);
          break;
        case 'multiple-choice':
          processedResource = processMultipleChoiceData(item.data);
          break;
        case 'storyboard':
          log(`Processing storyboard item: ${item.data.id} - ${item.data.title}`);
          processedResource = processStoryboardData(item.data);
          log('Processed storyboard resource:', { 
            id: processedResource?.id, 
            title: processedResource?.title,
            scenesCount: processedResource?.scenes?.length
          });
          break;
      }
      
      if (processedResource) {
        resources.push(processedResource);
        resourceTypesForSession.push(item.type);
        log(`Added ${item.type} resource to session: ${processedResource.id} - ${processedResource.title}`);
      } else {
        log(`Failed to process ${item.type} resource with ID ${item.data?.id}, skipping`);
      }
    }
    
    // Create the review session
    const reviewSession: ExtendedReviewSession = {
      sessionId: uuidv4(),
      createdAt: new Date().toISOString(),
      resources,
      resourceTypes: resourceTypesForSession,
      currentIndex: 0,
      completed: []
    };
    
    log('Created combined review session:', {
      sessionId: reviewSession.sessionId,
      resourceCount: reviewSession.resources.length,
      resourceTypes: resourceTypesForSession.join(', '),
      typeBreakdown: resourceTypesForSession.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<ResourceType, number>)
    });
    
    return reviewSession;
  } catch (error) {
    console.error('[ReviewQueue] Error generating combined review queue:', error);
    return null;
  }
} 