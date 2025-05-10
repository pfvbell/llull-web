import { EdgeProps } from '@xyflow/react';
import React from 'react';

declare module './ConceptEdge' {
  type ConceptEdgeData = {
    label?: string;
    onChange?: (id: string, label: string) => void;
  };
  
  export default function ConceptEdge(props: EdgeProps): React.ReactElement;
} 