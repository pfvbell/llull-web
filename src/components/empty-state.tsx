import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  message: string;
  buttonText?: string;
  buttonHref?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

/**
 * A reusable EmptyState component to display when there is no data to show
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  buttonText,
  buttonHref,
  onClick,
  icon,
}) => {
  console.log('Rendering EmptyState component with title:', title);
  
  const DefaultIcon = () => (
    <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );

  const renderButton = () => {
    if (!buttonText) return null;
    
    if (buttonHref) {
      return (
        <Link
          href={buttonHref}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {buttonText}
        </Link>
      );
    }
    
    if (onClick) {
      return (
        <button
          onClick={onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {buttonText}
        </button>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
      <div className="max-w-md mx-auto">
        {icon || <DefaultIcon />}
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-gray-500 mb-4">{message}</p>
        {renderButton()}
      </div>
    </div>
  );
};

export default EmptyState; 