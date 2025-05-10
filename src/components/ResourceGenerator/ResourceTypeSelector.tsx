import React from 'react';
import { ResourceTypeSelectorProps } from './types';
import { createLogger } from './utils';
import { 
  MapIcon, 
  IdentificationIcon, 
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/outline';

const log = createLogger('ResourceTypeSelector');

const ResourceTypeSelector = ({ resourceType, onChange, disabled = false }: ResourceTypeSelectorProps) => {
  const handleTypeChange = (newType: 'concept-map' | 'flashcard' | 'storyboard' | 'multiple-choice') => {
    onChange(newType);
    log(`Resource type changed to: ${newType}`);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Resource Type
      </label>
      <div className="flex flex-wrap rounded-md overflow-hidden border">
        <button
          type="button"
          onClick={() => handleTypeChange('concept-map')}
          className={`flex items-center justify-center space-x-2 flex-1 py-2 px-4 transition-colors ${
            resourceType === 'concept-map' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          disabled={disabled}
        >
          <MapIcon className="w-5 h-5" />
          <span>Concept Map</span>
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('flashcard')}
          className={`flex items-center justify-center space-x-2 flex-1 py-2 px-4 transition-colors ${
            resourceType === 'flashcard' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          disabled={disabled}
        >
          <IdentificationIcon className="w-5 h-5" />
          <span>Flashcard</span>
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('storyboard')}
          className={`flex items-center justify-center space-x-2 flex-1 py-2 px-4 transition-colors ${
            resourceType === 'storyboard' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          disabled={disabled}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Storyboard</span>
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('multiple-choice')}
          className={`flex items-center justify-center space-x-2 flex-1 py-2 px-4 transition-colors ${
            resourceType === 'multiple-choice' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          disabled={disabled}
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
          <span>Multiple Choice</span>
        </button>
      </div>
    </div>
  );
};

export default ResourceTypeSelector; 