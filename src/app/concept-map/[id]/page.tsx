// src/app/concept-map/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { ConceptMap } from '@/types';
import { supabase } from '@/lib/supabase';
import ConceptFlow from '@/components/flow/ConceptFlow';
import Link from 'next/link';

export default function ConceptMapPage() {
  const [conceptMap, setConceptMap] = useState<ConceptMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    async function loadConceptMap() {
      try {
        if (!id) {
          setError('No concept map ID provided');
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('concept_maps')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          setError('Concept map not found');
          setLoading(false);
          return;
        }
        
        // Transform the data to match our ConceptMap type
        const map: ConceptMap = {
          id: data.id,
          title: data.title,
          ...data.content,
          createdAt: data.created_at,
          lastReviewedAt: data.last_reviewed_at,
          nextReviewAt: data.next_review_at,
          reviewCount: data.review_count
        };
        
        setConceptMap(map);
      } catch (error) {
        console.error('Error loading concept map:', error);
        setError('Failed to load concept map');
      } finally {
        setLoading(false);
      }
    }
    
    loadConceptMap();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !conceptMap) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-6">{error || 'Failed to load concept map'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Memory Bank
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">{conceptMap.title}</h2>
        <div className="flex space-x-4">
          <Link
            href="/dashboard"
            className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back to Memory Bank
          </Link>
          <Link
            href={`/concept-map/${id}/review`}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Start Review
          </Link>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <ConceptFlow 
            conceptMap={conceptMap} 
            readOnly={true}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}