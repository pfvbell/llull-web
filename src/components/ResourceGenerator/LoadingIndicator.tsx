import { useState, useEffect } from 'react';
import { ResourceType } from './types';
import { createLogger } from './utils';

const log = createLogger('LoadingIndicator');

interface LoadingIndicatorProps {
  resourceType: ResourceType;
}

const LoadingIndicator = ({ resourceType }: LoadingIndicatorProps) => {
  const [tipIndex, setTipIndex] = useState(0);
  
  // Tips for each resource type
  const tips = {
    'concept-map': [
      'Tip 1: Use a hierarchical structure to show relationships between concepts',
      'Tip 2: Include cross-links to show how concepts in different areas are related',
      'Tip 3: Keep node labels concise - use single words or short phrases'
    ],
    'flashcard': [
      'Tip 1: Keep questions clear and focused on a single concept',
      'Tip 2: Use simple language but be precise with terminology',
      'Tip 3: Include images or diagrams when explaining visual concepts'
    ],
    'storyboard': [
      'Tip 1: Organize panels in a logical sequence to tell a coherent story',
      'Tip 2: Use visual cues to highlight important concepts or transitions',
      'Tip 3: Include brief text descriptions to complement visuals'
    ],
    'multiple-choice': [
      'Tip 1: Create plausible distractors that address common misconceptions',
      'Tip 2: Ensure there is only one clear correct answer',
      'Tip 3: Keep question stems clear and free of unnecessary information'
    ]
  };

  // Get current resource type tips
  const currentTips = tips[resourceType] || [];
  
  // Rotate through tips every 3 seconds
  useEffect(() => {
    if (currentTips.length === 0) return;
    
    log(`Showing tip ${tipIndex + 1}/${currentTips.length} for ${resourceType}`);
    
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % currentTips.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [tipIndex, currentTips, resourceType]);

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      <div className="relative w-32 h-24">
        {/* First disk with explicit animation styles */}
        <div 
          className="absolute top-2 left-2 w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
          style={{ 
            animation: 'spin 4s linear infinite',
            transformOrigin: 'center center'
          }}
        >
          <div className="w-full h-1 bg-green-400"></div>
          <div className="h-full w-1 bg-green-400 absolute"></div>
        </div>
        
        {/* Second disk with explicit animation styles */}
        <div 
          className="absolute top-2 left-14 w-16 h-16 rounded-full bg-green-600 flex items-center justify-center"
          style={{ 
            animation: 'spinReverse 4s linear infinite',
            transformOrigin: 'center center'
          }}
        >
          <div className="w-full h-1 bg-green-500"></div>
          <div className="h-full w-1 bg-green-500 absolute"></div>
        </div>
      </div>
      
      <div className="mt-4 text-center min-h-16">
        <p className="text-gray-700 transition-opacity duration-300">
          {currentTips[tipIndex]}
        </p>
      </div>

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spinReverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingIndicator; 