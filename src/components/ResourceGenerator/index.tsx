import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { ContentSourceType } from '@/types/content-loaders';
import { Deck } from '@/types/index';
import { ResourceGeneratorProps, ResourceType } from './types';
import { createLogger } from './utils';
import ResourceTypeSelector from './ResourceTypeSelector';
import DeckSelector from './DeckSelector';
import ContentSources from './content-sources';
import Generators from './generators';

const log = createLogger('Main');

const ResourceGenerator = ({
  onGenerateConceptMap,
  onGenerateFlashcard,
  onGenerateMultipleChoice
}: ResourceGeneratorProps) => {
  // Resource type state
  const [resourceType, setResourceType] = useState<ResourceType>('concept-map');
  
  // Content state
  const [text, setText] = useState('');
  const [contentSource, setContentSource] = useState<ContentSourceType>('manual');
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Deck state
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  
  // Fetch user's decks
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        log('Fetching user decks');
        const { data, error } = await supabase
          .from('decks')
          .select('id, title, description, created_at, review_count')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          log(`Found ${data.length} decks`);
          // Ensure the data conforms to the Deck type
          const typedDecks: Deck[] = data.map(deck => ({
            id: deck.id,
            title: deck.title,
            description: deck.description,
            created_at: deck.created_at,
            review_count: deck.review_count
          }));
          setDecks(typedDecks);
          setSelectedDeckId(data[0].id); // Select first deck by default
        } else {
          log('No decks found');
        }
      } catch (err) {
        console.error('Error fetching decks:', err);
      }
    };
    
    fetchDecks();
  }, []);

  // Handle resource type change
  const handleTypeChange = (newType: ResourceType) => {
    setResourceType(newType);
    log(`Resource type changed to: ${newType}`);
  };
  
  // Handle content source change
  const handleContentSourceChange = (source: ContentSourceType) => {
    setContentSource(source);
    log(`Content source changed to: ${source}`);
    
    // Reset text when changing content source (except manual, to keep user text)
    if (source !== 'manual') {
      setText('');
    }
  };
  
  // Handle content loaded from source
  const handleContentLoaded = (content: string) => {
    setText(content);
    log(`Content loaded, length: ${content.length} characters`);
  };
  
  // Handle deck selection
  const handleDeckChange = (deckId: string) => {
    setSelectedDeckId(deckId);
    log(`Selected deck with ID: ${deckId}`);
  };
  
  // Handle creating a new deck
  const handleCreateDeck = async (title: string) => {
    try {
      log(`Creating new deck: "${title}"`);
      const { data: { user } } = await supabase.auth.getUser();
      
      const newDeck = {
        title,
        user_id: user?.id,
        created_at: new Date().toISOString(),
        review_count: 0
      };
      
      const { data, error } = await supabase
        .from('decks')
        .insert(newDeck)
        .select();
        
      if (error) throw error;
      
      if (data && data[0]) {
        const createdDeck: Deck = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          created_at: data[0].created_at,
          review_count: data[0].review_count
        };
        
        log(`Deck created with ID: ${createdDeck.id}`);
        setDecks([createdDeck, ...decks]);
        setSelectedDeckId(createdDeck.id);
        return createdDeck.id;
      }
      
      throw new Error('Failed to create deck');
    } catch (err) {
      console.error('Error creating deck:', err);
      throw err;
    }
  };
  
  // Handle starting/stopping generation
  const handleGenerate = (generating: boolean) => {
    setIsGenerating(generating);
  };
  
  // Handle generation errors
  const handleError = (errorMessage: string | null) => {
    setError(errorMessage);
  };
  
  // Calculate word count for the content
  const wordCount = useMemo(() => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [text]);

  // Form submission validation
  const isSubmitDisabled = useMemo(() => {
    return isGenerating || !text.trim() || !selectedDeckId;
  }, [isGenerating, text, selectedDeckId]);

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h2 className="text-l font-bold mb-4">Create New Memory</h2>
      
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* Resource Type Selector */}
        <ResourceTypeSelector 
          resourceType={resourceType} 
          onChange={handleTypeChange}
          disabled={isGenerating}
        />
        
        {/* Deck Selector */}
        <DeckSelector
          decks={decks}
          selectedDeckId={selectedDeckId}
          onChange={handleDeckChange}
          onCreateDeck={handleCreateDeck}
          disabled={isGenerating}
        />
        
        {/* Content Sources */}
        <ContentSources
          contentSource={contentSource}
          onContentSourceChange={handleContentSourceChange}
          onContentLoaded={handleContentLoaded}
          disabled={isGenerating}
        />
        
        {/* Text Content Display with Word Count */}
        {contentSource !== 'manual' && text && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <span className="text-xs text-gray-500">{wordCount} words</span>
            </div>
            <textarea
              id="content"
              rows={8}
              className="w-full p-4 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isGenerating}
              readOnly
            />
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* Resource Generator */}
        <Generators
          resourceType={resourceType}
          text={text}
          deckId={selectedDeckId}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
          onError={handleError}
          onGenerateConceptMap={onGenerateConceptMap}
          onGenerateFlashcard={onGenerateFlashcard}
          onGenerateMultipleChoice={onGenerateMultipleChoice}
        />
      </form>
    </div>
  );
};

export default ResourceGenerator; 