// src/components/flow/ConceptEdge.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from "@xyflow/react";

type ConceptEdgeData = {
  label?: string;
  onChange?: (id: string, label: string) => void;
};

const ConceptEdge = ({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition, 
  data, 
  markerEnd,
  selected 
}: EdgeProps) => {
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Use type guard to safely access data properties
  const edgeLabel = React.useMemo(() => {
    if (data && typeof data === 'object' && 'label' in data) {
      return (data as ConceptEdgeData).label;
    }
    return undefined;
  }, [data]);

  // Initialize label text from data
  useEffect(() => {
    if (edgeLabel) {
      setLabelText(edgeLabel);
    }
  }, [edgeLabel]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleLabelDoubleClick = () => {
    setIsEditing(true);
    console.log('[ConceptEdge] Double-click detected on edge label, entering edit mode');
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabelText(e.target.value);
  };

  const handleLabelBlur = () => {
    if (isEditing) {
      finishEditing();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      // Cancel editing
      setIsEditing(false);
      setLabelText(edgeLabel || '');
    }
  };

  const finishEditing = () => {
    setIsEditing(false);
    if (data && typeof data === 'object' && 'onChange' in data && typeof data.onChange === 'function') {
      const onChange = (data as ConceptEdgeData).onChange;
      if (onChange && id) {
        console.log('[ConceptEdge] Updating edge label:', { id, label: labelText });
        onChange(id, labelText);
      }
    }
  };

  // Add logging to help with debugging
  useEffect(() => {
    console.log('[ConceptEdge] Edge rendered:', { id, selected, hovered });
  }, [id, selected, hovered]);

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        strokeWidth={hovered || selected ? 4 : 3} // Increased stroke width for better visibility
        stroke={hovered || selected ? "#3b82f6" : "#5e9ed6"} // Use blue color instead of gray for better visibility
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: hovered || selected ? '#e6f2ff' : '#f0f0f0',
            padding: isEditing ? '2px' : '4px 8px',
            borderRadius: '4px',
            fontSize: 12,
            fontWeight: 500,
            border: hovered || selected ? '1px solid #3b82f6' : '1px solid #ccc',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            pointerEvents: 'all', // enables interaction with the label
            minWidth: '20px',
            textAlign: 'center',
            color: '#222',
            transition: 'all 0.2s ease'
          }}
          className="nodrag nopan hover:shadow-md"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onDoubleClick={handleLabelDoubleClick}
          title={isEditing ? '' : "Double-click to edit"}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              value={labelText}
              onChange={handleLabelChange}
              onBlur={handleLabelBlur}
              onKeyDown={handleKeyDown}
              className="nodrag w-full bg-white p-1 text-sm border border-blue-300 rounded outline-none text-center"
              size={Math.max(labelText.length, 8)}
              autoFocus
            />
          ) : (
            edgeLabel || 'relates to'
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default ConceptEdge;