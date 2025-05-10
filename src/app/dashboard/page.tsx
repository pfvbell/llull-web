// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConceptMap, Flashcard, Deck, Storyboard, MultipleChoiceQuestion } from '@/types/index';
import { createClient } from '@/utils/supabase/client';

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[Dashboard] ${message}`, data ? data : '');
};

// Define Tab type
type TabType = 'all' | 'concept-maps' | 'flashcards' | 'storyboards' | 'multiple-choice';

// Define sort options
type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'review-date';

type Memory = (ConceptMap | Flashcard | Storyboard | MultipleChoiceQuestion) & { 
  memoryType: 'concept-map' | 'flashcard' | 'storyboard' | 'multiple-choice' 
};

export default function MemoryBank() {
  const [conceptMaps, setConceptMaps] = useState<ConceptMap[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [multipleChoiceQuestions, setMultipleChoiceQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<{ id: string, type: 'concept-map' | 'flashcard' | 'storyboard' | 'multiple-choice' | 'deck' } | null>(null);
  const [reviewCount, setReviewCount] = useState({ maps: 0, flashcards: 0, multipleChoice: 0, storyboards: 0, total: 0 });
  const [reviewLoading, setReviewLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // New state variables for UI improvements
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const router = useRouter();
  const supabase = createClient();

  // Define SVG icon components
  const Icons = {
    ConceptMap: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    Flashcard: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    Storyboard: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    MultipleChoice: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    Search: () => (
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    Clear: () => (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    Edit: () => (
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    Review: () => (
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    Delete: () => (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    Clock: () => (
      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Add: () => (
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    All: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  };

  // Load data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        log('Fetching user data');
        
        // Get the current user first
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        if (!user) {
          log('No user found, redirecting to login');
          router.push('/login');
          return;
        }
        
        log(`Logged in user: ${user.id}`);
        setUserId(user.id);
        
        // Fetch decks for the current user
        const { data: deckData, error: deckError } = await supabase
          .from('decks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (deckError) throw deckError;
        
        log(`Found ${deckData?.length || 0} decks for user ${user.id}`);
        setDecks(deckData || []);
        
        // Set default selected deck if available
        if (deckData && deckData.length > 0) {
          setSelectedDeckId(deckData[0].id);
        }
        
        await loadConceptMaps(user.id);
        await loadFlashcards(user.id);
        await loadStoryboards(user.id);
        await loadMultipleChoiceQuestions(user.id);
        await checkReviewQueue();
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);

  const loadConceptMaps = async (userId: string) => {
    try {
      log('Loading concept maps for user', userId);
      
      const { data, error } = await supabase
        .from('concept_maps')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform the data to match our ConceptMap type
        const transformedMaps: ConceptMap[] = data.map(map => {
          const content = map.content || {};
          
          return {
            id: map.id,
            title: map.title,
            description: content.description || '',
            nodes: content.nodes || [],
            edges: content.edges || [],
            complexity: content.complexity || 3,
            versions: content.versions || [],
            createdAt: map.created_at,
            lastReviewedAt: map.last_reviewed_at,
            nextReviewAt: map.next_review_at,
            reviewCount: map.review_count || 0,
            deck_id: map.deck_id // Include deck_id
          };
        });
        
        log(`Loaded ${transformedMaps.length} concept maps for user ${userId}`);
        setConceptMaps(transformedMaps);
      }
    } catch (error) {
      console.error('Error loading concept maps:', error);
    }
  };
  
  const loadFlashcards = async (userId: string) => {
    try {
      log('Loading flashcards for user', userId);
      
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform the data to match our Flashcard type
        const transformedFlashcards: Flashcard[] = data.map(card => {
          const content = card.content || {};
          
          return {
            id: card.id,
            title: card.title,
            description: card.description || '',
            front: content.front || '',
            back: content.back || '',
            tags: content.tags || [],
            difficulty: content.difficulty || 1,
            createdAt: card.created_at,
            lastReviewedAt: card.last_reviewed_at,
            nextReviewAt: card.next_review_at,
            reviewCount: card.review_count || 0,
            deck_id: card.deck_id // Include deck_id
          };
        });
        
        log(`Loaded ${transformedFlashcards.length} flashcards for user ${userId}`);
        setFlashcards(transformedFlashcards);
      }
    } catch (error) {
      console.error('Error loading flashcards:', error);
    }
  };
  
  const loadStoryboards = async (userId: string) => {
    try {
      log('Loading storyboards for user', userId);
      
      const { data, error } = await supabase
        .from('storyboards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform the data to match our Storyboard type
        const transformedStoryboards: Storyboard[] = data.map(sb => {
          const content = sb.content || {};
          
          return {
            id: sb.id,
            title: sb.title,
            description: content.description || '',
            scenes: content.scenes || [],
            createdAt: sb.created_at,
            lastReviewedAt: sb.last_reviewed_at,
            nextReviewAt: sb.next_review_at,
            reviewCount: sb.review_count || 0,
            deck_id: sb.deck_id
          };
        });
        
        log(`Loaded ${transformedStoryboards.length} storyboards for user ${userId}`);
        setStoryboards(transformedStoryboards);
      }
    } catch (error) {
      console.error('Error loading storyboards:', error);
    }
  };
  
  const loadMultipleChoiceQuestions = async (userId: string) => {
    try {
      log('Loading multiple choice questions for user', userId);
      
      const { data, error } = await supabase
        .from('multiple_choice_questions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        log(`Loaded ${data.length} multiple choice questions for user ${userId}`);
        setMultipleChoiceQuestions(data);
      }
    } catch (error) {
      console.error('Error loading multiple choice questions:', error);
    }
  };
  
  // Filter resources by selected deck
  const filteredConceptMaps = selectedDeckId 
    ? conceptMaps.filter(map => map.deck_id === selectedDeckId)
    : conceptMaps;
    
  const filteredFlashcards = selectedDeckId
    ? flashcards.filter(card => card.deck_id === selectedDeckId)
    : flashcards;
  
  const filteredStoryboards = selectedDeckId 
    ? storyboards.filter(sb => sb.deck_id === selectedDeckId)
    : storyboards;
  
  // Create a new deck
  const handleCreateDeck = async () => {
    const title = prompt('Enter a name for your new deck:');
    if (!title) return;
    
    try {
      log(`Creating new deck: ${title}`);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        log('No user found, cannot create deck');
        return;
      }
      
      const { data, error } = await supabase
        .from('decks')
        .insert({
          title,
          user_id: user.id,
          created_at: new Date().toISOString(),
          review_count: 0
        })
        .select();
        
      if (error) throw error;
      
      if (data && data[0]) {
        log(`Deck created with ID: ${data[0].id}`);
        setDecks([data[0], ...decks]);
        setSelectedDeckId(data[0].id);
      }
    } catch (err) {
      console.error('Error creating deck:', err);
    }
  };
  
  // Delete a deck and its contents
  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this deck and all its contents? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting({ id: deckId, type: 'deck' });
      log(`Deleting deck: ${deckId}`);
      
      // Delete all resources in the deck
      const { error: conceptMapError } = await supabase
        .from('concept_maps')
        .delete()
        .eq('deck_id', deckId);
        
      if (conceptMapError) throw conceptMapError;
      
      const { error: flashcardError } = await supabase
        .from('flashcards')
        .delete()
        .eq('deck_id', deckId);
        
      if (flashcardError) throw flashcardError;
      
      // Delete the deck itself
      const { error: deckError } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);
        
      if (deckError) throw deckError;
      
      // Update state
      setDecks(decks.filter(deck => deck.id !== deckId));
      setConceptMaps(conceptMaps.filter(map => map.deck_id !== deckId));
      setFlashcards(flashcards.filter(card => card.deck_id !== deckId));
      
      // If the deleted deck was selected, select another one
      if (selectedDeckId === deckId) {
        setSelectedDeckId(decks.length > 1 ? decks.find(d => d.id !== deckId)?.id || null : null);
      }
      
      log('Deck deleted successfully');
      
      // Update the review count after deletion
      await checkReviewQueue();
    } catch (err) {
      console.error('Error deleting deck:', err);
      alert('Failed to delete deck. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const checkReviewQueue = async () => {
    try {
      setReviewLoading(true);
      log('Checking review queue');
      
      // Get the current user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return;
      }
      
      if (!user) {
        log('No user found');
        return;
      }
      
      const now = new Date().toISOString();
      const userId = user.id;
      
      // Check concept maps due for review - now with userId filter
      const { data: mapData, error: mapError } = await supabase
        .from('concept_maps')
        .select('id')
        .lte('next_review_at', now)
        .eq('user_id', userId);

      if (mapError) throw mapError;

      // Check flashcards due for review - now with userId filter
      const { data: flashcardData, error: flashcardError } = await supabase
        .from('flashcards')
        .select('id')
        .lte('next_review_at', now)
        .eq('user_id', userId);

      if (flashcardError) throw flashcardError;
      
      // Check multiple choice questions due for review
      const { data: mcqData, error: mcqError } = await supabase
        .from('multiple_choice_questions')
        .select('id')
        .lte('next_review_at', now)
        .eq('user_id', userId);
        
      if (mcqError) throw mcqError;
      
      // Check storyboards due for review
      const { data: storyboardData, error: storyboardError } = await supabase
        .from('storyboards')
        .select('id')
        .lte('next_review_at', now)
        .eq('user_id', userId);
        
      if (storyboardError) throw storyboardError;

      // Calculate review counts
      const mapCount = mapData?.length || 0;
      const flashcardCount = flashcardData?.length || 0;
      const mcqCount = mcqData?.length || 0;
      const storyboardCount = storyboardData?.length || 0;
      const totalCount = mapCount + flashcardCount + mcqCount + storyboardCount;
      
      log('Review queue:', { 
        maps: mapCount, 
        flashcards: flashcardCount, 
        multipleChoice: mcqCount,
        storyboards: storyboardCount,
        total: totalCount 
      });

      setReviewCount({
        maps: mapCount,
        flashcards: flashcardCount,
        multipleChoice: mcqCount,
        storyboards: storyboardCount,
        total: totalCount
      });
    } catch (error) {
      console.error('Error checking review queue:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteResource = async (id: string, type: 'concept-map' | 'flashcard' | 'storyboard' | 'multiple-choice') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      setIsDeleting({ id, type });
      log(`Deleting ${type} with id: ${id}`);
      
      let tableName = '';
      
      switch (type) {
        case 'concept-map':
          tableName = 'concept_maps';
          break;
        case 'flashcard':
          tableName = 'flashcards';
          break;
        case 'storyboard':
          tableName = 'storyboards';
          break;
        case 'multiple-choice':
          tableName = 'multiple_choice_questions';
          break;
        default:
          throw new Error(`Unknown resource type: ${type}`);
      }
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      log(`Successfully deleted ${type}`);
      
      // Update state to remove the deleted item
      if (type === 'concept-map') {
        setConceptMaps(prev => prev.filter(map => map.id !== id));
      } else if (type === 'flashcard') {
        setFlashcards(prev => prev.filter(card => card.id !== id));
      } else if (type === 'storyboard') {
        setStoryboards(prev => prev.filter(board => board.id !== id));
      } else if (type === 'multiple-choice') {
        setMultipleChoiceQuestions(prev => prev.filter(question => question.id !== id));
      }
      
      // Update the review count after deletion
      await checkReviewQueue();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Search function that filters resources by title and description
  const searchResources = <T extends ConceptMap | Flashcard | Storyboard | MultipleChoiceQuestion>(resources: T[], query: string): T[] => {
    if (!query.trim()) return resources;
    
    const lowerQuery = query.toLowerCase().trim();
    log(`Searching resources for: "${lowerQuery}"`);
    
    return resources.filter(resource => {
      const titleMatch = resource.title.toLowerCase().includes(lowerQuery);
      const descriptionMatch = resource.description?.toLowerCase().includes(lowerQuery) || false;
      return titleMatch || descriptionMatch;
    });
  };

  // Sort function based on selected sort option
  const sortResources = <T extends ConceptMap | Flashcard | Storyboard | MultipleChoiceQuestion>(resources: T[], option: SortOption): T[] => {
    log(`Sorting resources by: ${option}`);

    const sortedResources = [...resources];
    
    switch (option) {
      case 'newest':
        return sortedResources.sort((a, b) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
      case 'oldest':
        return sortedResources.sort((a, b) => 
          new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
        );
      case 'alphabetical':
        return sortedResources.sort((a, b) => 
          a.title.localeCompare(b.title)
        );
      case 'review-date':
        return sortedResources.sort((a, b) => {
          // Sort by next review date (null values at the end)
          if (!a.nextReviewAt && !b.nextReviewAt) return 0;
          if (!a.nextReviewAt) return 1;
          if (!b.nextReviewAt) return -1;
          return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime();
        });
      default:
        return sortedResources;
    }
  };

  // Apply all filters and sorting to concept maps
  const filteredSortedConceptMaps = useMemo(() => {
    // First filter by deck if selected
    let filtered = selectedDeckId 
      ? conceptMaps.filter(map => map.deck_id === selectedDeckId)
      : conceptMaps;
    
    // Then filter by search
    filtered = searchResources<ConceptMap>(filtered, searchQuery);
    
    // Finally sort
    return sortResources<ConceptMap>(filtered, sortOption);
  }, [conceptMaps, selectedDeckId, searchQuery, sortOption]);
  
  // Apply all filters and sorting to flashcards
  const filteredSortedFlashcards = useMemo(() => {
    // First filter by deck if selected
    let filtered = selectedDeckId 
      ? flashcards.filter(card => card.deck_id === selectedDeckId)
      : flashcards;
    
    // Then filter by search
    filtered = searchResources<Flashcard>(filtered, searchQuery);
    
    // Finally sort
    return sortResources<Flashcard>(filtered, sortOption);
  }, [flashcards, selectedDeckId, searchQuery, sortOption]);
  
  // Apply all filters and sorting to storyboards
  const filteredSortedStoryboards = useMemo(() => {
    // First filter by deck if selected
    let filtered = selectedDeckId 
      ? storyboards.filter(sb => sb.deck_id === selectedDeckId)
      : storyboards;
    
    // Then filter by search
    filtered = searchResources<Storyboard>(filtered, searchQuery);
    
    // Finally sort
    return sortResources<Storyboard>(filtered, sortOption);
  }, [storyboards, selectedDeckId, searchQuery, sortOption]);
  
  // Apply all filters and sorting to multiple choice questions
  const filteredSortedMultipleChoiceQuestions = useMemo(() => {
    // First filter by deck if selected
    let filtered = selectedDeckId 
      ? multipleChoiceQuestions.filter(question => question.deck_id === selectedDeckId)
      : multipleChoiceQuestions;
    
    // Then filter by search
    filtered = searchResources<MultipleChoiceQuestion>(filtered, searchQuery);
    
    // Finally sort
    return sortResources<MultipleChoiceQuestion>(filtered, sortOption);
  }, [multipleChoiceQuestions, selectedDeckId, searchQuery, sortOption]);
  
  // Combine and sort all resources (for the 'all' tab)
  const combinedResources = useMemo(() => {
    // Prepare concept maps with their type
    const conceptMapResources = filteredSortedConceptMaps.map(map => ({
      ...map,
      id: map.id || crypto.randomUUID(), // Ensure id is always a string
      createdAt: map.createdAt || new Date().toISOString(), // Ensure createdAt is always a string
      memoryType: 'concept-map' as const
    }));
    
    // Prepare flashcards with their type
    const flashcardResources = filteredSortedFlashcards.map(card => ({
      ...card,
      id: card.id || crypto.randomUUID(), // Ensure id is always a string
      createdAt: card.createdAt || new Date().toISOString(), // Ensure createdAt is always a string
      memoryType: 'flashcard' as const
    }));
    
    // Prepare storyboards with their type
    const storyboardResources = filteredSortedStoryboards.map(sb => ({
      ...sb,
      id: sb.id || crypto.randomUUID(), // Ensure id is always a string
      createdAt: sb.createdAt || new Date().toISOString(), // Ensure createdAt is always a string
      memoryType: 'storyboard' as const
    }));
    
    // Prepare multiple choice questions with their type
    const multipleChoiceQuestionResources = filteredSortedMultipleChoiceQuestions.map(question => ({
      ...question,
      id: question.id || crypto.randomUUID(), // Ensure id is always a string
      createdAt: question.createdAt || new Date().toISOString(), // Ensure createdAt is always a string
      memoryType: 'multiple-choice' as const
    }));
    
    // Combine all types
    const combined = [...conceptMapResources, ...flashcardResources, ...storyboardResources, ...multipleChoiceQuestionResources];
    
    // Sort the combined array
    switch (sortOption) {
      case 'newest':
        return combined.sort((a, b) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
      case 'oldest':
        return combined.sort((a, b) => 
          new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
        );
      case 'alphabetical':
        return combined.sort((a, b) => 
          a.title.localeCompare(b.title)
        );
      case 'review-date':
        return combined.sort((a, b) => {
          if (!a.nextReviewAt && !b.nextReviewAt) return 0;
          if (!a.nextReviewAt) return 1;
          if (!b.nextReviewAt) return -1;
          return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime();
        });
      default:
        return combined;
    }
  }, [filteredSortedConceptMaps, filteredSortedFlashcards, filteredSortedStoryboards, filteredSortedMultipleChoiceQuestions, sortOption]);

  // Component for rendering a resource card
  const ResourceCard = ({ id, title, type, createdAt, onDelete, isDeleting }: {
    id: string;
    title: string;
    type: 'concept-map' | 'flashcard' | 'storyboard' | 'multiple-choice';
    createdAt: string;
    onDelete: () => void;
    isDeleting: boolean;
  }) => {
    // Function to get the correct edit link based on resource type
    const getEditLink = () => {
      switch(type) {
        case 'concept-map':
          return `/concept-map/${id}/edit`;
        case 'flashcard':
          return `/flashcard/${id}`;
        case 'storyboard':
          return `/storyboard/${id}`;
        case 'multiple-choice':
          return `/multiple-choice/${id}`;
        default:
          return '#';
      }
    };

    // Function to get the correct review link based on resource type
    const getReviewLink = () => {
      switch(type) {
        case 'concept-map':
          return `/concept-map/${id}/review`;
        case 'flashcard':
          return `/flashcard/${id}/review`;
        case 'storyboard':
          return `/storyboard/${id}/review`;
        case 'multiple-choice':
          return `/multiple-choice/${id}/review`;
        default:
          return '#';
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transition-all duration-200 hover:shadow-lg">
        <div className="p-4 relative">
          {/* Resource Type Badge */}
          <div className={`absolute top-0 right-0 w-2 h-10 ${type === 'concept-map' ? 'bg-purple-500' : type === 'flashcard' ? 'bg-green-500' : type === 'storyboard' ? 'bg-yellow-500' : 'bg-pink-500'}`}></div>
          
          {/* Delete Button */}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="absolute top-2 right-4 p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
            title="Delete"
          >
            {isDeleting ? (
              <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Icons.Delete />
            )}
          </button>
          
          {/* Resource Type Icon */}
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 ${
            type === 'concept-map' ? 'bg-purple-100 text-purple-600' : type === 'flashcard' ? 'bg-green-100 text-green-600' : type === 'storyboard' ? 'bg-yellow-100 text-yellow-600' : 'bg-pink-100 text-pink-600'
          }`}>
            {type === 'concept-map' ? <Icons.ConceptMap /> : type === 'flashcard' ? <Icons.Flashcard /> : type === 'storyboard' ? <Icons.Storyboard /> : <Icons.MultipleChoice />}
          </div>
          
          {/* Title and Creation Date */}
          <h3 className="font-bold text-lg mb-1 pr-6 truncate">{title}</h3>
          <p className="text-sm text-gray-500 mb-4 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(createdAt).toLocaleDateString()}
          </p>
          
          {/* Action Buttons - now with two buttons for Edit and Review */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {/* Edit Button */}
            <Link
              href={getEditLink()}
              className="flex items-center justify-center py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Icons.Edit />
              Edit
            </Link>
            
            {/* Review Button */}
            <Link
              href={getReviewLink()}
              className="flex items-center justify-center py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Icons.Review />
              Review
            </Link>
          </div>
        </div>
      </div>
    );
  };
  
  // Component for rendering a deck card
  const DeckCard = ({ deck, isSelected, onSelect, onDelete, isDeleting }: {
    deck: Deck;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    isDeleting: boolean;
  }) => {
    return (
      <div 
        onClick={onSelect}
        className={`
          relative cursor-pointer p-4 rounded-lg transition-all duration-200
          ${isSelected 
            ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
            : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md'
          }
        `}
      >
        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
          title="Delete deck"
        >
          {isDeleting ? (
            <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Icons.Delete />
          )}
        </button>
        
        <div className="text-center">
          <div className={`
            mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full mb-3
            ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
          `}>
            <Icons.All />
          </div>
          <h3 className="font-medium text-base mb-1 truncate pr-6">{deck.title}</h3>
          <p className="text-xs text-gray-500">
            {deck.review_count} reviews
          </p>
        </div>
      </div>
    );
  };
  
  // Component for showing skeleton loading state
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 p-4">
      <div className="animate-pulse">
        <div className="h-10 w-10 bg-gray-200 rounded-full mb-3"></div>
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
  
  // Empty state illustrations
  const EmptyState = ({ type, onClick }: { 
    type: 'deck' | 'concept-map' | 'flashcard' | 'storyboard' | 'multiple-choice' | 'search' | 'all',
    onClick?: () => void 
  }) => {
    let title = '';
    let message = '';
    let buttonText = '';
    
    switch (type) {
      case 'deck':
        title = 'No Decks Yet';
        message = 'Create your first deck to organize your learning resources';
        buttonText = 'Create Your First Deck';
        break;
      case 'concept-map':
        title = 'No Concept Maps Yet';
        message = selectedDeckId 
          ? 'This deck has no concept maps yet' 
          : 'Create your first concept map to visualize your knowledge';
        buttonText = 'Create Your First Concept Map';
        break;
      case 'flashcard':
        title = 'No Flashcards Yet';
        message = selectedDeckId 
          ? 'This deck has no flashcards yet' 
          : 'Create your first flashcard to test your knowledge';
        buttonText = 'Create Your First Flashcard';
        break;
      case 'storyboard':
        title = 'No Storyboards Yet';
        message = selectedDeckId 
          ? 'This deck has no storyboards yet' 
          : 'Create your first storyboard to visualize your knowledge in steps';
        buttonText = 'Create Your First Storyboard';
        break;
      case 'all':
        title = 'No Memories Yet';
        message = selectedDeckId 
          ? 'This deck is empty' 
          : 'Create your first memory to start learning';
        buttonText = 'Create Your First Memory';
        break;
      case 'search':
        title = 'No Results Found';
        message = 'Try adjusting your search or filters';
        buttonText = '';
        break;
    }
    
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
        <div className="max-w-md mx-auto">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-gray-500 mb-4">{message}</p>
          {buttonText && onClick && (
            <button
              onClick={onClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
            >
              <Icons.Add />
              {buttonText}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Memory Bank</h1>
      
      {/* Header with review notification */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-wrap justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Your Memory Resources</h2>
          <p className="text-gray-600">
            {loading 
              ? 'Loading your resources...' 
              : `You have ${conceptMaps.length} concept maps, ${flashcards.length} flashcards, ${storyboards.length} storyboards, and ${multipleChoiceQuestions.length} questions`}
          </p>
        </div>
        
        <Link 
          href="/review"
          className={`
            mt-4 sm:mt-0 px-4 py-2 rounded-md flex items-center space-x-2 transition-all
            ${reviewCount.total > 0 
              ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }
          `}
        >
          <div className="flex items-center">
            <Icons.Clock />
            <div>
              <span className="font-medium">Review Now</span>
              {reviewCount.total > 0 ? (
                <span className="block text-xs opacity-90">
                  {reviewCount.total} item{reviewCount.total > 1 ? 's' : ''} due for review
                  {reviewCount.total > 1 && (
                    <span className="block">
                      {reviewCount.maps > 0 && `${reviewCount.maps} map${reviewCount.maps > 1 ? 's' : ''}`}
                      {reviewCount.flashcards > 0 && `${reviewCount.maps > 0 ? ', ' : ''}${reviewCount.flashcards} card${reviewCount.flashcards > 1 ? 's' : ''}`}
                      {reviewCount.multipleChoice > 0 && `${(reviewCount.maps > 0 || reviewCount.flashcards > 0) ? ', ' : ''}${reviewCount.multipleChoice} question${reviewCount.multipleChoice > 1 ? 's' : ''}`}
                      {reviewCount.storyboards > 0 && `${(reviewCount.maps > 0 || reviewCount.flashcards > 0 || reviewCount.multipleChoice > 0) ? ', ' : ''}${reviewCount.storyboards} storyboard${reviewCount.storyboards > 1 ? 's' : ''}`}
                    </span>
                  )}
                </span>
              ) : (
                <span className="block text-xs opacity-90">
                  Nothing due yet! Click to force review.
                </span>
              )}
            </div>
          </div>
          {reviewLoading ? (
            <span className="inline-block w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin ml-2"></span>
          ) : reviewCount.total > 0 ? (
            <span className="bg-white text-green-600 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold">
              {reviewCount.total}
            </span>
          ) : null}
        </Link>
      </div>
      
      {/* Deck Selection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Decks</h2>
          <button
            onClick={handleCreateDeck}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
          >
            <Icons.Add />
            New Deck
          </button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        ) : decks.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
              {/* All Resources button */}
              <div 
                onClick={() => setSelectedDeckId(null)}
                className={`
                  relative cursor-pointer p-4 rounded-lg transition-all duration-200
                  ${!selectedDeckId 
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
                    : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }
                `}
              >
                <div className="text-center">
                  <div className={`
                    mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full mb-3
                    ${!selectedDeckId ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    <Icons.All />
                  </div>
                  <h3 className="font-medium text-base mb-1">All Resources</h3>
                  <p className="text-xs text-gray-500">
                    {conceptMaps.length + flashcards.length + storyboards.length + multipleChoiceQuestions.length} items
                  </p>
                </div>
              </div>
              
              {/* Deck cards */}
              {decks.map(deck => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  isSelected={selectedDeckId === deck.id}
                  onSelect={() => setSelectedDeckId(deck.id)}
                  onDelete={() => handleDeleteDeck(deck.id)}
                  isDeleting={isDeleting?.id === deck.id && isDeleting?.type === 'deck'}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState type="deck" onClick={handleCreateDeck} />
        )}
      </div>
      
      {/* Search and Sort Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icons.Search />
          </div>
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <Icons.Clear />
            </button>
          )}
        </div>
        
        {/* Sort Options */}
        <div className="flex items-center">
          <label htmlFor="sort-select" className="text-sm text-gray-600 mr-2">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="review-date">Review Date</option>
          </select>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('all')}
            className={`mr-6 py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icons.All /><span className="ml-2">All</span>
          </button>
          <button
            onClick={() => setActiveTab('concept-maps')}
            className={`mr-6 py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'concept-maps'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icons.ConceptMap /><span className="ml-2">Concept Maps</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`mr-6 py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'flashcards'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icons.Flashcard /><span className="ml-2">Flashcards</span>
          </button>
          <button
            onClick={() => setActiveTab('storyboards')}
            className={`mr-6 py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'storyboards'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icons.Storyboard /><span className="ml-2">Storyboards</span>
          </button>
          <button
            onClick={() => setActiveTab('multiple-choice')}
            className={`mr-6 py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'multiple-choice'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icons.MultipleChoice /><span className="ml-2">Multiple Choice</span>
          </button>
        </nav>
      </div>
      
      {/* Display content based on active tab */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          // Show skeleton loading UI
          Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : (
          <>
            {activeTab === 'all' && (
              <>
                {combinedResources.length > 0 ? (
                  combinedResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      id={resource.id}
                      title={resource.title}
                      type={resource.memoryType}
                      createdAt={resource.createdAt}
                      onDelete={() => handleDeleteResource(resource.id, resource.memoryType)}
                      isDeleting={isDeleting?.id === resource.id && isDeleting?.type === resource.memoryType}
                    />
                  ))
                ) : (
                  searchQuery ? (
                    <div className="col-span-full">
                      <EmptyState type="search" />
                    </div>
                  ) : (
                    <div className="col-span-full">
                      <EmptyState type="all" onClick={() => router.push('/')} />
                    </div>
                  )
                )}
              </>
            )}
            
            {activeTab === 'concept-maps' && (
              <>
                {filteredSortedConceptMaps.length > 0 ? (
                  filteredSortedConceptMaps.map((map) => (
                    <ResourceCard
                      key={map.id}
                      id={map.id || ''}
                      title={map.title}
                      type="concept-map"
                      createdAt={map.createdAt || new Date().toISOString()}
                      onDelete={() => handleDeleteResource(map.id || '', 'concept-map')}
                      isDeleting={isDeleting?.id === map.id && isDeleting?.type === 'concept-map'}
                    />
                  ))
                ) : (
                  searchQuery ? (
                    <div className="col-span-full">
                      <EmptyState type="search" />
                    </div>
                  ) : (
                    <div className="col-span-full">
                      <EmptyState 
                        type="concept-map" 
                        onClick={() => router.push('/concept-map/create')} 
                      />
                    </div>
                  )
                )}
              </>
            )}
            
            {activeTab === 'flashcards' && (
              <>
                {filteredSortedFlashcards.length > 0 ? (
                  filteredSortedFlashcards.map((card) => (
                    <ResourceCard
                      key={card.id}
                      id={card.id}
                      title={card.title}
                      type="flashcard"
                      createdAt={card.createdAt}
                      onDelete={() => handleDeleteResource(card.id, 'flashcard')}
                      isDeleting={isDeleting?.id === card.id && isDeleting?.type === 'flashcard'}
                    />
                  ))
                ) : (
                  searchQuery ? (
                    <div className="col-span-full">
                      <EmptyState type="search" />
                    </div>
                  ) : (
                    <div className="col-span-full">
                      <EmptyState 
                        type="flashcard" 
                        onClick={() => router.push('/flashcard/create')} 
                      />
                    </div>
                  )
                )}
              </>
            )}
            
            {activeTab === 'storyboards' && (
              <>
                {filteredSortedStoryboards.length > 0 ? (
                  filteredSortedStoryboards.map((storyboard) => (
                    <ResourceCard
                      key={storyboard.id}
                      id={storyboard.id}
                      title={storyboard.title}
                      type="storyboard"
                      createdAt={storyboard.createdAt}
                      onDelete={() => handleDeleteResource(storyboard.id, 'storyboard')}
                      isDeleting={isDeleting?.id === storyboard.id && isDeleting?.type === 'storyboard'}
                    />
                  ))
                ) : (
                  searchQuery ? (
                    <div className="col-span-full">
                      <EmptyState type="search" />
                    </div>
                  ) : (
                    <div className="col-span-full">
                      <EmptyState 
                        type="storyboard" 
                        onClick={() => router.push('/storyboard/create')} 
                      />
                    </div>
                  )
                )}
              </>
            )}
            
            {activeTab === 'multiple-choice' && (
              <>
                {filteredSortedMultipleChoiceQuestions.length > 0 ? (
                  filteredSortedMultipleChoiceQuestions.map((question) => (
                    <ResourceCard
                      key={question.id}
                      id={question.id}
                      title={question.title}
                      type="multiple-choice"
                      createdAt={question.createdAt}
                      onDelete={() => handleDeleteResource(question.id, 'multiple-choice')}
                      isDeleting={isDeleting?.id === question.id && isDeleting?.type === 'multiple-choice'}
                    />
                  ))
                ) : (
                  searchQuery ? (
                    <div className="col-span-full">
                      <EmptyState type="search" />
                    </div>
                  ) : (
                    <div className="col-span-full">
                      <EmptyState 
                        type="multiple-choice" 
                        onClick={() => router.push('/multiple-choice/create')} 
                      />
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}