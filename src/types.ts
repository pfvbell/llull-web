import { Node, Edge } from '@xyflow/react';
//
export interface ConceptMapVersion {
  level: number;
  nodes: Node[];
  edges: Edge[];
}

export interface ConceptMap {
  id?: string;
  title: string;
  topic: string;
  complexity: number;
  nodes: Node[];
  edges: Edge[];
  versions: ConceptMapVersion[];
  createdAt?: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  reviewCount?: number;
  deck_id?: string;
} 