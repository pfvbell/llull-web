'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { ConceptMap } from '@/types';
import { supabase } from '@/lib/supabase';
import ConceptFlow from '@/components/flow/ConceptFlow';
import Link from 'next/link';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[ConceptMapEditPage] ${message}`, data ? data : '');
};

export default function ConceptMapEditPage() {
  const [conceptMap, setConceptMap] = useState<ConceptMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEdited, setIsEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Load the concept map
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
        
        log('Received concept map data:', {
          title: data.title,
          id: data.id,
          complexity: data.content?.complexity,
          hasNodes: !!data.content?.nodes?.length,
          hasEdges: !!data.content?.edges?.length,
          hasVersions: !!data.content?.versions?.length
        });
        
        // Transform the data to match our ConceptMap type
        const map: ConceptMap = {
          id: data.id,
          title: data.title,
          topic: data.content?.description || data.title,
          nodes: data.content?.nodes || [],
          edges: data.content?.edges || [],
          versions: processVersionsData(data.content?.versions, data.content) || [],
          complexity: data.content?.complexity || 3,
          createdAt: data.created_at,
          lastReviewedAt: data.last_reviewed_at,
          nextReviewAt: data.next_review_at,
          reviewCount: data.review_count
        };
        
        // Log processed map data for debugging
        log('Processed map data:', {
          title: map.title,
          complexity: map.complexity,
          versionCount: map.versions.length,
          nodesInVersion: map.versions[0]?.nodes.length,
          edgesInVersion: map.versions[0]?.edges.length,
          sampleNodeLabel: map.versions[0]?.nodes[0]?.data?.label || 'No node label found',
          sampleEdgeLabel: map.versions[0]?.edges[0]?.data?.label || 'No edge label found'
        });
        
        setConceptMap(map);
      } catch (error) {
        console.error('Error loading concept map:', error);
        setError('Failed to load concept map');
      } finally {
        setLoading(false);
      }
    }
    
    // Helper function to ensure node and edge labels are preserved in versions
    function processVersionsData(versions: any[] = [], contentData: any = {}) {
      if (!versions || versions.length === 0) {
        // Create a default version using the top-level nodes and edges if available
        log('No versions found, creating default version from content data');
        
        const hasTopLevelNodes = contentData?.nodes && contentData.nodes.length > 0;
        const hasTopLevelEdges = contentData?.edges && contentData.edges.length > 0;
        
        if (hasTopLevelNodes || hasTopLevelEdges) {
          log('Using top-level nodes and edges for default version');
          
          // Process nodes to ensure proper structure
          const processedNodes = hasTopLevelNodes ? 
            contentData.nodes.map((node: any) => ({
              ...node,
              data: {
                ...(node.data || {}),
                label: node.data?.label || (node as any).label || 'Unnamed Concept'
              }
            })) : [];
            
          // Process edges to ensure proper structure
          const processedEdges = hasTopLevelEdges ?
            contentData.edges.map((edge: any) => ({
              ...edge,
              data: {
                ...(edge.data || {}),
                label: edge.data?.label || (edge as any).label || 'relates to'
              }
            })) : [];
            
          return [{
            level: 3,
            nodes: processedNodes,
            edges: processedEdges
          }];
        }
        
        // Fall back to empty version if no nodes or edges found
        return [{
          level: 3,
          nodes: [],
          edges: []
        }];
      }
      
      return versions.map(version => {
        // Process nodes to preserve labels
        const processedNodes = (version.nodes || []).map((node: any) => {
          // Ensure node has proper data structure with label
          return {
            ...node,
            data: {
              ...(node.data || {}),
              label: node.data?.label || (node as any).label || 'Unnamed Concept',
            }
          };
        });
        
        // Process edges to preserve labels
        const processedEdges = (version.edges || []).map((edge: any) => {
          // Ensure edge has proper data structure with label
          return {
            ...edge,
            data: {
              ...(edge.data || {}),
              label: edge.data?.label || (edge as any).label || 'relates to',
            }
          };
        });
        
        return {
          ...version,
          nodes: processedNodes,
          edges: processedEdges
        };
      });
    }
    
    loadConceptMap();
  }, [id]);

  // Handle concept map changes
  const handleConceptMapChange = (updatedMap: any) => {
    log('Concept map updated');
    
    // Ensure we have a complete map with all required properties
    const completeMap: ConceptMap = {
      ...conceptMap as ConceptMap, // Start with existing data
      ...updatedMap, // Override with updated data
      // Ensure required fields
      id: id, // Preserve the ID
      title: updatedMap.title || conceptMap?.title || 'Untitled Concept Map',
      topic: updatedMap.topic || conceptMap?.topic || updatedMap.title || '',
      nodes: updatedMap.nodes || conceptMap?.nodes || [],
      edges: updatedMap.edges || conceptMap?.edges || [],
      versions: updatedMap.versions || conceptMap?.versions || [],
      complexity: conceptMap?.complexity || 3 // Preserve complexity
    };
    
    setConceptMap(completeMap);
    setIsEdited(true);
  };
  
  // Save changes to the concept map
  const handleSave = async () => {
    if (!conceptMap) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    log('Saving concept map changes...');
    
    try {
      let userId = null;
      
      // Try to get the user ID, but continue even if not authenticated
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
        log('User ID:', userId);
      } catch (authError) {
        log('Not authenticated, continuing in dev mode');
      }
      
      // Log the conceptMap structure for debugging
      log('conceptMap structure before saving:', {
        id: conceptMap.id,
        title: conceptMap.title,
        hasDescription: (conceptMap as any).description !== undefined,
        hasTopic: (conceptMap as any).topic !== undefined,
        nodeCount: conceptMap.nodes?.length || 0,
        edgeCount: conceptMap.edges?.length || 0,
        versionCount: conceptMap.versions?.length || 0
      });
      
      // Process nodes and edges to ensure they have the correct format
      const processedNodes = (conceptMap.nodes || []).map(node => ({
        ...node,
        data: {
          ...(node.data || {}),
          label: node.data?.label || (node as any).label || 'Unnamed Concept'
        },
        label: (node as any).label || node.data?.label || 'Unnamed Concept'
      }));
      
      const processedEdges = (conceptMap.edges || []).map(edge => ({
        ...edge,
        data: {
          ...(edge.data || {}),
          label: edge.data?.label || (edge as any).label || 'relates to'
        },
        label: (edge as any).label || edge.data?.label || 'relates to'
      }));
      
      // Process versions to ensure they have the correct format
      const processedVersions = (conceptMap.versions || []).map(version => ({
        ...version,
        nodes: (version.nodes || []).map(node => ({
          ...node,
          data: {
            ...(node.data || {}),
            label: node.data?.label || (node as any).label || 'Unnamed Concept'
          },
          label: (node as any).label || node.data?.label || 'Unnamed Concept'
        })),
        edges: (version.edges || []).map(edge => ({
          ...edge,
          data: {
            ...(edge.data || {}),
            label: edge.data?.label || (edge as any).label || 'relates to'
          },
          label: (edge as any).label || edge.data?.label || 'relates to'
        }))
      }));
      
      // Create a clean content object to avoid circular references
      const cleanContent = {
        title: conceptMap.title || 'Untitled Concept Map',
        description: (conceptMap as any).description || 
                    (conceptMap as any).topic || 
                    conceptMap.title || 
                    'Untitled Concept Map',
        topic: (conceptMap as any).topic || 
              (conceptMap as any).description || 
              conceptMap.title || 
              'Untitled Concept Map',
        nodes: processedNodes,
        edges: processedEdges,
        versions: processedVersions,
        complexity: conceptMap.complexity || 3
      };
      
      // Verify that the content structure follows the database schema
      log('Checking content structure against schema:', {
        title: cleanContent.title,
        description: cleanContent.description,
        complexity: cleanContent.complexity,
        nodeCount: cleanContent.nodes.length,
        edgeCount: cleanContent.edges.length,
        versionCount: cleanContent.versions.length
      });
      
      // Prepare data for saving - only use fields that exist in the database schema
      const mapToSave: any = {
        title: conceptMap.title || 'Untitled Concept Map',
        // Put everything else in the content field as JSON
        content: cleanContent
      };
      
      // If user is authenticated, include user_id
      if (userId) {
        mapToSave.user_id = userId;
      }
      
      log('Saving map to Supabase:', {
        id: conceptMap.id,
        title: mapToSave.title,
        contentTopic: cleanContent.topic,
        contentComplexity: cleanContent.complexity,
        nodeCount: cleanContent.nodes.length,
        edgeCount: cleanContent.edges.length,
        versionCount: cleanContent.versions.length
      });
      
      // Update in Supabase
      const { data, error } = await supabase
        .from('concept_maps')
        .update(mapToSave)
        .eq('id', conceptMap.id)
        .select('id');
        
      if (error) {
        log('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      log('Update successful, returned data:', data);
      
      setSaveMessage({
        text: "Your concept map has been updated",
        type: 'success'
      });
      
      setIsEdited(false);
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error updating concept map:', error);
      
      // Log detailed error information
      log('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.slice(0, 200), // Just the first part of the stack trace
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      setSaveMessage({
        text: `Error: ${error.message || "There was a problem updating your concept map"}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
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
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">{conceptMap.title}</h2>
        <div className="flex gap-3 items-center">
          {saveMessage && (
            <span className={`text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage.text}
            </span>
          )}
          
          {isEdited && (
            <span className="text-orange-500 italic self-center">
              Unsaved changes
            </span>
          )}
          
          <button
            onClick={handleSave}
            disabled={!isEdited || isSaving}
            className={`px-4 py-2 rounded-md ${
              isEdited && !isSaving 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-300 text-gray-700'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          
          <Link
            href="/dashboard"
            className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back to Memory Bank
          </Link>
        </div>
      </div>
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <ConceptFlow 
            conceptMap={{
              ...conceptMap,
              // Add any properties required by ConceptFlow but not in our ConceptMap type
              topic: conceptMap.topic
            } as any}
            onConceptMapChange={handleConceptMapChange}
            readOnly={false}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
} 