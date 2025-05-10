import React from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Storyboard } from '@/types/index';
import { GeneratorProps } from '../types';
import { createLogger } from '../utils';

const log = createLogger('StoryboardGenerator');

interface StoryboardGeneratorProps extends GeneratorProps {
  // No additional props needed for storyboard
}

const StoryboardGenerator = ({
  text,
  deckId,
  isGenerating,
  onGenerate,
  onError
}: StoryboardGeneratorProps) => {
  const router = useRouter();

  const generateStoryboard = async () => {
    try {
      onGenerate(true);
      log('Generating storyboard');
      
      const response = await fetch('/api/generate-icon-storyboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate storyboard');
      }
      
      const data = await response.json();
      
      // Validate the response data
      if (!data || typeof data !== 'object' || !data.function_call) {
        throw new Error('Invalid response data from API');
      }
      
      // Parse the function call arguments if it's a string, otherwise use it directly
      const functionArgs = typeof data.function_call.arguments === 'string' 
        ? JSON.parse(data.function_call.arguments)
        : data.function_call.arguments;
      
      log('Received storyboard from API:', { 
        topic: functionArgs.topic,
        scenes: functionArgs.scene_descriptions?.length || 0
      });
      
      // Create a properly typed Storyboard
      const storyboard: Storyboard = {
        id: uuidv4(),
        title: functionArgs.topic || 'Untitled Storyboard',
        description: `Storyboard with ${functionArgs.scene_descriptions?.length || 0} scenes`,
        scenes: functionArgs.scene_descriptions || [],
        createdAt: new Date().toISOString(),
        deck_id: deckId
      };
      
      log('Generated storyboard:', { 
        id: storyboard.id, 
        title: storyboard.title, 
        scenes: storyboard.scenes.length,
        deck_id: storyboard.deck_id
      });
      
      // Navigate to storyboard editor
      router.push(`/storyboard/create?data=${encodeURIComponent(JSON.stringify(storyboard))}`);
      
      return storyboard;
    } catch (err: any) {
      console.error(`Error generating storyboard:`, err);
      onError(err.message || 'Failed to generate storyboard');
      return null;
    } finally {
      onGenerate(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generateStoryboard}
      disabled={isGenerating || !text.trim()}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      Generate Storyboard
    </button>
  );
};

export default StoryboardGenerator; 