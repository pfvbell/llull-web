import React from 'react';
import { ResourceType } from '../types';
import ConceptMapGenerator from './ConceptMapGenerator';
import FlashcardGenerator from './FlashcardGenerator';
import StoryboardGenerator from './StoryboardGenerator';
import MultipleChoiceGenerator from './MultipleChoiceGenerator';
import { ResourceGeneratorProps } from '../types';
import { createLogger } from '../utils';
import LoadingIndicator from '../LoadingIndicator';

const log = createLogger('Generators');

interface GeneratorsProps extends ResourceGeneratorProps {
  resourceType: ResourceType;
  text: string;
  deckId: string;
  isGenerating: boolean;
  onGenerate: (isGenerating: boolean) => void;
  onError: (error: string | null) => void;
}

const Generators = ({
  resourceType,
  text,
  deckId,
  isGenerating,
  onGenerate,
  onError,
  onGenerateConceptMap,
  onGenerateFlashcard,
  onGenerateMultipleChoice
}: GeneratorsProps) => {
  log(`Rendering generator for type: ${resourceType}, isGenerating: ${isGenerating}`);
  
  // If generating, show the loading indicator
  if (isGenerating) {
    return (
      <div className="mt-6">
        <LoadingIndicator resourceType={resourceType} />
      </div>
    );
  }
  
  return (
    <div>
      {resourceType === 'concept-map' && (
        <ConceptMapGenerator
          text={text}
          deckId={deckId}
          isGenerating={isGenerating}
          onGenerate={onGenerate}
          onError={onError}
          onGenerateConceptMap={onGenerateConceptMap}
        />
      )}
      
      {resourceType === 'flashcard' && (
        <FlashcardGenerator
          text={text}
          deckId={deckId}
          isGenerating={isGenerating}
          onGenerate={onGenerate}
          onError={onError}
          onGenerateFlashcard={onGenerateFlashcard}
        />
      )}
      
      {resourceType === 'storyboard' && (
        <StoryboardGenerator
          text={text}
          deckId={deckId}
          isGenerating={isGenerating}
          onGenerate={onGenerate}
          onError={onError}
        />
      )}
      
      {resourceType === 'multiple-choice' && (
        <MultipleChoiceGenerator
          text={text}
          deckId={deckId}
          isGenerating={isGenerating}
          onGenerate={onGenerate}
          onError={onError}
          onGenerateMultipleChoice={onGenerateMultipleChoice}
        />
      )}
    </div>
  );
};

export default Generators; 