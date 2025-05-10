# ResourceGenerator Component Migration

This document describes the migration of the `ResourceGenerator` component from a single monolithic file to a modular directory structure.

## Motivation

The original `ResourceGenerator.tsx` file was large and complex, making it difficult to maintain and extend. By splitting it into smaller, more focused modules, we've made it:

1. **More maintainable**: Each module has a single responsibility
2. **More testable**: Each part can be tested independently
3. **More reusable**: Components can be composed in different ways
4. **Better organized**: Clear separation of concerns

## Migration Strategy

We followed these steps to migrate the component:

1. Created a new directory structure with specific components for each part
2. Extracted shared types and interfaces to `types.ts`
3. Added standardized logging with the `createLogger` utility
4. Split the component into logical modules:
   - Resource type selection
   - Deck selection and creation
   - Content source handling
   - Resource generation
5. Maintained backward compatibility through a facade pattern

## Directory Structure

```
src/components/ResourceGenerator/
├─ index.tsx                 # Main component that coordinates between modules
├─ types.ts                  # Shared types and interfaces
├─ utils.ts                  # Utility functions (logging, etc.)
├─ ResourceTypeSelector.tsx  # UI for selecting resource type
├─ DeckSelector.tsx          # UI for selecting or creating a deck
├─ README.md                 # Documentation
├─ MIGRATION.md              # This migration document
├─ content-sources/          # Components for different content source types
│  ├─ index.tsx              # Main content sources component
│  ├─ ContentSourceSelector.tsx  # UI for selecting content source
│  ├─ ManualContentSource.tsx    # Component for manual text input
│  ├─ UrlContentSource.tsx       # Component for loading from URLs
│  └─ FileContentSource.tsx      # Component for loading from PDF files
└─ generators/               # Components for generating different resource types
   ├─ index.tsx              # Main generators component
   ├─ ConceptMapGenerator.tsx     # Generates concept maps
   ├─ FlashcardGenerator.tsx      # Generates flashcards
   ├─ StoryboardGenerator.tsx     # Generates storyboards
   └─ MultipleChoiceGenerator.tsx # Generates multiple choice questions
```

## Backward Compatibility

To ensure backward compatibility with existing code, we've:

1. Kept the original file path (`src/components/ResourceGenerator.tsx`) as a facade
2. Re-exported the main component and its types from this facade
3. Added a deprecation notice to encourage direct imports from the new module

This approach ensures that:
- Existing code continues to work without changes
- New code can import directly from the modular structure
- Developers are encouraged to migrate to the new imports

## Testing

A test file has been added at `src/tests/ResourceGenerator.test.tsx` to verify that the modular component works as expected. The test covers the generation of all resource types:

- Concept maps
- Flashcards
- Multiple choice questions
- Storyboards

## Future Improvements

Now that the component is modular, future improvements could include:

1. Adding more resource types by extending the `ResourceType` type and adding new generators
2. Enhancing content sources with more options
3. Improving error handling and validation
4. Adding more comprehensive tests for each module 