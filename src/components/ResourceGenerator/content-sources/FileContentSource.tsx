import React, { useRef, useState } from 'react';
import { FileContentSourceProps } from '../types';
import { createLogger } from '../utils';

const log = createLogger('FileContentSource');

const FileContentSource = ({ 
  onContentLoaded, 
  accept = '.pdf',
  disabled = false 
}: FileContentSourceProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentLoadError, setContentLoadError] = useState<string | null>(null);

  const handleLoadContent = async () => {
    if (!fileInputRef.current?.files?.length) {
      setContentLoadError(`Please select a file`);
      return;
    }

    setIsLoadingContent(true);
    setContentLoadError(null);
    
    try {
      const file = fileInputRef.current.files[0];
      log(`Loading ${file.type} file: ${file.name} (${Math.round(file.size/1024)}KB)`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceType', 'pdf'); // Assuming PDF for now
      
      const response = await fetch('/api/load-content', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to load file content`);
      }
      
      const data = await response.json();
      log(`Loaded file content`, { 
        length: data.content.length,
        title: data.title || file.name
      });
      
      onContentLoaded(data.content);
    } catch (err: any) {
      console.error(`Error loading file content:`, err);
      setContentLoadError(err.message || `Failed to load file content`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700">
        File
      </label>
      <div className="flex space-x-2">
        <input
          id="fileInput"
          type="file"
          ref={fileInputRef}
          accept={accept}
          className="flex-1 p-2 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoadingContent || disabled}
        />
        <button
          type="button"
          onClick={handleLoadContent}
          disabled={isLoadingContent || disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoadingContent ? 'Loading...' : 'Load'}
        </button>
      </div>
      
      {contentLoadError && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {contentLoadError}
        </div>
      )}
    </div>
  );
};

export default FileContentSource; 