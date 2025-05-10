// components/ConceptMapGenerator.tsx
import { useState } from 'react';
import { ConceptMap, ConceptNode, ConceptEdge } from '@/types/index';
import { Node } from '@xyflow/react';

interface ConceptMapGeneratorProps {
  onGenerate: (conceptMap: ConceptMap) => void;
}

export default function ConceptMapGenerator({ onGenerate }: ConceptMapGeneratorProps) {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  // Convert API response nodes to the proper format for our ConceptMap type
  const convertToTypedNodes = (conceptNodes: any[]): ConceptNode[] => {
    return conceptNodes.map((node, index) => {
      // Create a properly typed ConceptNode
      const typedNode: ConceptNode = {
        id: node.id || `node-${index}`,
        label: node.label || 'Unnamed Concept',  // Required property
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please enter some text to generate a concept map');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log(`[ConceptMapGenerator] Generating concept map for text: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);
      
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
      
      const conceptMap = await response.json();
      
      // Validate the response data
      if (!conceptMap || typeof conceptMap !== 'object') {
        throw new Error('Invalid response data from API');
      }
      
      // Check if we have nodes
      if (!conceptMap.nodes || !Array.isArray(conceptMap.nodes) || conceptMap.nodes.length === 0) {
        throw new Error('No nodes returned from the API');
      }
      
      console.log(`[ConceptMapGenerator] Received concept map with ${conceptMap.nodes.length} nodes and ${conceptMap.edges?.length || 0} edges`);
      
      // Convert nodes to proper typed format
      const typedNodes = convertToTypedNodes(conceptMap.nodes);
      
      // Create properly typed edges
      const typedEdges: ConceptEdge[] = (conceptMap.edges || []).map((edge: any, index: number) => ({
        id: edge.id || `edge-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label || 'relates to',
        type: edge.type || 'concept',
        data: {
          ...edge.data,
          label: edge.label || edge.data?.label || 'relates to'
        }
      }));
      
      // Create the complete concept map with correct typing
      const typedConceptMap: ConceptMap = {
        title: conceptMap.title || text.substring(0, 50) || 'Untitled Concept Map',
        description: conceptMap.description || conceptMap.title || text || '',
        nodes: typedNodes,
        edges: typedEdges,
        complexity: conceptMap.complexity || 3,
        versions: [
          {
            level: 1,
            nodes: typedNodes.slice(0, Math.min(3, typedNodes.length)),
            edges: typedEdges.filter(edge => {
              const sourceIndex = typedNodes.findIndex(n => n.id === edge.source);
              const targetIndex = typedNodes.findIndex(n => n.id === edge.target);
              return sourceIndex < 3 && targetIndex < 3;
            })
          },
          {
            level: 2,
            nodes: typedNodes.slice(0, Math.min(5, typedNodes.length)),
            edges: typedEdges.filter(edge => {
              const sourceIndex = typedNodes.findIndex(n => n.id === edge.source);
              const targetIndex = typedNodes.findIndex(n => n.id === edge.target);
              return sourceIndex < 5 && targetIndex < 5;
            })
          },
          {
            level: 3,
            nodes: typedNodes.slice(0, Math.min(8, typedNodes.length)),
            edges: typedEdges.filter(edge => {
              const sourceIndex = typedNodes.findIndex(n => n.id === edge.source);
              const targetIndex = typedNodes.findIndex(n => n.id === edge.target);
              return sourceIndex < 8 && targetIndex < 8;
            })
          },
          {
            level: 4,
            nodes: typedNodes.slice(0, Math.min(12, typedNodes.length)),
            edges: typedEdges.filter(edge => {
              const sourceIndex = typedNodes.findIndex(n => n.id === edge.source);
              const targetIndex = typedNodes.findIndex(n => n.id === edge.target);
              return sourceIndex < 12 && targetIndex < 12;
            })
          },
          {
            level: 5,
            nodes: typedNodes,
            edges: typedEdges
          }
        ]
      };
      
      console.log('Generated concept map:', {
        title: typedConceptMap.title,
        nodeCount: typedConceptMap.nodes.length,
        edgeCount: typedConceptMap.edges.length,
        versionCount: typedConceptMap.versions.length,
        versionLevels: typedConceptMap.versions.map(v => v.level)
      });
      
      onGenerate(typedConceptMap);
    } catch (err) {
      console.error('[ConceptMapGenerator] Error generating concept map:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h2 className="text-l font-bold mb-4"></h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          </label>
          <textarea
            id="content"
            rows={8}
            className="w-full p-4 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What would you like to memorise?"
            value={text}
            onChange={handleTextChange}
            disabled={isGenerating}
          />
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isGenerating || !text.trim()}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isGenerating || !text.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Concept Map'}
        </button>
      </form>
    </div>
  );
}