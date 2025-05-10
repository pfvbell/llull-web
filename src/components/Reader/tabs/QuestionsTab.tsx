'use client';

import React, { useState } from 'react';

interface Question {
  question: string;
  significance: string;
  skills: string[];
}

interface QuestionsTabProps {
  questions: Question[];
  isLoading: boolean;
  onRefresh: () => void;
}

const QuestionsTab: React.FC<QuestionsTabProps> = ({ questions, isLoading, onRefresh }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  const toggleExpand = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Deep Questions</h3>
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
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 border rounded-md">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div 
              key={index} 
              className="border rounded-md overflow-hidden transition-all duration-200"
            >
              <div 
                className="p-3 bg-beige-50 cursor-pointer flex justify-between items-center"
                onClick={() => toggleExpand(index)}
              >
                <h4 className="font-medium text-gray-800">{question.question}</h4>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 transform transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {expandedIndex === index && (
                <div className="p-3 border-t">
                  <div className="mb-2">
                    <h5 className="text-sm font-medium text-gray-700">Why this matters:</h5>
                    <p className="text-sm text-gray-600">{question.significance}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700">Skills developed:</h5>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {question.skills.map((skill, skillIndex) => (
                        <span 
                          key={skillIndex}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <p>Deep questions will appear here</p>
          <button 
            onClick={onRefresh}
            className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Generate Questions
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionsTab; 