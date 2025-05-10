// src/components/flow/ConceptFlow.tsx
'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Panel,
  useNodesState, 
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
  BackgroundVariant,
  ConnectionLineType,
  addEdge,
  MarkerType,
  Connection,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
  NodeTypes,
  EdgeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ConceptNode from './ConceptNode';
// Use dynamic import as a workaround for TypeScript issues
// This is needed because there's probably a circular dependency issue
import dynamic from 'next/dynamic';
import { ConceptMap } from '@/types';
import { getLayoutedElements } from '@/lib/utils/layout';

// Dynamic import for ConceptEdge
const ConceptEdge = dynamic(() => import('./ConceptEdge'), { ssr: false });

// Add console logs for debugging
const log = (message: string, data?: any) => {
  console.log(`[ConceptFlow] ${message}`, data ? data : '');
};

// Define node and edge types with proper type annotations
const nodeTypes: NodeTypes = {
  concept: ConceptNode,
};

const edgeTypes: EdgeTypes = {
  concept: ConceptEdge as any, // Cast to any to avoid type issues
};

// This interface matches what we need in this component
interface ConceptFlowProps {
  conceptMap: ConceptMap;
  onComplexityChange?: (level: number) => void;
  readOnly?: boolean;
  onConceptMapChange?: (updatedMap: ConceptMap) => void;
}

/**
 * A component that displays a concept map with nodes and edges.
 * Allows for editing and complexity level adjustment.
 */
