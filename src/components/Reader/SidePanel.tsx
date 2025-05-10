'use client';

import { useState, useEffect } from 'react';
import SummaryTab from './tabs/SummaryTab';
import QuestionsTab from './tabs/QuestionsTab';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[SidePanel] ${message}`, data ? data : '');
};

type TabType = 'summary' | 'questions';

interface SidePanelProps {
  text: string;
}

const SidePanel = ({ text }: SidePanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [summary, setSummary] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    if (summary || !text.trim() || isLoadingSummary) return;
    
    try {
      setIsLoadingSummary(true);
      setError(null);
      
      log('Fetching summary');
      
      const response = await fetch('/api/generate-reader-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          contentType: 'summary',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }
      
      const data = await response.json();
      setSummary(data.summary);
      log('Summary generated successfully');
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchQuestions = async () => {
    if (questions.length > 0 || !text.trim() || isLoadingQuestions) return;
    
    try {
      setIsLoadingQuestions(true);
      setError(null);
      
      log('Fetching deep questions');
      
      const response = await fetch('/api/generate-reader-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          contentType: 'questions',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate questions');
      }
      
      const data = await response.json();
      setQuestions(data.questions || []);
      log(`Generated ${data.questions?.length || 0} questions`);
    } catch (err) {
      console.error('Error generating questions:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Fetch content when tab changes
  useEffect(() => {
    if (activeTab === 'summary') {
      fetchSummary();
    } else if (activeTab === 'questions') {
      fetchQuestions();
    }
  }, [activeTab]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 font-medium ${
            activeTab === 'summary'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`flex-1 py-3 font-medium ${
            activeTab === 'questions'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('questions')}
        >
          Deep Questions
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {error && (
          <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {activeTab === 'summary' && (
          <SummaryTab 
            summary={summary}
            isLoading={isLoadingSummary}
            onRefresh={fetchSummary}
          />
        )}

        {activeTab === 'questions' && (
          <QuestionsTab
            questions={questions}
            isLoading={isLoadingQuestions}
            onRefresh={fetchQuestions}
          />
        )}
      </div>
    </div>
  );
};

export default SidePanel; 