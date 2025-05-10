// src/components/ConceptMapEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useRouter } from 'next/navigation';
import ResourceGenerator from './ResourceGenerator';
import ConceptFlow from './flow/ConceptFlow';
import { ConceptMap, ConceptNode, ConceptEdge, ConceptMapVersion } from '@/types/index';
import { supabase } from '@/lib/supabase';
// Toast import removed

// Log for debugging
const log = (message: string, data?: any) => {
  console.log(`[ConceptMapEditor] ${message}`, data);
};

export default function ConceptMapEditor() {
  const [conceptMap, setConceptMap] = useState<ConceptMap | null>(null);
  const [isEdited, setIsEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const router = useRouter();
  
  // Log current state for debugging
  useEffect(() => {
    if (conceptMap) {
      log('Current concept map:', conceptMap);
    }
  }, [conceptMap]);
  
  const handleGenerate = (newConceptMap: ConceptMap) => {
    log('Generated new concept map:', newConceptMap);
    
    // Create default versions if none provided, with different complexity levels
    const defaultVersions = newConceptMap.versions && newConceptMap.versions.length > 0 
      ? newConceptMap.versions 
      : [
          {
            level: 1,
            nodes: newConceptMap.nodes?.filter((_n, i) => i < 3) || [],
            edges: newConceptMap.edges?.filter(e => {
              const sourceIndex = newConceptMap.nodes?.findIndex(n => n.id === e.source) || -1;
              const targetIndex = newConceptMap.nodes?.findIndex(n => n.id === e.target) || -1;
              return sourceIndex < 3 && targetIndex < 3;
            }) || []
          },
          {
            level: 2,
            nodes: newConceptMap.nodes?.filter((_n, i) => i < 5) || [],
            edges: newConceptMap.edges?.filter(e => {
              const sourceIndex = newConceptMap.nodes?.findIndex(n => n.id === e.source) || -1;
              const targetIndex = newConceptMap.nodes?.findIndex(n => n.id === e.target) || -1;
              return sourceIndex < 5 && targetIndex < 5;
            }) || []
          },
          {
            level: 3,
            nodes: newConceptMap.nodes?.filter((_n, i) => i < 8) || [],
            edges: newConceptMap.edges?.filter(e => {
              const sourceIndex = newConceptMap.nodes?.findIndex(n => n.id === e.source) || -1;
              const targetIndex = newConceptMap.nodes?.findIndex(n => n.id === e.target) || -1;
              return sourceIndex < 8 && targetIndex < 8;
            }) || []
          },
          {
            level: 4,
            nodes: newConceptMap.nodes?.filter((_n, i) => i < 12) || [],
            edges: newConceptMap.edges?.filter(e => {
              const sourceIndex = newConceptMap.nodes?.findIndex(n => n.id === e.source) || -1;
              const targetIndex = newConceptMap.nodes?.findIndex(n => n.id === e.target) || -1;
              return sourceIndex < 12 && targetIndex < 12;
            }) || []
          },
          {
            level: 5,
            nodes: newConceptMap.nodes || [],
            edges: newConceptMap.edges || []
          }
        ];
    
    // Make a complete map with all required properties
    const completeMap: ConceptMap = {
      ...newConceptMap,
      description: newConceptMap.description || newConceptMap.title, // Use title as fallback for description
      nodes: newConceptMap.nodes || [],
      edges: newConceptMap.edges || [],
      versions: defaultVersions,
      complexity: newConceptMap.complexity || 1,
      deck_id: newConceptMap.deck_id // Preserve the deck_id
    };
    
    // Add missing properties to avoid type errors
    completeMap.nodes = completeMap.nodes.map((node: any) => ({
      ...node,
      label: node.label || node.data?.label || 'Unnamed Concept'
    }));
    
    completeMap.edges = completeMap.edges.map((edge: any) => ({
      ...edge,
      label: edge.label || edge.data?.label || 'relates to'
    }));
    
    // Ensure consistent node/edge structure in versions too
    if (completeMap.versions && completeMap.versions.length > 0) {
      completeMap.versions = completeMap.versions.map(version => ({
        ...version,
        nodes: version.nodes.map((node: any) => ({
          ...node,
          label: node.label || node.data?.label || 'Unnamed Concept'
        })),
        edges: version.edges.map((edge: any) => ({
          ...edge,
          label: edge.label || edge.data?.label || 'relates to'
        }))
      }));
    }
    
    log('Complete map after processing:', {
      title: completeMap.title,
      complexity: completeMap.complexity,
      nodeCount: completeMap.nodes.length,
      edgeCount: completeMap.edges.length,
      versionCount: completeMap.versions.length,
      versionsLevels: completeMap.versions.map(v => v.level),
      deck_id: completeMap.deck_id
    });
    
    setConceptMap(completeMap);
    setIsEdited(false);
  };
  
  const handleComplexityChange = (level: number) => {
    if (!conceptMap) return;
    log('Changing complexity to:', level);
    
    // Log the current state for debugging
    log('Current complexity state:', {
      current: conceptMap.complexity,
      changing: level,
      hasVersions: conceptMap.versions?.length > 0,
      versionsWithLevel: conceptMap.versions?.filter(v => v.level === level).length || 0
    });
    
    setConceptMap({
      ...conceptMap,
      complexity: level
    });
  };
  
  const handleConceptMapChange = (updatedMap: any) => {
    log('Concept map updated');
    
    // Ensure we have a complete map with all required properties
    const completeMap: ConceptMap = {
      ...conceptMap as ConceptMap, // Start with existing data
      ...updatedMap, // Override with updated data
      // Ensure required fields
      title: updatedMap.title || conceptMap?.title || 'Untitled Concept Map',
      description: updatedMap.description || conceptMap?.description || updatedMap.title || '',
      nodes: updatedMap.nodes || conceptMap?.nodes || [],
      edges: updatedMap.edges || conceptMap?.edges || [],
      versions: updatedMap.versions || conceptMap?.versions || [],
      complexity: updatedMap.complexity || conceptMap?.complexity || 1,
      deck_id: updatedMap.deck_id || conceptMap?.deck_id // Preserve deck_id
    };
    
    setConceptMap(completeMap);
    setIsEdited(true);
  };
  
  const handleSave = async () => {
    if (!conceptMap) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    log('Saving concept map...');
    
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
        title: conceptMap.title,
        hasDescription: 'description' in conceptMap,
        hasTopic: 'topic' in conceptMap,
        nodes: conceptMap.nodes?.length || 0,
        edges: conceptMap.edges?.length || 0,
        versions: conceptMap.versions?.length || 0,
        deck_id: conceptMap.deck_id
      });
      
      // Process nodes and edges to ensure they have the correct format
      const processedNodes = (conceptMap.nodes || []).map(node => ({
        ...node,
        data: {
          ...(node.data || {}),
          label: node.data?.label || node.label || 'Unnamed Concept'
        },
        label: node.label || node.data?.label || 'Unnamed Concept'
      }));
      
      const processedEdges = (conceptMap.edges || []).map(edge => ({
        ...edge,
        data: {
          ...(edge.data || {}),
          label: edge.data?.label || edge.label || 'relates to'
        },
        label: edge.label || edge.data?.label || 'relates to'
      }));
      
      // Process versions to ensure they have the correct format
      const processedVersions = (conceptMap.versions || []).map(version => ({
        ...version,
        nodes: (version.nodes || []).map(node => ({
          ...node,
          data: {
            ...(node.data || {}),
            label: node.data?.label || node.label || 'Unnamed Concept'
          },
          label: node.label || node.data?.label || 'Unnamed Concept'
        })),
        edges: (version.edges || []).map(edge => ({
          ...edge,
          data: {
            ...(edge.data || {}),
            label: edge.data?.label || edge.label || 'relates to'
          },
          label: edge.label || edge.data?.label || 'relates to'
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
        complexity: conceptMap.complexity || 1
      };
      
      // Prepare data for saving - only use fields that exist in the database schema
      const mapToSave = {
        user_id: userId, // This can be null in dev mode
        title: conceptMap.title || 'Untitled Concept Map',
        deck_id: conceptMap.deck_id, // Include deck_id in the saved data
        // Put everything else in the content field as JSON
        content: cleanContent
      };
      
      log('Saving map to Supabase:', {
        title: mapToSave.title,
        contentTopic: cleanContent.topic,
        contentComplexity: cleanContent.complexity,
        nodeCount: cleanContent.nodes.length,
        edgeCount: cleanContent.edges.length,
        versionCount: cleanContent.versions.length,
        deck_id: mapToSave.deck_id
      });
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('concept_maps')
        .insert(mapToSave)
        .select('id')
        .single();
        
      if (error) {
        log('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      log('Save successful, ID:', data.id);
      
      setSaveMessage({
        text: "Your concept map has been saved to your Memory Bank",
        type: 'success'
      });
      
      setConceptMap({
        ...conceptMap,
        id: data.id
      });
      
      setIsEdited(false);
      
    } catch (error: any) {
      console.error('Error saving concept map:', error);
      // Log detailed error information
      log('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.slice(0, 200), // Just the first part of the stack trace
        code: error.code,
        details: error.details,
      });
      
      setSaveMessage({
        text: `Error: ${error.message || "There was a problem saving your concept map"}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {!conceptMap ? (
        <div className="flex-1 overflow-auto">
          <ResourceGenerator onGenerateConceptMap={handleGenerate} />
        </div>
      ) : (
        <div className="flex flex-col h-full">
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
                {isSaving ? 'Saving...' : 'Save to Memory Bank'}
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <ConceptFlow 
                conceptMap={{
                  ...conceptMap,
                  // Add any properties required by ConceptFlow but not in our ConceptMap type
                  topic: conceptMap.description || conceptMap.title,
                  // Ensure complexity is correctly set
                  complexity: conceptMap.complexity || 1,
                  // Ensure required properties on nodes and edges have proper values
                  nodes: conceptMap.nodes.map(node => ({
                    ...node,
                    label: node.label || node.data?.label || 'Unnamed Concept'
                  })),
                  edges: conceptMap.edges.map(edge => ({
                    ...edge,
                    label: edge.label || edge.data?.label || 'relates to'
                  })),
                  // Ensure versions have proper structure
                  versions: conceptMap.versions.map(version => ({
                    ...version,
                    nodes: version.nodes.map(node => ({
                      ...node,
                      label: node.label || node.data?.label || 'Unnamed Concept'
                    })),
                    edges: version.edges.map(edge => ({
                      ...edge,
                      label: edge.label || edge.data?.label || 'relates to'
                    }))
                  }))
                } as any} 
                onComplexityChange={handleComplexityChange}
                onConceptMapChange={handleConceptMapChange}
              />
            </ReactFlowProvider>
          </div>
        </div>
      )}
    </div>
  );
}