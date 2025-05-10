'use client';

import { useState, useEffect, Component, ErrorInfo } from 'react';
import { Storyboard, StoryboardScene } from '@/types/index';
import '@/styles/StoryboardReview.css';
import { updateResourceReviewStatus } from '@/lib/review-queue';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[StoryboardReview] ${message}`, data ? data : '');
};

interface StoryboardReviewProps {
  storyboard: Storyboard;
  onComplete: (score: number, total: number, viewingAnswers?: boolean, hintsUsed?: boolean) => void;
}

interface DraggableIcon {
  id: string;
  sceneIndex: number;
  icon: StoryboardScene['selectedIcon'];
}

// Error boundary component to catch rendering errors
class StoryboardReviewErrorBoundary extends Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[StoryboardReview] Error caught by boundary:', error, errorInfo);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // The error will be handled by the onError callback
    }
    return this.props.children;
  }
}

// Wrapper component for StoryboardReview
export default function StoryboardReviewWrapper(props: StoryboardReviewProps) {
  const [error, setError] = useState<Error | null>(null);
  
  const handleError = (error: Error) => {
    log('Error caught in StoryboardReview component:', error);
    setError(error);
  };
  
  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-red-600 mb-4">Review Error</h2>
        <p className="mb-4">
          An error occurred while loading the storyboard review. 
          This might be due to missing or corrupted data.
        </p>
        <pre className="bg-gray-100 p-4 rounded text-xs mb-4 overflow-auto max-h-40">
          {error.message}
        </pre>
        <button
          onClick={() => props.onComplete(0, 0, false, false)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Review Session
        </button>
      </div>
    );
  }
  
  return (
    <StoryboardReviewErrorBoundary onError={handleError}>
      <StoryboardReviewImplementation {...props} />
    </StoryboardReviewErrorBoundary>
  );
}

// The actual implementation - renamed from the original export default function
function StoryboardReviewImplementation({ storyboard, onComplete }: StoryboardReviewProps) {
  // Enhanced initialization logging
  log('Initializing StoryboardReview component with:', {
    storyboardId: storyboard.id,
    title: storyboard.title,
    scenesCount: storyboard.scenes?.length || 0,
    hasScenes: Array.isArray(storyboard.scenes),
    scenesValid: Array.isArray(storyboard.scenes) && storyboard.scenes.every(scene => 
      scene && typeof scene === 'object' && 'title' in scene && 'content_text' in scene
    )
  });
  
  // Handle missing scenes with fallback
  const [scenesError, setScenesError] = useState<string | null>(null);
  
  // State to track which icons have been dropped on which scenes
  const [droppedIcons, setDroppedIcons] = useState<Record<number, DraggableIcon | null>>({});
  // Available icons to drag (icons not yet dropped)
  const [availableIcons, setAvailableIcons] = useState<DraggableIcon[]>([]);
  // Track which icon is currently being dragged
  const [draggedIcon, setDraggedIcon] = useState<DraggableIcon | null>(null);
  // Track correct placements
  const [correctPlacements, setCorrectPlacements] = useState<Record<number, boolean>>({});
  // Track if the review is complete
  const [isComplete, setIsComplete] = useState(false);
  // Track score
  const [score, setScore] = useState<number>(0);
  // Track if all icons are placed
  const [allPlaced, setAllPlaced] = useState(false);
  // Track if hints were used
  const [hintsUsed, setHintsUsed] = useState(false);
  
  // Extract and shuffle icons on component mount
  useEffect(() => {
    if (!storyboard.scenes || !Array.isArray(storyboard.scenes) || storyboard.scenes.length === 0) {
      log('ERROR: Storyboard has no valid scenes array', storyboard);
      setScenesError('This storyboard has no scenes or invalid scene data. Unable to proceed with review.');
      return;
    }
    
    // Ensure each scene has the required properties
    const validScenes = storyboard.scenes.every(scene => 
      scene && typeof scene === 'object' && 'title' in scene && 'content_text' in scene
    );
    
    if (!validScenes) {
      log('ERROR: Storyboard has malformed scenes', storyboard.scenes);
      setScenesError('This storyboard has invalid scene data. Unable to proceed with review.');
      return;
    }

    log('Processing scenes for review:', { 
      scenesCount: storyboard.scenes.length,
      sceneSample: storyboard.scenes[0] ? {
        title: storyboard.scenes[0].title,
        hasContent: !!storyboard.scenes[0].content_text,
        hasSelectedIcon: !!storyboard.scenes[0].selectedIcon,
      } : 'No scenes'
    });
    
    const scenesWithIcons = storyboard.scenes
      .map((scene, index) => ({
        sceneIndex: index,
        icon: scene.selectedIcon || {
          // Fallback placeholder icon
          id: `placeholder-${index}`,
          term: scene.title,
          isPlaceholder: true,
          titleInitial: scene.title.charAt(0).toUpperCase()
        }
      }))
      .filter(item => !!item.icon);
    
    // Shuffle the icons to create a random order
    const shuffled = [...scenesWithIcons].sort(() => Math.random() - 0.5);
    
    // Create draggable icon objects with unique IDs
    const draggableIcons = shuffled.map(item => ({
      id: `icon-${item.sceneIndex}`,
      sceneIndex: item.sceneIndex,
      icon: item.icon
    }));
    
    log(`Created ${draggableIcons.length} draggable icons for review`);
    setAvailableIcons(draggableIcons);
    
    // Initialize dropped icons with null values
    const initialDroppedIcons: Record<number, DraggableIcon | null> = {};
    const initialCorrectPlacements: Record<number, boolean> = {};
    storyboard.scenes.forEach((_, index) => {
      initialDroppedIcons[index] = null;
      initialCorrectPlacements[index] = false;
    });
    setDroppedIcons(initialDroppedIcons);
    setCorrectPlacements(initialCorrectPlacements);
  }, [storyboard.scenes]);
  
  const handleDragStart = (icon: DraggableIcon) => {
    setDraggedIcon(icon);
    log(`Started dragging icon: ${icon.id} (scene ${icon.sceneIndex})`);
  };
  
  const handleDragOver = (e: React.DragEvent, sceneIndex: number) => {
    e.preventDefault(); // Necessary to allow dropping
  };
  
  const handleDrop = (e: React.DragEvent, sceneIndex: number) => {
    e.preventDefault();
    if (!draggedIcon) return;
    
    log(`Dropped icon ${draggedIcon.id} on scene ${sceneIndex}`);
    
    // Check if dropping on an already filled drop zone
    const currentIcon = droppedIcons[sceneIndex];
    if (currentIcon) {
      // If there's already an icon here, put it back in available icons
      setAvailableIcons(prev => [...prev, currentIcon]);
      log(`Returned icon ${currentIcon.id} to available icons`);
    }
    
    // Remove icon from available icons
    setAvailableIcons(prev => prev.filter(icon => icon.id !== draggedIcon.id));
    
    // Add icon to dropped icons
    setDroppedIcons(prev => ({
      ...prev,
      [sceneIndex]: draggedIcon
    }));
    
    // Check if this is the correct icon for this scene
    const isCorrectPlacement = draggedIcon.sceneIndex === sceneIndex;
    if (isCorrectPlacement) {
      log(`Correct placement for scene ${sceneIndex}!`);
      setCorrectPlacements(prev => ({
        ...prev,
        [sceneIndex]: true
      }));
    }
    
    setDraggedIcon(null);
    
    // Check if all icons have been placed
    const newDroppedIcons = {
      ...droppedIcons,
      [sceneIndex]: draggedIcon
    };
    
    const allPlaced = storyboard.scenes.every((_, index) => newDroppedIcons[index] !== null);
    setAllPlaced(allPlaced);
    
    if (allPlaced) {
      log('All icons have been placed, ready for evaluation');
    }
  };
  
  const handleReviewComplete = async () => {
    // Count correct placements
    const correctCount = Object.values(correctPlacements).filter(Boolean).length;
    const totalCount = storyboard.scenes.length;
    
    log(`Review completed with score: ${correctCount}/${totalCount}`);
    setScore(correctCount);
    setIsComplete(true);
    
    try {
      // Update the review status using the Llull Algorithm
      if (storyboard.id) {
        log('Updating storyboard review status with Llull Algorithm');
        const success = await updateResourceReviewStatus(
          storyboard.id,
          correctCount,
          totalCount,
          'storyboard'
        );
        
        if (success) {
          log('Successfully updated storyboard review status');
        } else {
          log('Failed to update storyboard review status');
        }
      }
    } catch (error) {
      console.error('[StoryboardReview] Error updating review status:', error);
    }
    
    // Call the onComplete callback with the score
    onComplete(correctCount, totalCount, false, hintsUsed);
  };
  
  const handleRemoveIcon = (sceneIndex: number) => {
    const iconToRemove = droppedIcons[sceneIndex];
    if (!iconToRemove) return;
    
    // Return icon to available icons
    setAvailableIcons(prev => [...prev, iconToRemove]);
    
    // Remove from dropped icons
    setDroppedIcons(prev => ({
      ...prev,
      [sceneIndex]: null
    }));
    
    // Reset correct placement status
    setCorrectPlacements(prev => ({
      ...prev,
      [sceneIndex]: false
    }));
    
    // Update allPlaced status
    setAllPlaced(false);
    
    log(`Removed icon from scene ${sceneIndex}`);
  };

  // Handle showing hints (automatically place icons 1 and 3 correctly)
  const handleShowHint = () => {
    log('Showing hints for scenes 1 and 3');
    setHintsUsed(true);
    
    // Define the hint scene indices (we're using 1 and 3, but adjusting for 0-based indexing)
    const hintScenes = [1, 3];
    
    // Process both hint scenes
    hintScenes.forEach(sceneIndex => {
      // Don't provide hint if this scene already has the correct icon
      if (correctPlacements[sceneIndex]) {
        log(`Scene ${sceneIndex} already has correct placement, skipping hint`);
        return;
      }
      
      // If there's an icon already placed here, put it back in available icons
      const currentIcon = droppedIcons[sceneIndex];
      if (currentIcon) {
        setAvailableIcons(prev => [...prev, currentIcon]);
      }
      
      // Find the correct icon for this scene in availableIcons
      const correctIcon = availableIcons.find(icon => icon.sceneIndex === sceneIndex);
      
      if (correctIcon) {
        log(`Placing correct icon for scene ${sceneIndex} as hint`);
        
        // Remove from available icons
        setAvailableIcons(prev => prev.filter(icon => icon.id !== correctIcon.id));
        
        // Place in the correct scene
        setDroppedIcons(prev => ({
          ...prev,
          [sceneIndex]: correctIcon
        }));
        
        // Mark as correct placement
        setCorrectPlacements(prev => ({
          ...prev,
          [sceneIndex]: true
        }));
      } else {
        log(`Could not find correct icon for scene ${sceneIndex} in available icons`);
      }
    });
    
    // Check if all icons are now placed
    setTimeout(() => {
      const allPlaced = storyboard.scenes.every((_, index) => droppedIcons[index] !== null);
      setAllPlaced(allPlaced);
    }, 0);
  };
  
  // Helper function to render an icon - MOVED BEFORE RETURN STATEMENTS TO FIX INITIALIZATION ERROR
  const renderIcon = (icon: StoryboardScene['selectedIcon'], isDragging = false, sceneIndex?: number) => {
    if (!icon) return null;
    
    const iconClasses = `${
      isDragging ? 'cursor-grab active:cursor-grabbing' : ''
    } transition-transform`;
    
    if (icon.isPlaceholder) {
      return (
        <div 
          className={`w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold ${iconClasses}`}
        >
          {icon.titleInitial}
        </div>
      );
    } else {
      return (
        <img 
          src={icon.preview_url} 
          alt={icon.term} 
          className={`w-16 h-16 object-contain ${iconClasses}`}
          title={`${icon.term} (${icon.attribution?.name || 'Noun Project'})`}
        />
      );
    }
  };
  
  // Show error message if storyboard has no scenes or invalid scenes
  if (scenesError) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-red-600 mb-4">Review Error</h2>
        <p className="mb-4">{scenesError}</p>
        <button
          onClick={() => onComplete(0, 0, false, false)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Review Session
        </button>
      </div>
    );
  }
  
  if (isComplete) {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Review Complete!</h2>
        <p className="text-lg mb-6">
          You matched {score} out of {storyboard.scenes.length} icons correctly.
          {hintsUsed && <span className="text-gray-500 text-sm ml-2">(with hints)</span>}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {storyboard.scenes.map((scene, index) => {
            const isCorrect = correctPlacements[index];
            return (
              <div 
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex justify-center mb-3">
                  {renderIcon(scene.selectedIcon, false, index)}
                </div>
                <h3 className="font-medium text-sm mb-2">{scene.title}</h3>
                <p className="text-xs text-gray-600 mb-3">{scene.content_text}</p>
                {isCorrect ? (
                  <div className="mt-2 flex justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="mt-2 flex justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-6 text-center">
          Drag the icons to the correct spaces
        </h2>
        
        {/* Available icons to drag */}
        <div className="bg-gray-100 p-4 rounded-lg mb-8">
          <h3 className="text-sm font-medium mb-3 text-gray-500">
            {availableIcons.length > 0 ? 'Available Icons:' : 'All icons placed! Check your matches below.'}
          </h3>
          <div className="flex flex-wrap gap-4 justify-center">
            {availableIcons.map(icon => (
              <div 
                key={icon.id}
                draggable
                onDragStart={() => handleDragStart(icon)}
                className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-grab"
              >
                {renderIcon(icon.icon, true)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Scenes with drop zones in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {storyboard.scenes.map((scene, index) => {
            const isCorrect = correctPlacements[index];
            
            return (
              <div 
                key={index}
                className={`
                  p-4 rounded-lg transition-colors
                  ${isCorrect 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'border-2 border-dashed border-gray-300 hover:border-blue-300'
                  }
                  ${droppedIcons[index] && !isCorrect ? 'bg-yellow-50' : ''}
                `}
              >
                {/* Drop zone for icon */}
                <div 
                  className={`w-full flex flex-col items-center ${isCorrect ? '' : 'min-h-32'}`}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className={`mb-3 ${isCorrect ? 'transform scale-110 transition-transform' : ''}`}>
                    {droppedIcons[index] ? (
                      <div className="relative group">
                        {renderIcon(droppedIcons[index]?.icon)}
                        <button 
                          onClick={() => handleRemoveIcon(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove icon"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <div className="text-gray-400 text-xs text-center">
                          Drop icon here
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Show content only for correct placements */}
                  {isCorrect && (
                    <div className="mt-2 text-center animate-fadeIn">
                      <h3 className="font-medium text-sm mb-1">{scene.title}</h3>
                      <p className="text-xs text-gray-600">{scene.content_text}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          {/* Hint Button - only show if not all icons are placed and hints not already used */}
          {!hintsUsed && !allPlaced && (
            <button
              onClick={handleShowHint}
              className="px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md hover:bg-yellow-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Show Hints
            </button>
          )}
          
          {/* Submit button - only enabled when all scenes have icons */}
          <button
            onClick={handleReviewComplete}
            disabled={!allPlaced}
            className={`px-6 py-2 rounded-md ${
              !allPlaced
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Finish Review
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
} 