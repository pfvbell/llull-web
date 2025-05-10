// src/components/flow/ConceptNode.tsx
'use client';

import { useState, useRef, useEffect } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

// Define a proper interface for the node data
interface ConceptNodeData {
  label?: string;
  onNodeLabelChange?: (id: string, label: string) => void;
}

const ConceptNode = ({ id, data, selected }: NodeProps) => {
  // Properly type the data with a safe cast
  const nodeData = data as unknown as ConceptNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(nodeData?.label || '');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Add logging for debugging
  useEffect(() => {
    console.log('[ConceptNode] Initialized with data:', { id, label: nodeData?.label });
  }, [id, nodeData]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    console.log('[ConceptNode] Double-click detected, entering edit mode');
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (nodeData.onNodeLabelChange) {
      console.log('[ConceptNode] Updating label on blur:', { id, label });
      nodeData.onNodeLabelChange(id, label);
    }
  };

  const handleKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter') {
      setIsEditing(false);
      if (nodeData.onNodeLabelChange) {
        console.log('[ConceptNode] Updating label on Enter key:', { id, label });
        nodeData.onNodeLabelChange(id, label);
      }
    }
  };

  // Common style for handles
  const handleStyle = {
    width: '12px',
    height: '12px',
    background: '#5e9ed6',
    border: '2px solid #fff',
    transition: 'all 0.2s ease',
  };

  // Handle hover style
  const [isSourceHandleHovered, setIsSourceHandleHovered] = useState(false);
  const [isTargetHandleHovered, setIsTargetHandleHovered] = useState(false);
  const [showDragHelp, setShowDragHelp] = useState(false);

  return (
    <div 
      className={`px-4 py-2 rounded-md shadow-md border cursor-move transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : isHovered ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDragHelp(false);
      }}
      title="Drag to move this node"
    >
      {/* Visual indicator for draggable node with tooltip */}
      <div 
        className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-gray-200 hover:bg-blue-200 rounded-full text-gray-500 hover:text-blue-600 text-xs cursor-move"
        onMouseEnter={() => setShowDragHelp(true)}
        onMouseLeave={() => setShowDragHelp(false)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
        </svg>

        {showDragHelp && (
          <div className="absolute top-0 right-5 w-28 bg-gray-800 text-white text-xs rounded py-1 px-2 z-50 pointer-events-none">
            Drag to move node
          </div>
        )}
      </div>
      
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{
          ...handleStyle,
          width: isTargetHandleHovered ? '14px' : '12px',
          height: isTargetHandleHovered ? '14px' : '12px',
          backgroundColor: isTargetHandleHovered ? '#3b82f6' : '#5e9ed6',
        }}
        onMouseEnter={() => setIsTargetHandleHovered(true)}
        onMouseLeave={() => setIsTargetHandleHovered(false)}
        className="cursor-crosshair transition-all hover:shadow-md" 
      />
      
      <div className="text-center font-medium text-gray-800 min-h-8 flex items-center justify-center">
        {isEditing ? (
          <input
            ref={inputRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="bg-white p-1 border border-blue-300 rounded w-full text-center outline-none"
            autoFocus
          />
        ) : (
          <span>{nodeData?.label || 'Unnamed Concept'}</span>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{
          ...handleStyle,
          width: isSourceHandleHovered ? '14px' : '12px',
          height: isSourceHandleHovered ? '14px' : '12px',
          backgroundColor: isSourceHandleHovered ? '#3b82f6' : '#5e9ed6',
        }}
        onMouseEnter={() => setIsSourceHandleHovered(true)}
        onMouseLeave={() => setIsSourceHandleHovered(false)}
        className="cursor-crosshair transition-all hover:shadow-md" 
      />
    </div>
  );
};

export default ConceptNode;