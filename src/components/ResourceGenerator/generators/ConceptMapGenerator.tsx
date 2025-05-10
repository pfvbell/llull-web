import React from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ConceptMap, ConceptNode, ConceptEdge } from '@/types/index';
import { GeneratorProps } from '../types';
import { createLogger } from '../utils';

const log = createLogger('ConceptMapGenerator');

interface ConceptMapGeneratorProps extends GeneratorProps {
  onGenerateConceptMap?: (conceptMap: ConceptMap) => void;
}

const ConceptMapGenerator = ({
  text,
  deckId,
  isGenerating,
  onGenerate,
  onError,
  onGenerateConceptMap
}: ConceptMapGeneratorProps) => {
  const router = useRouter();

  // Convert API response nodes to the proper format for our ConceptMap type
  const convertToTypedNodes = (conceptNodes: any[]): ConceptNode[] => {
    return conceptNodes.map((node, index) => {
      // Create a properly typed ConceptNode
      const typedNode: ConceptNode = {
        id: node.id || `node-${index}`,
        label: node.label || 'Unnamed Concept',
        position: node.position || { x: 100 + index * 150, y: 100 + (index % 3) * 100 },
        type: 'concept',
        data: {
          label: node.label || 'Unnamed Concept',
          onLabelChange: (newLabel: string) => {
            console.log(`Label changed to: ${newLabel}`);
          }
        }
      };
      return typedNode;
    });
  };

  const generateConceptMap = async () => {
    try {
      onGenerate(true);
      log('Generating concept map');
      
      const response = await fetch('/api/generate-concept-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate concept map');
      }
      
      const data = await response.json();
      
      // Validate the response data
      if (!data || typeof data !== 'object' || !data.nodes || !data.edges) {
        throw new Error('Invalid response data from API');
      }
      
      log('Received concept map from API:', { 
        title: data.title, 
        nodes: data.nodes.length, 
        edges: data.edges.length 
      });
      
      // Create a properly typed ConceptMap
      const typedConceptMap: ConceptMap = {
        id: uuidv4(),
        title: data.title || 'Untitled Concept Map',
        description: data.description || data.title || '',
        complexity: data.complexity || 3,
        versions: data.versions || [],
        nodes: convertToTypedNodes(data.nodes),
        edges: data.edges.map((edge: any, index: number) => ({
          id: edge.id || `edge-${index}`,
          source: edge.source,
          target: edge.target,
          label: edge.label || '',
          type: 'default'
        })),
        deck_id: deckId
      };
      
      log('Generated concept map:', { 
        id: typedConceptMap.id, 
        title: typedConceptMap.title, 
        nodes: typedConceptMap.nodes.length,
        deck_id: typedConceptMap.deck_id
      });
      
      if (onGenerateConceptMap) {
        onGenerateConceptMap(typedConceptMap);
      } else {
        // Navigate to concept map editor
        router.push(`/concept-map/create?data=${encodeURIComponent(JSON.stringify(typedConceptMap))}`);
      }
      
      return typedConceptMap;
    } catch (err: any) {
      console.error(`Error generating concept map:`, err);
      onError(err.message || 'Failed to generate concept map');
      return null;
    } finally {
      onGenerate(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generateConceptMap}
      disabled={isGenerating || !text.trim()}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      Generate Concept Map
    </button>
  );
};

export default ConceptMapGenerator; 