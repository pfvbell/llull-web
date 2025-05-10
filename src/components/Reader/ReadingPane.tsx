'use client';

import { useState } from 'react';

interface ReadingPaneProps {
  text: string;
  title?: string;
}

const ReadingPane = ({ text, title = 'Untitled Content' }: ReadingPaneProps) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'x-large'>('normal');
  
  // Format paragraphs
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  
  // Font size classes
  const fontSizeClasses = {
    normal: 'text-base',
    large: 'text-lg',
    'x-large': 'text-xl'
  };
  
  // Line height classes
  const lineHeightClasses = {
    normal: 'leading-relaxed',
    large: 'leading-relaxed',
    'x-large': 'leading-relaxed'
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Reading controls */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Font Size:</span>
          <button 
            className={`px-2 py-1 rounded text-sm ${fontSize === 'normal' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFontSize('normal')}
          >
            A
          </button>
          <button 
            className={`px-2 py-1 rounded text-sm font-medium ${fontSize === 'large' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFontSize('large')}
          >
            A
          </button>
          <button 
            className={`px-2 py-1 rounded text-sm font-bold ${fontSize === 'x-large' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFontSize('x-large')}
          >
            A
          </button>
        </div>
      </div>
      
      {/* Reading content */}
      <div 
        className={`prose prose-md max-w-none ${fontSizeClasses[fontSize]} ${lineHeightClasses[fontSize]}`}
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
      
      {/* Word count footer */}
      <div className="mt-6 pt-4 border-t text-sm text-gray-500">
        {text.trim().split(/\s+/).filter(Boolean).length} words
      </div>
    </div>
  );
};

export default ReadingPane; 