import React, { useState } from 'react';
import { DeckSelectorProps } from './types';
import { createLogger } from './utils';

const log = createLogger('DeckSelector');

const DeckSelector = ({ 
  decks, 
  selectedDeckId, 
  onChange, 
  onCreateDeck, 
  disabled = false 
}: DeckSelectorProps) => {
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  
  const handleDeckChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setIsCreatingDeck(true);
      log('User selected to create a new deck');
    } else {
      onChange(value);
      log(`Selected deck with ID: ${value}`);
    }
  };
  
  const handleCreateDeck = async () => {
    if (!newDeckTitle.trim()) return;
    
    try {
      log(`Creating new deck: "${newDeckTitle}"`);
      const newDeckId = await onCreateDeck(newDeckTitle);
      
      log(`Deck created with ID: ${newDeckId}`);
      setNewDeckTitle('');
      setIsCreatingDeck(false);
    } catch (err) {
      console.error('Error creating deck:', err);
    }
  };

  return (
    <div>
      <label htmlFor="deck" className="block text-sm font-medium text-gray-700 mb-1">
        Deck
      </label>
      {isCreatingDeck ? (
        <div className="flex space-x-2">
          <input
            type="text"
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
            placeholder="Enter deck name"
            className="flex-1 p-2 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={handleCreateDeck}
            disabled={!newDeckTitle.trim() || disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingDeck(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            disabled={disabled}
          >
            Cancel
          </button>
        </div>
      ) : (
        <select
          id="deck"
          value={selectedDeckId}
          onChange={handleDeckChange}
          className="w-full p-2 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        >
          {decks.length === 0 && (
            <option value="" disabled>No decks available</option>
          )}
          {decks.map(deck => (
            <option key={deck.id} value={deck.id}>{deck.title}</option>
          ))}
          <option value="new">+ Create New Deck</option>
        </select>
      )}
    </div>
  );
};

export default DeckSelector; 