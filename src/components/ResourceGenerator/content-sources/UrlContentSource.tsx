import React, { useState } from 'react';
import { UrlContentSourceProps } from '../types';
import { createLogger } from '../utils';

const log = createLogger('UrlContentSource');

const UrlContentSource = ({ 
  onContentLoaded, 
  isYoutube = false,
  disabled = false 
}: UrlContentSourceProps) => {
  const [sourceUrl, setSourceUrl] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentLoadError, setContentLoadError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSourceUrl(e.target.value);
  };

  const handleLoadContent = async () => {
    if (!sourceUrl.trim()) {
      setContentLoadError(`Please enter a valid ${isYoutube ? 'YouTube' : 'web page'} URL`);
      return;
    }

    setIsLoadingContent(true);
    setContentLoadError(null);
    
    try {
      log(`Loading content from URL: ${sourceUrl}`);
      
      const response = await fetch('/api/load-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sourceType: isYoutube ? 'youtube' : 'url',
          url: sourceUrl 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to load content from ${isYoutube ? 'YouTube' : 'URL'}`);
      }
      
      const data = await response.json();
      log(`Loaded content from ${isYoutube ? 'YouTube' : 'URL'}`, { 
        length: data.content.length,
        title: data.title || 'Untitled'
      });
      
      onContentLoaded(data.content);
    } catch (err: any) {
      console.error(`Error loading content from ${isYoutube ? 'YouTube' : 'URL'}:`, err);
      setContentLoadError(err.message || `Failed to load content from ${isYoutube ? 'YouTube' : 'URL'}`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700">
        {isYoutube ? 'YouTube URL' : 'Web Page URL'}
      </label>
      <div className="flex space-x-2">
        <input
          id="sourceUrl"
          type="text"
          value={sourceUrl}
          onChange={handleUrlChange}
          placeholder={isYoutube ? 
            "https://www.youtube.com/watch?v=..." : 
            "https://example.com/article"}
          className="flex-1 p-2 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoadingContent || disabled}
        />
        <button
          type="button"
          onClick={handleLoadContent}
          disabled={isLoadingContent || !sourceUrl.trim() || disabled}
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

export default UrlContentSource; 