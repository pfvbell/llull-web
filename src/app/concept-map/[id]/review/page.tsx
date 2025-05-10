// src/app/concept-map/[id]/review/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Import from the index file to match the types used in ConceptMapReview
import { ConceptMap as ConceptMapType } from '@/types/index';
// Original import for backward compatibility
import { ConceptMap as OriginalConceptMap } from '@/types';
import { supabase } from '@/lib/supabase';
import ConceptMapReview from '@/components/ConceptMapReview';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[ReviewPage] ${message}`, data ? data : '');
};

export default function ReviewPage() {
  const [conceptMap, setConceptMap] = useState<ConceptMapType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    async function loadConceptMap() {
      try {
        if (!id) {
          setError('No concept map ID provided');
          setLoading(false);
          return;
        }
        
        log('Loading concept map with ID:', id);
        
        const { data, error } = await supabase
          .from('concept_maps')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          setError('Concept map not found');
          setLoading(false);
          return;
        }
        
        log('Received concept map data from database:', { title: data.title });
        
        // Transform the data to match our ConceptMap type
        // We need to convert the nodes and edges to match the expected ConceptNode format
        const content = data.content || {};
        
        // Extract nodes and ensure they have the required 'label' property
        const nodes = (content.nodes || []).map((node: any) => ({
          ...node,
          // Ensure we have the label property required by ConceptNode
          label: node.data?.label || node.label || 'Unnamed Concept',
        }));
        
        // Extract edges
        const edges = (content.edges || []).map((edge: any) => ({
          ...edge,
          // Ensure label is available
          label: edge.data?.label || edge.label || '',
        }));
        
        // Extract versions and ensure they have the right format
        const versions = (content.versions || []).map((version: any) => ({
          ...version,
          // Convert nodes in each version
          nodes: (version.nodes || []).map((node: any) => ({
            ...node,
            label: node.data?.label || node.label || 'Unnamed Concept',
          })),
          // Convert edges in each version
          edges: (version.edges || []).map((edge: any) => ({
            ...edge,
            label: edge.data?.label || edge.label || '',
          })),
        }));
        
        // Create a properly typed ConceptMap
        const map: ConceptMapType = {
          id: data.id,
          title: data.title,
          description: content.description || content.title || '',
          complexity: content.complexity || 1,
          nodes,
          edges,
          versions,
          createdAt: data.created_at,
          lastReviewedAt: data.last_reviewed_at,
          nextReviewAt: data.next_review_at,
          reviewCount: data.review_count
        };
        
        log('Processed concept map for review:', { 
          nodeCount: nodes.length, 
          edgeCount: edges.length,
          versionCount: versions.length 
        });
        
        setConceptMap(map);
      } catch (error) {
        console.error('Error loading concept map:', error);
        setError('Failed to load concept map');
      } finally {
        setLoading(false);
      }
    }
    
    loadConceptMap();
  }, [id]);

  const handleReviewComplete = (score: number, total: number) => {
    log(`Review completed with score ${score}/${total}`);
    // Update database record but don't redirect automatically
    log('Review complete - no automatic redirect');
    
    // Note: The return to Memory Bank button in the ConceptMapReview component 
    // can be used by the user to navigate back when they choose to
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !conceptMap) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-6">{error || 'Failed to load concept map'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Memory Bank
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{conceptMap.title} - Review</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          Back to Memory Bank
        </button>
      </div>
      
      <ConceptMapReview 
        conceptMap={conceptMap} 
        onComplete={handleReviewComplete} 
      />
    </div>
  );
}