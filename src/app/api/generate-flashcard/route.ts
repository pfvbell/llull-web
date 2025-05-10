import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface RequestBody {
  text: string;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[API:generate-flashcard] ${message}`, data ? data : '');
};

const getFlashcardSystemPrompt = () => `
You are an expert educator and flashcard creator. Create high-quality flashcards based on the provided text.

Guidelines:
1. Analyze the content and create a set of 1-10 flashcards that would enable a student to understand andmemorize the content.
2. Make the front side a clear, specific question - not vague or general.
3. Make the back side a precise, focused answer that directly addresses only the question asked.


Return ONLY valid JSON in this format:
{
  "flashcards": [
    {
      "title": "Concise title for the flashcard - must be unique",
      "description": "Brief description of what this specific flashcard covers",
      "front": "Clear question or prompt on the front side",
      "back": "Precise answer or explanation on the back side. 1-2 sentences max.",
      "tags": ["tag1", "tag2", "tag3"],
      "difficulty": 2  // 1=easy, 2=medium, 3=hard
    },
    // Additional flashcards as needed, each covering different material
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json() as RequestBody;
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }
    
    log(`Generating flashcards for text: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    const sanitizedText = text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\u00A0/g, ' ')
      .trim();
    
    console.log('Sending request to Anthropic API...');
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      system: getFlashcardSystemPrompt(),
      messages: [
        { 
          role: "user", 
          content: `Create a set of flashcards to help memorize this content: ${sanitizedText}`
        }
      ],
    });

    const contentBlock = response.content?.[0];
    if (!contentBlock || contentBlock.type !== 'text' || !contentBlock.text) {
      throw new Error('Empty or invalid response from Anthropic API');
    }

    log('Raw response from Anthropic:', contentBlock.text);

    // Improved JSON extraction
    let cleanText = contentBlock.text.trim();
    
    // Look for JSON content between code blocks
    const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      cleanText = jsonMatch[1].trim();
    } else {
      // If no code blocks, try to find JSON directly
      // Remove any text before the first { and after the last }
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
    }
    
    // Remove any invisible characters
    cleanText = cleanText.replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    log('Cleaned JSON text (first 200 chars):', cleanText.substring(0, 200) + '...');

    try {
      const data = JSON.parse(cleanText);
      log('Successfully parsed JSON');
      
      // Validate the structure
      if (!data.flashcards || !Array.isArray(data.flashcards)) {
        throw new Error('Invalid flashcard structure: missing flashcards array');
      }
      
      log(`Parsed ${data.flashcards.length} flashcards`);
      
      // Check for uniqueness and log information about distinctiveness
      const titles = data.flashcards.map((card: any) => card.title);
      const fronts = data.flashcards.map((card: any) => card.front);
      const backs = data.flashcards.map((card: any) => card.back);
      
      const uniqueTitles = new Set(titles);
      const uniqueFronts = new Set(fronts);
      const uniqueBacks = new Set(backs);
      
      log('Flashcard uniqueness check:', {
        totalCards: data.flashcards.length,
        uniqueTitles: uniqueTitles.size,
        uniqueFronts: uniqueFronts.size,
        uniqueBacks: uniqueBacks.size,
        allUnique: (
          uniqueTitles.size === data.flashcards.length && 
          uniqueFronts.size === data.flashcards.length && 
          uniqueBacks.size === data.flashcards.length
        )
      });
      
      // Perform more advanced duplicate detection
      // If we have duplicate fronts or backs, filter to keep only unique cards
      if (uniqueFronts.size < data.flashcards.length || 
          uniqueBacks.size < data.flashcards.length || 
          uniqueTitles.size < data.flashcards.length) {
        
        log('Detected potential duplicate flashcards, performing advanced filtering');
        
        // Advanced duplicate detection by comparing content similarity
        // Use a set to track seen content and remove duplicates
        const seenContent = new Set();
        const seenQuestionTypes = new Set();
        
        // First pass: Remove exact duplicates
        let uniqueFlashcards = data.flashcards.filter((card: any) => {
          // Create a content signature using front+back
          const contentKey = `${card.front}:${card.back}`;
          
          // Check if we've seen this exact content before
          if (seenContent.has(contentKey)) {
            log('Found exact duplicate card', { front: card.front.substring(0, 30) });
            return false;
          }
          
          // Track this content
          seenContent.add(contentKey);
          return true;
        });
        
        log(`First-pass filtering: from ${data.flashcards.length} to ${uniqueFlashcards.length} cards`);
        
        // Second pass: Check for semantic duplicates (cards asking essentially the same question)
        // Extract the main topic of each question
        uniqueFlashcards = uniqueFlashcards.filter((card: any, index: number) => {
          // Extract question type (who, what, when, where, why, how)
          const questionMatch = card.front.match(/^(Who|What|When|Where|Why|How)/i);
          const questionType = questionMatch ? questionMatch[0].toLowerCase() : 'other';
          
          // Extract main topic/subject of the question
          // This is a simple heuristic - extract nouns and key terms
          const frontWords = card.front.toLowerCase().split(/\s+/);
          const keyTerms = frontWords.filter((word: string) => 
            word.length > 4 && 
            !['what', 'when', 'where', 'which', 'about', 'would', 'could', 'should'].includes(word)
          ).sort().join('|');
          
          // Create a question signature that combines type and key terms
          const questionSignature = `${questionType}:${keyTerms}`;
          
          // If this is too similar to a previous question, filter it out
          if (seenQuestionTypes.has(questionSignature)) {
            log('Found semantic duplicate', { 
              signature: questionSignature,
              front: card.front.substring(0, 30) 
            });
            return false;
          }
          
          seenQuestionTypes.add(questionSignature);
          return true;
        });
        
        log(`Second-pass filtering: from ${seenContent.size} to ${uniqueFlashcards.length} cards after semantic deduplication`);
        
        // If we filtered out too many and have less than 2 flashcards, restore some
        if (uniqueFlashcards.length < 2 && data.flashcards.length > 1) {
          log('Too many duplicates detected, restoring some cards to ensure minimum count');
          uniqueFlashcards = data.flashcards.slice(0, Math.min(data.flashcards.length, 3));
        }
        
        log(`Filtered from ${data.flashcards.length} to ${uniqueFlashcards.length} unique flashcards`);
        data.flashcards = uniqueFlashcards;
      }
      
      // Add timestamps and IDs to each flashcard
      const now = new Date().toISOString();
      data.flashcards = data.flashcards.map((card: any, index: number) => ({
        ...card,
        id: `temp-${index}-${Date.now()}`, // Temporary ID that will be replaced when saved
        createdAt: now,
        reviewCount: 0
      }));
      
      return NextResponse.json(data);
    } catch (parseError: unknown) {
      console.error('JSON parse error:', parseError);
      console.error('Failed JSON content:', cleanText);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown JSON parsing error';
      throw new Error(`Failed to parse JSON response: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error('Error generating flashcards:', error);
    return NextResponse.json(
      { error: `Failed to generate flashcards: ${error.message}` },
      { status: 500 }
    );
  }
} 