function ConceptFlowComponent({ 
  conceptMap, 
  onComplexityChange, 
  readOnly = false,
  onConceptMapChange
}: ConceptFlowProps) {
  // Use any type for nodes and edges to avoid type errors
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [complexity, setComplexity] = useState<number>(conceptMap.complexity || 1);
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isAltered, setIsAltered] = useState(false);
  // New state to track if nodes have been manually positioned
  const [hasManualPositioning, setHasManualPositioning] = useState(false);

  // Log props
  useEffect(() => {
    log('Component initialized with conceptMap', {
      title: conceptMap.title,
      complexity: conceptMap.complexity,
      nodeCount: conceptMap.nodes?.length || 0,
      edgeCount: conceptMap.edges?.length || 0,
      versionCount: conceptMap.versions?.length || 0
    });
  }, [conceptMap]);

  // Update the conceptMap when nodes or edges change if editing is enabled
  useEffect(() => {
    if (readOnly || !isAltered || !onConceptMapChange) return;

    log('Updating concept map due to node/edge changes');
    
    // Find the current version based on complexity
    const updatedVersions = [...conceptMap.versions];
    const versionIndex = updatedVersions.findIndex(v => v.level === complexity);
    
    if (versionIndex !== -1) {
      try {
        // Process nodes to ensure they have the required label property and preserve positions
        const processedNodes = nodes.map(node => ({
          ...node,
          // Ensure label property exists for ConceptNode type
          label: node.data?.label || node.label || 'Unnamed Concept',
          // Ensure position is preserved
          position: node.position
        }));
        
        // Process edges to ensure they have the required label property
        const processedEdges = edges.map(edge => ({
          ...edge,
          // Ensure label property exists for ConceptEdge type
          label: edge.data?.label || edge.label || 'relates to'
        }));
        
        // Update nodes and edges for this version
        updatedVersions[versionIndex] = {
          ...updatedVersions[versionIndex],
          nodes: processedNodes,
          edges: processedEdges,
        };
        
        // Update the concept map
        const updatedMap = {
          ...conceptMap,
          nodes: processedNodes, // Also update top-level nodes
          edges: processedEdges, // Also update top-level edges
          versions: updatedVersions,
        };
        
        log('Updating concept map with processed data:', {
          nodeCount: processedNodes.length,
          edgeCount: processedEdges.length,
          versionCount: updatedVersions.length,
          hasPositions: processedNodes.every(node => node.position != null)
        });
        
        onConceptMapChange(updatedMap);
      } catch (error) {
        console.error('[ConceptFlow] Error updating concept map:', error);
      }
    }
  }, [nodes, edges, isAltered, readOnly, onConceptMapChange, complexity, conceptMap]);

  // Apply layout and set nodes/edges when complexity changes or when the conceptMap changes
  useEffect(() => {
    if (!conceptMap || !conceptMap.versions || conceptMap.versions.length === 0) {
      log('No concept map versions available');
      return;
    }
    
    log('Loading concept map version with complexity', complexity);
    
    // Get the current version based on complexity level
    const currentVersion = conceptMap.versions.find(v => v.level === complexity) || 
                          conceptMap.versions[0]; // Fallback to first version if complexity doesn't match
    
    if (!currentVersion) {
      log('No suitable version found in concept map');
      return;
    }
    
    // Don't reset altered state if just changing complexity
    setIsAltered(false);
    
    try {
      log('Processing version data:', {
        level: currentVersion.level,
        nodeCount: currentVersion.nodes?.length || 0,
        edgeCount: currentVersion.edges?.length || 0
      });
      
      // Create nodes with proper type, ensuring labels are preserved
      const typedNodes = (currentVersion.nodes || []).map(node => {
        // Handle different node data structures
        const nodeLabel = node.data?.label || 
                          ((node as any).label ? (node as any).label : '') || 
                          'Unnamed Concept';
        
        // Preserve existing positions if they exist
        const nodePosition = node.position || { x: 0, y: 0 };
                          
        log('Processing node:', { id: node.id, label: nodeLabel });
        
        return {
          ...node,
          type: 'concept',
          // Ensure position is preserved
          position: nodePosition,
          data: { 
            ...(node.data || {}),
            label: nodeLabel,
            onNodeLabelChange: handleNodeLabelChange 
          },
        };
      });
      
      // Create edges with proper type, ensuring labels are preserved
      const typedEdges = (currentVersion.edges || []).map(edge => {
        // Handle different edge data structures
        const edgeLabel = edge.data?.label || 
                          (typeof edge.label === 'string' ? edge.label : '') || 
                          'relates to';
                          
        log('Processing edge:', { id: edge.id, label: edgeLabel });
        
        return {
          ...edge,
          type: 'concept',
          markerEnd: { type: MarkerType.ArrowClosed },
          data: { 
            ...(edge.data || {}),
            label: edgeLabel,
            onChange: handleEdgeLabelChange 
          },
        };
      });
      
      // Only apply automatic layout if node positions aren't defined
      // or if it's the first load
      const nodesHavePositions = typedNodes.every(node => 
        node.position && 
        typeof node.position.x === 'number' && 
        typeof node.position.y === 'number'
      );
      
      if (nodesHavePositions && hasManualPositioning) {
        // Use existing positions
        log('Using existing node positions');
        setNodes(typedNodes);
        setEdges(typedEdges);
      } else {
        // Apply automatic layout
        log('Applying automatic layout');
        const layoutResult = getLayoutedElements(typedNodes, typedEdges, 'TB');
        setNodes(layoutResult.nodes);
        setEdges(layoutResult.edges);
        setHasManualPositioning(false);
      }
      
      // Fit view after nodes are positioned
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 50);
    } catch (error) {
      console.error('[ConceptFlow] Error loading concept map:', error);
    }
  }, [conceptMap, complexity, reactFlowInstance, hasManualPositioning]);

  // Handle node label changes
  const handleNodeLabelChange = useCallback((nodeId: string, newLabel: string) => {
    log('Changing node label', { nodeId, newLabel });
    
    setNodes((nds: any) => {
      try {
        return nds.map((node: any) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                label: newLabel,
                onNodeLabelChange: handleNodeLabelChange
              }
            };
          }
          return node;
        });
      } catch (error) {
        console.error('[ConceptFlow] Error changing node label:', error);
        return nds;
      }
    });
    setIsAltered(true);
  }, []);

  // Handle edge label changes
  const handleEdgeLabelChange = useCallback((edgeId: string, newLabel: string) => {
    log('Changing edge label', { edgeId, newLabel });
    
    setEdges((eds: any) => {
      try {
        return eds.map((edge: any) => {
          if (edge.id === edgeId) {
            return {
              ...edge,
              data: {
                ...edge.data,
                label: newLabel,
                onChange: handleEdgeLabelChange
              }
            };
          }
          return edge;
        });
      } catch (error) {
        console.error('[ConceptFlow] Error changing edge label:', error);
        return eds;
      }
    });
    setIsAltered(true);
  }, []);

  // Handle new connections between nodes
  const onConnect = useCallback((connection: Connection) => {
    log('Creating new connection', connection);
    
    try {
      // Create a unique ID for the new edge
      const newEdge = {
        ...connection,
        id: `e${connection.source}-${connection.target}`,
        type: 'concept',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: { 
          label: 'relates to',
          onChange: handleEdgeLabelChange
        }
      };
      
      setEdges((eds: any) => addEdge(newEdge, eds));
      setIsAltered(true);
    } catch (error) {
      console.error('[ConceptFlow] Error creating connection:', error);
    }
  }, []);

  // Handle adding a new node
  const addNewNode = useCallback(() => {
    log('Adding new node');
    
    try {
      const newNodeId = `node-${Date.now()}`;
      const newNode = {
        id: newNodeId,
        type: 'concept',
        position: { x: 100, y: 100 }, // Initial position
        data: { 
          label: 'New Concept', 
          onNodeLabelChange: handleNodeLabelChange 
        }
      };
      
      setNodes((nds: any) => [...nds, newNode]);
      setIsAltered(true);
    } catch (error) {
      console.error('[ConceptFlow] Error adding new node:', error);
    }
  }, []);

  // Handle complexity level change
  const handleComplexityChange = (level: number) => {
    log('Changing complexity level', level);
    
    // Prompt user to save changes if the diagram has been altered
    if (isAltered) {
      if (window.confirm('You have unsaved changes. Change complexity anyway?')) {
        setComplexity(level);
        if (onComplexityChange) {
          onComplexityChange(level);
        }
      }
    } else {
      setComplexity(level);
      if (onComplexityChange) {
        onComplexityChange(level);
      }
    }
  };
  
  // Custom handlers for nodes and edges changes with type safety
  const handleNodesChange = (changes: NodeChange[]) => {
    // Check if position changes are being made (drag operation)
    const hasPositionChanges = changes.some(change => 
      change.type === 'position' && 
      (change.position?.x !== undefined || change.position?.y !== undefined)
    );
    
    if (hasPositionChanges) {
      log('Node positions manually changed');
      setHasManualPositioning(true);
    }
    
    // Apply changes
    onNodesChange(changes);
    
    if (changes.some(change => change.type !== 'select')) {
      setIsAltered(true);
    }
  };

  const handleEdgesChange = (changes: EdgeChange[]) => {
    onEdgesChange(changes);
    if (changes.length > 0) {
      setIsAltered(true);
    }
  };
  
  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={!readOnly ? onConnect : undefined}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.Bezier}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 3 }}
        connectionRadius={30}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={4}
        className="bg-gray-50"
        elementsSelectable={!readOnly}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        deleteKeyCode={['Backspace', 'Delete']}
        defaultEdgeOptions={{
          type: 'concept',
          style: { stroke: '#5e9ed6', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: false
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        
        {/* Complexity Level Controls - only visible when onComplexityChange is provided */}
        {onComplexityChange && (
          <Panel position="top-left" className="bg-white p-2 rounded-md shadow-md">
            <div className="flex flex-col">
              <span className="text-sm font-medium mb-2">Complexity Level:</span>
              <div className="flex space-x-2">
                {(() => {
                  // Add debugging to see what's happening with versions
                  console.log('[ConceptFlow] Complexity panel debug:', {
                    hasCallback: !!onComplexityChange,
                    versions: conceptMap.versions,
                    hasVersions: Array.isArray(conceptMap.versions) && conceptMap.versions.length > 0,
                    versionLevels: Array.isArray(conceptMap.versions) 
                      ? conceptMap.versions.map(v => v.level) 
                      : 'No versions array',
                    currentComplexity: complexity
                  });
                  
                  if (!conceptMap.versions || conceptMap.versions.length === 0) {
                    // Create default version buttons if none exist
                    return [1, 2, 3, 4, 5].map(level => (
                      <button
                        key={level}
                        className={`w-8 h-8 rounded-full flex items-center justify-center 
                          ${complexity === level 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        onClick={() => handleComplexityChange(level)}
                      >
                        {level}
                      </button>
                    ));
                  }
                  
                  return conceptMap.versions.map((version) => (
                    <button
                      key={version.level}
                      className={`w-8 h-8 rounded-full flex items-center justify-center 
                        ${complexity === version.level 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      onClick={() => handleComplexityChange(version.level)}
                    >
                      {version.level}
                    </button>
                  ));
                })()}
              </div>
            </div>
          </Panel>
        )}

        {/* Editing Toolbar */}
        {!readOnly && (
          <Panel position="top-right" className="bg-white p-2 rounded-md shadow-md flex gap-2">
            <button
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
              onClick={addNewNode}
            >
              Add Node
            </button>
            <button
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              onClick={() => {
                try {
                  const currentVersion = conceptMap.versions.find(v => v.level === complexity);
                  if (currentVersion) {
                    const typedNodes = nodes.map((node: any) => ({
                      ...node,
                      data: {
                        ...node.data,
                        onNodeLabelChange: handleNodeLabelChange
                      }
                    }));
                    
                    const typedEdges = edges.map((edge: any) => ({
                      ...edge,
                      data: {
                        ...edge.data,
                        onChange: handleEdgeLabelChange
                      }
                    }));
                    
                    // Apply automatic layout
                    const layoutResult = getLayoutedElements(typedNodes, typedEdges, 'TB');
                    
                    setNodes(layoutResult.nodes);
                    setEdges(layoutResult.edges);
                    setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 50);
                    
                    // Reset manual positioning flag since we just applied automatic layout
                    setHasManualPositioning(false);
                    // Mark as altered since we're changing node positions
                    setIsAltered(true);
                  }
                } catch (error) {
                  console.error('[ConceptFlow] Error rearranging nodes:', error);
                }
              }}
            >
              Auto-arrange
            </button>
          </Panel>
        )}
        
        {/* Help Text */}
        <Panel position="bottom-center" className="bg-white p-2 rounded-t-md shadow-md">
          {!readOnly ? (
            <div className="text-xs text-gray-500">
              <strong>Tips:</strong> <span className="text-blue-600 font-medium">Drag nodes to move them</span> • Connect nodes by dragging from the blue handles (bottom to top) • 
              Double-click on nodes or edges to edit • Use the Auto-arrange button to reset positions • Delete elements with Backspace/Delete
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              View-only mode • Use mouse wheel to zoom • Drag background to pan
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}

// Wrap with ReactFlowProvider 
const ConceptFlow = (props: ConceptFlowProps) => (
  <ReactFlowProvider>
    <ConceptFlowComponent {...props} />
  </ReactFlowProvider>
);

export default ConceptFlow;