'use client';

import { useState, useEffect } from 'react';
import { ContentSourceType } from '@/types/content-loaders';
import ContentSources from '@/components/ResourceGenerator/content-sources';
import ReadingPane from '@/components/Reader/ReadingPane';
import SidePanel from '@/components/Reader/SidePanel';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[Reader] ${message}`, data ? data : '');
};

export default function Reader() {
  // Content state
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [contentSource, setContentSource] = useState<ContentSourceType>('manual');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedContent, setHasLoadedContent] = useState(false);

  // Reset error state when content source changes
  useEffect(() => {
    setError(null);
  }, [contentSource]);

  // Handle content source change
  const handleContentSourceChange = (source: ContentSourceType) => {
    setContentSource(source);
    log(`Content source changed to: ${source}`);
    
    // Reset text when changing content source (except manual, to keep user text)
    if (source !== 'manual') {
      setText('');
      setTitle('');
    }
  };
  
  // Handle content loaded from source
  const handleContentLoaded = (content: string, metadata?: any) => {
    setText(content);
    setTitle(metadata?.title || 'Untitled Content');
    setHasLoadedContent(true);
    log(`Content loaded, length: ${content.length} characters, title: ${metadata?.title || 'Untitled'}`);
  };

  return (
    <div className="w-full">
      {!hasLoadedContent ? (
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Load Content to Read</h2>
          
          {/* Content Sources */}
          <ContentSources
            contentSource={contentSource}
            onContentSourceChange={handleContentSourceChange}
            onContentLoaded={handleContentLoaded}
            disabled={isLoading}
          />
          
          {/* Text Content Display for manual entry */}
          {contentSource === 'manual' && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Enter or paste content
                </label>
              </div>
              <textarea
                id="content"
                rows={8}
                className="w-full p-4 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter or paste the text you want to read and analyze..."
                disabled={isLoading}
              />
              
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                disabled={!text.trim()}
                onClick={() => setHasLoadedContent(true)}
              >
                Read Content
              </button>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="p-3 mt-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Reading Pane (2/3 width on desktop) */}
          <div className="md:w-2/3">
            <ReadingPane text={text} title={title} />
          </div>
          
          {/* Side Panel (1/3 width on desktop) */}
          <div className="md:w-1/3">
            <SidePanel text={text} />
          </div>
        </div>
      )}
    </div>
  );
} 