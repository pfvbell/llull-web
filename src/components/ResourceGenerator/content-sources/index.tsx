import React from 'react';
import { ContentSourceType } from '@/types/content-loaders';
import ContentSourceSelector from './ContentSourceSelector';
import ManualContentSource from './ManualContentSource';
import UrlContentSource from './UrlContentSource';
import FileContentSource from './FileContentSource';
import { createLogger } from '../utils';

const log = createLogger('ContentSources');

interface ContentSourcesProps {
  contentSource: ContentSourceType;
  onContentSourceChange: (source: ContentSourceType) => void;
  onContentLoaded: (content: string) => void;
  disabled?: boolean;
}

const ContentSources = ({ 
  contentSource, 
  onContentSourceChange, 
  onContentLoaded,
  disabled = false 
}: ContentSourcesProps) => {
  log(`Rendering content source: ${contentSource}`);
  
  return (
    <div className="space-y-4">
      <ContentSourceSelector 
        contentSource={contentSource} 
        onChange={onContentSourceChange}
        disabled={disabled}
      />
      
      {contentSource === 'manual' && (
        <ManualContentSource 
          onContentLoaded={onContentLoaded}
          disabled={disabled}
        />
      )}
      
      {contentSource === 'youtube' && (
        <UrlContentSource 
          onContentLoaded={onContentLoaded}
          isYoutube={true}
          disabled={disabled}
        />
      )}
      
      {contentSource === 'url' && (
        <UrlContentSource 
          onContentLoaded={onContentLoaded}
          disabled={disabled}
        />
      )}
      
      {contentSource === 'pdf' && (
        <FileContentSource 
          onContentLoaded={onContentLoaded}
          accept=".pdf"
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default ContentSources; 