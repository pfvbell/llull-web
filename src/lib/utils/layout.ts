// src/lib/utils/layout.ts
import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

// Default node dimensions - can be adjusted
const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
) {
  // Create a new dagre graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Set graph direction
  dagreGraph.setGraph({ rankdir: direction });

  // Add nodes to the graph with dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: node.width || NODE_WIDTH, 
      height: node.height || NODE_HEIGHT 
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run the layout algorithm
  dagre.layout(dagreGraph);

  // Get the positioned nodes from dagre
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    // We're positioning the nodes at their center, so we need to translate
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (nodeWithPosition.width / 2),
        y: nodeWithPosition.y - (nodeWithPosition.height / 2),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}