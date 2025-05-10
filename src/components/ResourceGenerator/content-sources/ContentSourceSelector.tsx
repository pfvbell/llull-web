import React from 'react';
import { ContentSourceSelectorProps } from '../types';
import { createLogger } from '../utils';
import { 
  DocumentTextIcon, 
  VideoCameraIcon, 
  DocumentIcon, 
  GlobeAltIcon 
} from '@heroicons/react/24/outline';

const log = createLogger('ContentSourceSelector');

const ContentSourceSelector = ({ 
  contentSource, 
  onChange, 
  disabled = false 
}: ContentSourceSelectorProps) => {
  const handleSourceChange = (source: 'manual' | 'youtube' | 'pdf' | 'url') => {
    onChange(source);
    log(`Content source changed to: ${source}`);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Content Source
      </label>
      <div className="flex space-x-2 mb-3">
        <button
          type="button"
          onClick={() => handleSourceChange('manual')}
          className={`p-3 flex flex-col items-center rounded-md transition-colors ${
            contentSource === 'manual'
              ? 'bg-blue-100 border-2 border-blue-500 text-blue-600'
              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
          disabled={disabled}
        >
          <DocumentTextIcon className="w-6 h-6 mb-1" />
          <span className="text-xs">Manual</span>
        </button>
        <button
          type="button"
          onClick={() => handleSourceChange('youtube')}
          className={`p-3 flex flex-col items-center rounded-md transition-colors ${
            contentSource === 'youtube'
              ? 'bg-blue-100 border-2 border-blue-500 text-blue-600'
              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
          disabled={disabled}
        >
          <VideoCameraIcon className="w-6 h-6 mb-1" />
          <span className="text-xs">YouTube</span>
        </button>
        <button
          type="button"
          onClick={() => handleSourceChange('pdf')}
          className={`p-3 flex flex-col items-center rounded-md transition-colors ${
            contentSource === 'pdf'
              ? 'bg-blue-100 border-2 border-blue-500 text-blue-600'
              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
          disabled={disabled}
        >
          <DocumentIcon className="w-6 h-6 mb-1" />
          <span className="text-xs">PDF</span>
        </button>
        <button
          type="button"
          onClick={() => handleSourceChange('url')}
          className={`p-3 flex flex-col items-center rounded-md transition-colors ${
            contentSource === 'url'
              ? 'bg-blue-100 border-2 border-blue-500 text-blue-600'
              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
          disabled={disabled}
        >
          <GlobeAltIcon className="w-6 h-6 mb-1" />
          <span className="text-xs">Web Page</span>
        </button>
      </div>
    </div>
  );
};

export default ContentSourceSelector; 