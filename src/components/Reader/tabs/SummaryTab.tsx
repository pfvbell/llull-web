'use client';

import React from 'react';

interface SummaryTabProps {
  summary: string;
  isLoading: boolean;
  onRefresh: () => void;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ summary, isLoading, onRefresh }) => {
  // Format summary paragraphs
  const paragraphs = summary ? summary.split(/\n\n+/) : [];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Content Summary</h3>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {isLoading ? 'Generating...' : 'Regenerate'}
        </button>
      </div>
      
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      ) : summary ? (
        <div className="prose prose-sm max-w-none">
          {paragraphs.map((paragraph, index) => (
            <p 
              key={index} 
              className={index === 0 ? 'font-medium' : 'mt-2'}
            >
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <p>Summary will appear here</p>
          <button 
            onClick={onRefresh}
            className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Generate Summary
          </button>
        </div>
      )}
    </div>
  );
};

export default SummaryTab; 