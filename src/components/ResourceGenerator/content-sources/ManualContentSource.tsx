import React, { ChangeEvent } from 'react';
import { ContentSourceProps } from '../types';
import { createLogger } from '../utils';

const log = createLogger('ManualContentSource');

const ManualContentSource = ({ 
  onContentLoaded, 
  disabled = false 
}: ContentSourceProps) => {
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onContentLoaded(e.target.value);
  };

  return (
    <textarea
      rows={8}
      className="w-full p-4 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="What would you like to memorise?"
      onChange={handleTextChange}
      disabled={disabled}
    />
  );
};

export default ManualContentSource; 