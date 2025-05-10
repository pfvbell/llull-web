// src/components/flow/ReviewNode.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

// Define the structure of our node data
interface ReviewNodeData {
  id?: string;
  label?: string;
  correctLabel?: string;
  userLabel?: string | null;
  isCorrect?: boolean;
  onLabelDrop?: (nodeId: string, label: string) => void;
  onLabelRemove?: (nodeId: string) => void;
  showingCorrect?: boolean;
}

const ReviewNode = ({ 
  id, 
  data,
  selected 
}: NodeProps) => {
  const [isOver, setIsOver] = useState(false);
  
  // Safe type guard for data
  const nodeData = data as ReviewNodeData;
  
  // Add useEffect to log when userLabel changes
  useEffect(() => {
    console.log(`[ReviewNode ${id}] userLabel updated:`, { 
      userLabel: nodeData?.userLabel, 
      correctLabel: nodeData?.correctLabel,
      showingCorrect: nodeData?.showingCorrect
    });
  }, [nodeData?.userLabel, nodeData?.correctLabel, nodeData?.showingCorrect, id]);
  
  // Handle the drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const label = e.dataTransfer.getData('text/plain');
    console.log(`[ReviewNode ${id}] Handling drop event with label: ${label}`);
    if (label && nodeData?.onLabelDrop) {
      nodeData.onLabelDrop(id, label);
    }
    setIsOver(false);
  };
  
  // Allow the drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isOver) setIsOver(true);
  };
  
  // Handle when the dragged item leaves
  const handleDragLeave = () => {
    setIsOver(false);
  };
  
  // Handle click to remove a label
  const handleResetClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the parent div's click handler from firing
    // Only remove label if there is one and the node isn't showing correct answers
    if (nodeData?.userLabel && nodeData?.onLabelRemove && !nodeData.showingCorrect) {
      console.log(`[ReviewNode] Removing label from node ${id}`);
      nodeData.onLabelRemove(id);
    }
  };
  
  // Get the style based on the node state
  const getNodeStyle = () => {
    // When showing correct answers, all nodes should be green
    if (nodeData?.showingCorrect) {
      return 'border-green-500 bg-green-50';
    }
    
    if (nodeData?.userLabel === null || nodeData?.userLabel === undefined) {
      return isOver
        ? 'border-dashed border-blue-500 bg-blue-50'
        : 'border-dashed border-gray-300 bg-white';
    }
    
    return nodeData?.isCorrect
      ? 'border-green-500 bg-green-50'
      : 'border-red-500 bg-red-50';
  };
  
  // Log what is actually rendered
  const displayedText = nodeData?.userLabel 
    ? nodeData.userLabel 
    : "Drop answer here";
  
  console.log(`[ReviewNode ${id}] Rendering with text:`, displayedText);
  
  return (
    <div 
      className={`px-4 py-3 rounded-md shadow-md border-2 ${getNodeStyle()} transition-colors min-w-[120px] text-center relative`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      {/* Restart button for resetting node labels */}
      {nodeData?.userLabel && !nodeData.showingCorrect && (
        <button 
          className="absolute top-0 right-0 -mt-2 -mr-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm focus:outline-none"
          onClick={handleResetClick}
          title="Reset this node's label"
        >
          <span className="font-bold transform rotate-45">↻</span>
        </button>
      )}
      
      <div className="font-medium text-gray-800">
        {nodeData?.userLabel ? (
          <>{nodeData.userLabel}</>
        ) : (
          <span className="text-gray-400 italic">Drop answer here</span>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export default ReviewNode;