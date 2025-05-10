import { ConceptMap, Flashcard, MultipleChoiceQuestion, Deck } from '@/types/index';
import { ContentSourceType } from '@/types/content-loaders';

// Resource type enum
export type ResourceType = 'concept-map' | 'flashcard' | 'storyboard' | 'multiple-choice';

// Props for the main ResourceGenerator component
export interface ResourceGeneratorProps {
  onGenerateConceptMap?: (conceptMap: ConceptMap) => void;
  onGenerateFlashcard?: (flashcard: Flashcard) => void;
  onGenerateMultipleChoice?: (question: MultipleChoiceQuestion) => void;
}

// Props for the ResourceTypeSelector component
export interface ResourceTypeSelectorProps {
  resourceType: ResourceType;
  onChange: (newType: ResourceType) => void;
  disabled?: boolean;
}

// Props for the DeckSelector component
export interface DeckSelectorProps {
  decks: Deck[];
  selectedDeckId: string;
  onChange: (deckId: string) => void;
  onCreateDeck: (title: string) => Promise<string>;
  disabled?: boolean;
}

// Props for content source selector
export interface ContentSourceSelectorProps {
  contentSource: ContentSourceType;
  onChange: (source: ContentSourceType) => void;
  disabled?: boolean;
}

// Props for each content source component
export interface ContentSourceProps {
  onContentLoaded: (content: string) => void;
  disabled?: boolean;
}

// Specific props for URL/YouTube source
export interface UrlContentSourceProps extends ContentSourceProps {
  isYoutube?: boolean;
}

// Props for PDF content source
export interface FileContentSourceProps extends ContentSourceProps {
  accept?: string;
}

// Base generator props
export interface GeneratorProps {
  text: string;
  deckId: string;
  isGenerating: boolean;
  onGenerate: (isGenerating: boolean) => void;
  onError: (error: string | null) => void;
}

// Logger function
export type LogFunction = (message: string, data?: any) => void; 