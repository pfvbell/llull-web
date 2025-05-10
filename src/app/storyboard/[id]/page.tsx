'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Storyboard } from '@/types/index';
import { supabase } from '@/lib/supabase';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[StoryboardViewPage] ${message}`, data ? data : '');
};

export default function StoryboardViewPage() {
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    async function loadStoryboard() {
      try {
        if (!id) {
          setError('No storyboard ID provided');
          setLoading(false);
          return;
        }
        
        log('Loading storyboard with ID:', id);
        
        const { data, error } = await supabase
          .from('storyboards')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          setError('Storyboard not found');
          setLoading(false);
          return;
        }
        
        log('Received storyboard data from database');
        
        // Parse the content from JSON
        const content = typeof data.content === 'string' 
          ? JSON.parse(data.content) 
          : data.content || {};
        
        const storyboardData: Storyboard = {
          id: data.id,
          title: data.title,
          description: content.description || '',
          scenes: content.scenes || [],
          createdAt: data.created_at,
          lastReviewedAt: data.last_reviewed_at,
          nextReviewAt: data.next_review_at,
          reviewCount: data.review_count || 0,
          deck_id: data.deck_id
        };
        
        log(`Storyboard has ${storyboardData.scenes.length} scenes`);
        setStoryboard(storyboardData);
      } catch (error: any) {
        console.error('Error loading storyboard:', error);
        setError('Failed to load storyboard: ' + (error.message || error));
      } finally {
        setLoading(false);
      }
    }
    
    loadStoryboard();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !storyboard) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-6">{error || 'Failed to load storyboard'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Memory Bank
        </button>
      </div>
    );
  }
  
  const lastReviewed = storyboard.lastReviewedAt 
    ? new Date(storyboard.lastReviewedAt).toLocaleDateString() 
    : 'Never';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Memory Bank
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{storyboard.title}</h1>
            {storyboard.description && (
              <p className="text-gray-600 mt-2">{storyboard.description}</p>
            )}
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link
              href={`/storyboard/${id}/review`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Start Review
            </Link>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Created: {new Date(storyboard.createdAt).toLocaleDateString()}</p>
          <p>Last reviewed: {lastReviewed}</p>
          <p>Review count: {storyboard.reviewCount || 0}</p>
        </div>
      </div>
      
      {storyboard.scenes.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
          This storyboard doesn't have any scenes.
        </div>
      ) : (
        <div className="space-y-8">
          {storyboard.scenes.map((scene, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">{scene.title}</h2>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex justify-center sm:w-1/4">
                  {scene.selectedIcon ? (
                    scene.selectedIcon.isPlaceholder ? (
                      // Render placeholder icon
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                        {scene.selectedIcon.titleInitial}
                      </div>
                    ) : (
                      // Render actual icon
                      <img 
                        src={scene.selectedIcon.preview_url} 
                        alt={scene.selectedIcon.term} 
                        className="w-24 h-24 object-contain"
                        title={`${scene.selectedIcon.term} (${scene.selectedIcon.attribution?.name || 'Noun Project'})`}
                      />
                    )
                  ) : (
                    // Fallback if no selected icon
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                      {scene.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="sm:w-3/4">
                  <p className="text-gray-700 whitespace-pre-wrap">{scene.content_text}</p>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Search terms: {scene.icon_search.map(s => s.primary_term).join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 