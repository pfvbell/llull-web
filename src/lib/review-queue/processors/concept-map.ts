import { ConceptMap, ConceptNode, ConceptEdge, ConceptMapVersion } from '@/types/index';
import { log } from '../utils';

interface Node {
  id: string;
  label: string;
  data?: { label?: string };
  position?: { x: number; y: number };
  [key: string]: unknown;
}

interface Edge {
  id: string;
  label: string;
  source: string;
  target: string;
  data?: { label?: string };
  [key: string]: unknown;
}

interface Version {
  id: string;
  level: number;
  nodes: Node[];
  edges: Edge[];
  [key: string]: unknown;
}

interface ContentData {
  nodes?: Node[];
  edges?: Edge[];
  versions?: Version[];
  description?: string;
  topic?: string;
  complexity?: number;
  [key: string]: unknown;
}

interface DatabaseItem {
  id: string;
  title: string;
  content: ContentData | string;
  created_at: string;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  review_count: number;
  deck_id?: string;
  [key: string]: unknown;
}

/**
 * Process raw database data into a ConceptMap object
 */
export function processConceptMapData(data: DatabaseItem): ConceptMap | null {
  try {
    // Extract content from the database item - parse it if it's a string
    let content: ContentData;
    if (typeof data.content === 'string') {
      try {
        content = JSON.parse(data.content) as ContentData;
        log(`Successfully parsed concept map content string for ID ${data.id}`);
      } catch (parseError) {
        console.error(`[ReviewQueue] Error parsing concept map content string for ID ${data.id}:`, parseError);
        content = { nodes: [], edges: [], versions: [] };
      }
    } else {
      content = data.content || {};
    }
    
    // Ensure nodes have the required label property and position
    const nodes = (content.nodes || []).map((node: Node) => ({
      ...node,
      label: node.data?.label || node.label || 'Unnamed Concept',
      position: node.position || { x: 0, y: 0 }  // Ensure position exists
    })) as ConceptNode[];
    
    // Ensure edges have required properties
    const edges = (content.edges || []).map((edge: Edge) => ({
      ...edge,
      label: edge.data?.label || edge.label || 'relates to',
      source: edge.source || '',  // Ensure source exists
      target: edge.target || ''   // Ensure target exists
    })) as ConceptEdge[];
    
    // Process versions
    const versions = (content.versions || []).map((version: Version) => ({
      ...version,
      level: version.level || 0,  // Ensure level exists
      nodes: (version.nodes || []).map((node: Node) => ({
        ...node,
        label: node.data?.label || node.label || 'Unnamed Concept',
        position: node.position || { x: 0, y: 0 }  // Ensure position exists
      })),
      edges: (version.edges || []).map((edge: Edge) => ({
        ...edge,
        label: edge.data?.label || edge.label || 'relates to',
        source: edge.source || '',  // Ensure source exists
        target: edge.target || ''   // Ensure target exists
      }))
    })) as ConceptMapVersion[];
    
    // Create description from content or title
    const description = content.description || content.topic || data.title;
    
    return {
      id: data.id,
      title: data.title,
      description,
      nodes,
      edges,
      versions,
      complexity: content.complexity || 3,
      createdAt: data.created_at,
      lastReviewedAt: data.last_reviewed_at === null ? undefined : data.last_reviewed_at,
      nextReviewAt: data.next_review_at === null ? undefined : data.next_review_at,
      reviewCount: data.review_count || 0,
      deck_id: data.deck_id
    };
  } catch (error) {
    console.error(`[ReviewQueue] Error processing concept map data for ID ${data?.id}:`, error);
    return null;
  }
} 