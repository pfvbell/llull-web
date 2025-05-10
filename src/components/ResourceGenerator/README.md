# ResourceGenerator Component

This directory contains the ResourceGenerator component which is used to generate different types of learning resources (concept maps, flashcards, storyboards, multiple choice questions) using AI.

## Directory Structure

- `index.tsx` - Main component that coordinates between modules
- `types.ts` - Shared types and interfaces
- `utils.ts` - Utility functions (logging, etc.)
- `ResourceTypeSelector.tsx` - UI for selecting resource type
- `DeckSelector.tsx` - UI for selecting or creating a deck
- `content-sources/` - Components for different content source types
  - `index.tsx` - Main content sources component
  - `ContentSourceSelector.tsx` - UI for selecting content source
  - `ManualContentSource.tsx` - Component for manual text input
  - `UrlContentSource.tsx` - Component for loading from URLs (including YouTube)
  - `FileContentSource.tsx` - Component for loading from PDF files
- `generators/` - Components for generating different resource types
  - `index.tsx` - Main generators component
  - `ConceptMapGenerator.tsx` - Generates concept maps
  - `FlashcardGenerator.tsx` - Generates flashcards
  - `StoryboardGenerator.tsx` - Generates storyboards
  - `MultipleChoiceGenerator.tsx` - Generates multiple choice questions

## Usage

```tsx
import ResourceGenerator from '@/components/ResourceGenerator';

// To generate a concept map
<ResourceGenerator onGenerateConceptMap={(conceptMap) => {
  // Handle generated concept map
}} />

// To generate a flashcard
<ResourceGenerator onGenerateFlashcard={(flashcard) => {
  // Handle generated flashcard
}} />

// To generate a multiple choice question
<ResourceGenerator onGenerateMultipleChoice={(question) => {
  // Handle generated multiple choice question
}} />
```

## Development

When adding a new resource type:

1. Add the new type to the `ResourceType` type in `types.ts`
2. Add the new type to the `ResourceTypeSelector.tsx` component
3. Create a new generator component in the `generators/` directory
4. Update the `generators/index.tsx` file to include the new generator 