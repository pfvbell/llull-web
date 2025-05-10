/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import directly from '@/components/ResourceGenerator' instead.
 */

/**
 * This module contains the ResourceGenerator component which has been modularized for better maintainability.
 * This file provides backwards compatibility with existing imports.
 */

// Re-export the main component
export { default } from './ResourceGenerator/index';

// Re-export types
export type {
  ResourceType,
  ResourceGeneratorProps,
  ResourceTypeSelectorProps,
  DeckSelectorProps,
  ContentSourceProps,
  UrlContentSourceProps,
  FileContentSourceProps,
  GeneratorProps,
  LogFunction
} from './ResourceGenerator/types';

// Re-export utility functions
export { createLogger } from './ResourceGenerator/utils';

// Re-export individual components in case they were imported directly
export { default as ResourceTypeSelector } from './ResourceGenerator/ResourceTypeSelector';
export { default as DeckSelector } from './ResourceGenerator/DeckSelector';
export { default as ContentSources } from './ResourceGenerator/content-sources';
export { default as Generators } from './ResourceGenerator/generators'; 