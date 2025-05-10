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
  console.log(`[API:generate-multiple-choice] ${message}`, data ? data : '');
};

const getMultipleChoiceSystemPrompt = () => `
You are an expert educator and question creator. Create high-quality multiple choice questions based on the provided text.

Guidelines:
1. Analyze the content and create a set of 1-15 multiple choice questions that would test a student's understanding of the material.
2. Each question should have 3-5 options.
3. Make questions clear and concise.
4. Make all options plausible but only one should be correct.
5. Keep both questions and options short (1-2 sentences max).
6. Include a brief explanation for why the correct answer is right.
7. Ensure questions cover different aspects of the content.

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "title": "Concise title for the question - must be unique",
      "description": "Brief description of what this specific question tests",
      "question": "Clear, concise question text",
      "options": ["Option A", "Option B", "Option C"],
      "correctOptionIndex": 0,  // Index of correct option (0, 1, or 2)
      "explanation": "Brief explanation of why the correct answer is right",
      "tags": ["tag1", "tag2"],
      "difficulty": 2  // 1=easy, 2=medium, 3=hard
    },
    // Additional questions as needed
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
    
    log(`Generating multiple choice questions for text: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    const sanitizedText = text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\u00A0/g, ' ')
      .trim();
    
    console.log('Sending request to Anthropic API...');
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      system: getMultipleChoiceSystemPrompt(),
      messages: [
        { 
          role: "user", 
          content: `Create multiple choice questions to test understanding of this content: ${sanitizedText}`
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
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid question structure: missing questions array');
      }
      
      log(`Parsed ${data.questions.length} questions`);
      
      // Validate each question
      data.questions.forEach((question: any, index: number) => {
        if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
          question.options = ["Option A", "Option B", "Option C"];
          log(`Question ${index} missing valid options, added defaults`);
        }
        
        // Ensure correctOptionIndex is valid
        if (question.correctOptionIndex === undefined || 
            question.correctOptionIndex < 0 || 
            question.correctOptionIndex >= question.options.length) {
          question.correctOptionIndex = 0;
          log(`Fixed invalid correctOptionIndex for question ${index}`);
        }
      });
      
      // Check for uniqueness
      const titles = data.questions.map((q: any) => q.title);
      const uniqueTitles = new Set(titles);
      
      log('Question uniqueness check:', {
        totalQuestions: data.questions.length,
        uniqueTitles: uniqueTitles.size,
        allUnique: uniqueTitles.size === data.questions.length
      });
      
      // If we have duplicate titles, make them unique
      if (uniqueTitles.size < data.questions.length) {
        data.questions.forEach((question: any, index: number) => {
          // Add index to title if it's a duplicate
          const count = titles.filter((t: string) => t === question.title).length;
          if (count > 1) {
            question.title = `${question.title} (${index + 1})`;
          }
        });
        log('Made question titles unique by adding indices');
      }
      
      return NextResponse.json(data);
    } catch (parseError: unknown) {
      console.error('JSON parse error:', parseError);
      console.error('Failed JSON content:', cleanText);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown JSON parsing error';
      throw new Error(`Failed to parse JSON response: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error('Error generating multiple choice questions:', error);
    return NextResponse.json(
      { error: `Failed to generate multiple choice questions: ${error.message}` },
      { status: 500 }
    );
  }
} 