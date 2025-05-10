import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface RequestBody {
  text: string;
  contentType: 'summary' | 'questions';
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Add logging for debugging
const log = (message: string, data?: any) => {
  console.log(`[API:generate-reader-content] ${message}`, data ? data : '');
};

// Define prompts for different content types
const getSystemPrompt = (contentType: 'summary' | 'questions') => {
  switch (contentType) {
    case 'summary':
      return `
You are an expert at summarizing content. Create a comprehensive yet concise summary of the provided text.

Guidelines:
1. Identify and include the main ideas, key points, and significant details.
2. Maintain the logical flow and structure of the original content.
3. Be objective and accurate in your representation.
4. Organize the summary with clear sections and bullet points where appropriate.
5. Keep the summary to about 20-30% of the original text length.

Return a well-structured summary with:
- An overview paragraph capturing the essence of the content
- Key points organized by topic
- Any critical conclusions or implications
`;

    case 'questions':
      return `
You are an expert educator who creates deep, thought-provoking questions that promote critical thinking.

Guidelines:
1. Generate 5-7 deep questions that go beyond surface-level understanding.
2. Create questions that require analysis, synthesis, evaluation, or application of the content.
3. Include questions that explore implications, connections to broader concepts, and different perspectives.
4. Format each question with:
   - The question itself
   - Why this question matters (its significance)
   - What thinking skills it develops

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "question": "Deep, thought-provoking question text",
      "significance": "Brief explanation of why this question matters",
      "skills": ["Critical thinking", "Analysis", "Evaluation"]
    },
    // Additional questions
  ]
}`;

    default:
      return '';
  }
};

export async function POST(request: NextRequest) {
  try {
    const { text, contentType } = await request.json() as RequestBody;
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }
    
    if (!contentType || (contentType !== 'summary' && contentType !== 'questions')) {
      return NextResponse.json(
        { error: 'Valid content type (summary or questions) is required' },
        { status: 400 }
      );
    }
    
    log(`Generating ${contentType} for text: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    const sanitizedText = text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\u00A0/g, ' ')
      .trim();
    
    console.log('Sending request to Anthropic API...');
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      system: getSystemPrompt(contentType),
      messages: [
        { 
          role: "user", 
          content: `Create ${contentType === 'summary' ? 'a summary of' : 'deep questions about'} this content: ${sanitizedText}`
        }
      ],
    });

    const contentBlock = response.content?.[0];
    if (!contentBlock || contentBlock.type !== 'text' || !contentBlock.text) {
      throw new Error('Empty or invalid response from Anthropic API');
    }

    log('Raw response from Anthropic:', contentBlock.text.substring(0, 200) + '...');

    if (contentType === 'summary') {
      // For summaries, we just return the text directly
      return NextResponse.json({ summary: contentBlock.text });
    } else {
      // For questions, we need to extract and parse JSON
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
        return NextResponse.json(data);
      } catch (parseError: unknown) {
        console.error('JSON parse error:', parseError);
        console.error('Failed JSON content:', cleanText);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown JSON parsing error';
        throw new Error(`Failed to parse JSON response: ${errorMessage}`);
      }
    }
  } catch (error: any) {
    console.error('Error generating reader content:', error);
    return NextResponse.json(
      { error: `Failed to generate content: ${error.message}` },
      { status: 500 }
    );
  }
} 