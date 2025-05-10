'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Storyboard, StoryboardScene } from '@/types/index';
import { supabase } from '@/lib/supabase';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[StoryboardCreate] ${message}`, data ? data : '');
};

// Content component that uses search params
function StoryboardCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sceneIcons, setSceneIcons] = useState<Record<number, any[]>>({});
  const [iconLoadingStatus, setIconLoadingStatus] = useState<Record<number, 'loading' | 'error' | 'loaded'>>({});
  // New state to track the currently selected icon for each scene
  const [selectedIconIndices, setSelectedIconIndices] = useState<Record<number, number>>({});
  
  useEffect(() => {
    const initializeStoryboard = async () => {
      try {
        setLoading(true);
        const dataParam = searchParams.get('data');
        
        if (dataParam) {
          log('Initializing from URL data');
          const parsedData = JSON.parse(decodeURIComponent(dataParam)) as Storyboard;
          setStoryboard(parsedData);
          
          // Fetch icons for each scene
          await fetchIconsForScenes(parsedData.scenes);
        } else {
          log('No data provided, creating empty storyboard');
          setStoryboard({
            id: crypto.randomUUID(),
            title: 'Untitled Storyboard',
            description: '',
            scenes: [],
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error initializing storyboard:', err);
        setError('Failed to initialize storyboard');
      } finally {
        setLoading(false);
      }
    };
    
    initializeStoryboard();
  }, [searchParams]);
  
  const fetchIconsForScenes = async (scenes: StoryboardScene[], retryScene?: number) => {
    const iconsMap: Record<number, any[]> = { ...sceneIcons };
    const statusMap: Record<number, 'loading' | 'error' | 'loaded'> = { ...iconLoadingStatus };
    const initialSelectedIndices: Record<number, number> = { ...selectedIconIndices };
    
    // If retrying a specific scene, only fetch for that scene
    const scenesToProcess = retryScene !== undefined 
      ? [{ scene: scenes[retryScene], index: retryScene }] 
      : scenes.map((scene, index) => ({ scene, index }));
    
    for (const { scene, index } of scenesToProcess) {
      iconsMap[index] = [];
      statusMap[index] = 'loading';
      initialSelectedIndices[index] = 0; // Default to first icon
      setIconLoadingStatus(statusMap);
      
      let fetchSucceeded = false;
      
      for (const iconSearch of scene.icon_search) {
        try {
          log(`Fetching icon for scene ${index+1}, term: ${iconSearch.primary_term}`);
          
          const response = await fetch('/api/get-noun-project-icon', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              keyword: scene.title,
              searchTerm: iconSearch.primary_term,
              semanticTags: iconSearch.alternative_terms
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch icon: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.icons && data.icons.length > 0) {
            iconsMap[index].push(...data.icons);
            fetchSucceeded = true;
          }
        } catch (err) {
          console.error(`Error fetching icon for scene ${index+1}:`, err);
        }
      }
      
      // Update the status based on whether we found any icons
      statusMap[index] = fetchSucceeded ? 'loaded' : 'error';
      
      // If we didn't find any icons, generate a placeholder
      if (!fetchSucceeded) {
        // Create a placeholder icon using the scene title initial
        const titleInitial = scene.title.charAt(0).toUpperCase();
        iconsMap[index].push({
          id: `placeholder-${index}`,
          term: scene.title,
          isPlaceholder: true,
          titleInitial
        });
      }
      
      setSceneIcons({ ...iconsMap });
      setIconLoadingStatus({ ...statusMap });
    }
    
    // Set initial selected icon indices
    setSelectedIconIndices(initialSelectedIndices);
  };
  
  const retryFetchingIcons = (sceneIndex: number) => {
    if (!storyboard) return;
    fetchIconsForScenes(storyboard.scenes, sceneIndex);
  };
  
  // New function to handle changing the selected icon
  const handleIconChange = (sceneIndex: number, direction: 'next' | 'prev') => {
    const icons = sceneIcons[sceneIndex] || [];
    if (icons.length <= 1) return; // No need to change if there's only one icon
    
    const currentIndex = selectedIconIndices[sceneIndex] || 0;
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % icons.length;
    } else {
      newIndex = (currentIndex - 1 + icons.length) % icons.length;
    }
    
    log(`Changing icon for scene ${sceneIndex} from index ${currentIndex} to ${newIndex}`);
    
    setSelectedIconIndices({
      ...selectedIconIndices,
      [sceneIndex]: newIndex
    });
  };
  
  const handleSave = async () => {
    if (!storyboard) return;
    
    try {
      setSaving(true);
      log('Saving storyboard');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Create a copy of the storyboard with selected icons
      const storyboardWithIcons = {
        ...storyboard,
        scenes: storyboard.scenes.map((scene, index) => {
          // Get the currently selected icon for this scene
          const selectedIconIndex = selectedIconIndices[index] || 0;
          const selectedIcon = sceneIcons[index]?.[selectedIconIndex];
          
          return {
            ...scene,
            // Add the selected icon to the scene data
            selectedIcon: selectedIcon ? {
              id: selectedIcon.id,
              term: selectedIcon.term,
              preview_url: selectedIcon.preview_url,
              isPlaceholder: selectedIcon.isPlaceholder || false,
              titleInitial: selectedIcon.titleInitial,
              attribution: selectedIcon.attribution
            } : undefined
          };
        })
      };
      
      // Match the structure of how storyboards are loaded in the dashboard
      const storyboardData = {
        id: storyboardWithIcons.id,
        title: storyboardWithIcons.title,
        content: JSON.stringify({
          description: storyboardWithIcons.description,
          scenes: storyboardWithIcons.scenes
        }),
        user_id: user.id,
        created_at: storyboardWithIcons.createdAt,
        last_reviewed_at: null,
        next_review_at: null,
        review_count: 0,
        deck_id: storyboardWithIcons.deck_id || null
      };
      
      log('Saving storyboard with data structure:', {
        id: storyboardData.id,
        title: storyboardData.title,
        contentLength: storyboardData.content.length,
        user_id: storyboardData.user_id,
        created_at: storyboardData.created_at
      });
      
      // Save to the database using the correct table name ('storyboards')
      const { data, error: saveError } = await supabase
        .from('storyboards')
        .upsert(storyboardData);
      
      if (saveError) {
        console.error('Supabase error details:', {
          code: saveError.code,
          message: saveError.message,
          details: saveError.details,
          hint: saveError.hint
        });
        throw saveError;
      }
      
      log('Storyboard saved successfully');
      router.push('/dashboard');
    } catch (err) {
      console.error('Error saving storyboard:', err);
      
      // Better error handling with specific messages
      if (err instanceof Error) {
        if (err.message.includes('404')) {
          setError('Failed to save storyboard: The database table "storyboards" may not exist');
        } else if (err.message.includes('auth')) {
          setError('Failed to save storyboard: Authentication error. Please log in again.');
        } else if (err.message.includes('violates foreign key constraint')) {
          setError('Failed to save storyboard: The selected deck may not exist.');
        } else {
          setError(`Failed to save storyboard: ${err.message}`);
        }
      } else {
        setError('Failed to save storyboard: Unknown error');
      }
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  if (!storyboard) {
    return null;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{storyboard.title}</h1>
        <p className="text-gray-600">{storyboard.description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {storyboard.scenes.map((scene, index) => {
          const icons = sceneIcons[index] || [];
          const selectedIndex = selectedIconIndices[index] || 0;
          const selectedIcon = icons[selectedIndex];
          const hasMultipleIcons = icons.length > 1;
          
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <h2 className="text-xl font-semibold mb-2">{scene.title}</h2>
              <p className="text-gray-700 mb-4">{scene.content_text}</p>
              
              {/* Icon display with navigation */}
              <div className="flex justify-center items-center mb-4">
                {/* Previous icon button */}
                {hasMultipleIcons && (
                  <button 
                    onClick={() => handleIconChange(index, 'prev')}
                    className="p-1 text-blue-500 hover:text-blue-700"
                    aria-label="Previous icon"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                
                {/* Icon display */}
                <div className="w-20 h-20 flex items-center justify-center mx-2">
                  {iconLoadingStatus[index] === 'loading' ? (
                    <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                  ) : selectedIcon ? (
                    selectedIcon.isPlaceholder ? (
                      // Render placeholder icon
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold">
                        {selectedIcon.titleInitial}
                      </div>
                    ) : (
                      // Render actual icon
                      <img 
                        src={selectedIcon.preview_url} 
                        alt={selectedIcon.term} 
                        className="max-w-full max-h-full"
                        title={`${selectedIcon.term} (${selectedIcon.attribution?.name || 'Noun Project'})`}
                      />
                    )
                  ) : null}
                </div>
                
                {/* Next icon button */}
                {hasMultipleIcons && (
                  <button 
                    onClick={() => handleIconChange(index, 'next')}
                    className="p-1 text-blue-500 hover:text-blue-700"
                    aria-label="Next icon"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Icon navigation indicator */}
              {hasMultipleIcons && (
                <div className="flex justify-center mb-2">
                  <span className="text-xs text-gray-500">
                    {selectedIndex + 1} of {icons.length} options
                  </span>
                </div>
              )}
              
              {/* Retry button */}
              {iconLoadingStatus[index] === 'error' && icons.length === 1 && icons[0].isPlaceholder && (
                <div className="flex justify-center mb-2">
                  <button 
                    onClick={() => retryFetchingIcons(index)}
                    className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry loading icons
                  </button>
                </div>
              )}
              
              <div className="text-sm text-gray-500 text-center">
                <p>Search terms: {scene.icon_search.map(s => s.primary_term).join(', ')}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Storyboard'}
        </button>
      </div>
    </div>
  );
}

// Loading fallback component 
function StoryboardLoading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Main page component with Suspense
export default function StoryboardCreate() {
  return (
    <Suspense fallback={<StoryboardLoading />}>
      <StoryboardCreateContent />
    </Suspense>
  );
} 