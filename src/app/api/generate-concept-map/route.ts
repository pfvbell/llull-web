// app/api/generate-concept-map/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ConceptMap } from '@/types';

interface RequestBody {
  text: string;
  provider?: 'openai' | 'anthropic';
  complexityLevel?: number; // 1-5
}

const DEFAULT_PROVIDER = 'anthropic' as const;

const providers = {
  openai: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
  
  anthropic: new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
};

const getConceptMapSystemPrompt = () => `
You are an expert in creating concept maps to simplify complex topics. I need you to create 5 versions of the same concept map, from simplest to most detailed.

Guidelines:
1. Create 5 versions of increasing complexity:
   - Level 1 (Most Basic): 2-3 core nodes showing the fundamental concept
   - Level 2 (Simplified): 4-5 nodes adding key supporting elements
   - Level 3 (Standard): 6-8 nodes with main relationships
   - Level 4 (Detailed): 9-12 nodes showing broader context
   - Level 5 (Complete): 13+ nodes with full detail

2. Critical Requirements for Progressive Complexity:
   - Use consistent node IDs across all versions
   - Each level must build upon the previous level
   - Never contradict information from simpler versions
   - Maintain core nodes in consistent positions
   - More complex versions should expand outward from the core
   - Keep node text consistent between versions

3. Formatting Guidelines:
   - Use TB (top to bottom) direction for consistent layout
   - Include relevant emojis for visual engagement
   - Keep node text concise and clear
   - Use subgraphs to group related concepts in complex versions
   - Maintain consistent styling across versions

4. Language and Connections:
   - Use clear, directional arrows
   - Label important connections
   - Group related concepts visually

Return ONLY valid JSON in this format:
{
  "title": "Brief topic description",
  "versions": [
    {
      "level": 1,
      "nodes": [
        { "id": "1", "label": "Main Concept", "position": { "x": 0, "y": 0 } },
        { "id": "2", "label": "Related Concept", "position": { "x": 200, "y": 0 } }
      ],
      "edges": [
        { "id": "e1-2", "source": "1", "target": "2", "label": "relates to" }
      ]
    },
    // ... all 5 levels
  ]
}`;

const sampleFlowchart = {
  "topic": "Photosynthesis Process",
  "versions": [
    {
      "level": 1,
      "content": `flowchart TB
    Sun[☀️ Sunlight] -->|provides energy to| Plant[🌿 Plant]
    Plant -->|produces| Food[🍎 Food]`
    },
    {
      "level": 2,
      "content": `flowchart TB
    Sun[☀️ Sunlight] -->|energizes| Plant[🌿 Plant]
    Water[💧 Water] -->|absorbed by| Plant
    Plant -->|creates| Food[🍎 Food]
    Plant -->|releases| Oxygen[💨 Oxygen]`
    },
    {
      "level": 3,
      "content": `flowchart TB
    Sun[☀️ Sunlight] -->|powers| Plant[🌿 Plant]
    Water[💧 Water] -->|hydrates| Plant
    CO2[CO₂] -->|absorbed through| Plant
    Plant -->|produces| Food[🍎 Food]
    Plant -->|releases| Oxygen[💨 Oxygen]
    Plant -->|stores| Energy[⚡ Energy]`
    },
    {
      "level": 4,
      "content": `flowchart TB
    Sun[☀️ Sunlight] -->|activates| Chlorophyll[🟢 Chlorophyll]
    Chlorophyll -->|converts light in| Plant[🌿 Plant]
    Water[💧 Water] -->|transported to| Plant
    CO2[CO₂] -->|enters through| Plant
    Plant -->|synthesizes| Food[🍎 Food]
    Plant -->|releases| Oxygen[💨 Oxygen]
    Plant -->|stores| Energy[⚡ Energy]
    Plant -->|enables| Growth[📈 Growth]`
    },
    {
      "level": 5,
      "content": `flowchart TB
    Sun[☀️ Sunlight] -->|activates| Chlorophyll[🟢 Chlorophyll]
    Chlorophyll -->|converts energy in| Plant[🌿 Plant]
    Water[💧 Water] -->|absorbed by| Roots[🌱 Roots]
    Roots -->|transports to| Plant
    CO2[CO₂] -->|enters through| Stomata[👄 Stomata]
    Stomata -->|delivers to| Plant
    Plant -->|creates| Food[🍎 Food]
    Plant -->|releases| Oxygen[💨 Oxygen]
    Plant -->|stores| Energy[⚡ Energy]
    Plant -->|enables| Growth[📈 Growth]
    Plant -->|excess to| Storage[📦 Storage]
    Energy -->|powers| Growth`
    }
  ]
};

async function generateWithAnthropic(text: string): Promise<ConceptMap> {
  try {
    const sanitizedText = text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\u00A0/g, ' ')
      .trim();

    console.log('Sending request to Anthropic API...');
    const response = await providers.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      system: getConceptMapSystemPrompt(),
      messages: [
        { 
          role: "user", 
          content: `Based on the example concept map: ${JSON.stringify(sampleFlowchart)}\n\nCreate a similar multi-level concept map to explain this content: ${sanitizedText}\n\nEnsure all 5 complexity levels are provided and maintain node consistency between versions.`
        }
      ],
    });

    const contentBlock = response.content?.[0];
    if (!contentBlock || contentBlock.type !== 'text' || !contentBlock.text) {
      throw new Error('Empty or invalid response from Anthropic API');
    }

    console.log('Raw response from Anthropic:', contentBlock.text.substring(0, 200) + '...');

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
    
    console.log('Cleaned JSON text (first 200 chars):', cleanText.substring(0, 200) + '...');

    try {
      const data = JSON.parse(cleanText);
      console.log('Successfully parsed JSON');
      
      // Validate the structure
      if (!data.title || !Array.isArray(data.versions)) {
        throw new Error('Invalid concept map structure: missing title or versions array');
      }
      
      console.log(`Parsed concept map with ${data.versions.length} complexity levels`);
      
      return {
        title: data.title,
        topic: data.title,
        complexity: 3, // Default to middle complexity
        versions: data.versions,
        nodes: data.versions[2].nodes, // Default to level 3
        edges: data.versions[2].edges, // Default to level 3
      };
    } catch (parseError: unknown) {
      console.error('JSON parse error:', parseError);
      console.error('Failed JSON content:', cleanText);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown JSON parsing error';
      throw new Error(`Failed to parse JSON response: ${errorMessage}`);
    }

  } catch (error) {
    console.error('Anthropic API error:', error);
    throw error;
  }
}

async function generateWithOpenAI(text: string): Promise<ConceptMap> {
  const response = await providers.openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: getConceptMapSystemPrompt() },
      { role: 'user', content: `Create a concept map to explain this content: ${text}` }
    ],
    response_format: { type: "json_object" }
  });

  const data = JSON.parse(response.choices[0].message.content || '{}');
  return {
    title: data.title,
    topic: data.title,
    complexity: 3, // Default to middle complexity
    versions: data.versions,
    nodes: data.versions[2].nodes, // Default to level 3
    edges: data.versions[2].edges, // Default to level 3
  };
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json() as RequestBody;
    
    const { 
      text, 
      provider = DEFAULT_PROVIDER,
      complexityLevel = 3 // Default to middle complexity
    } = requestBody;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    let conceptMap: ConceptMap;

    try {
      switch (provider) {
        case 'anthropic':
          conceptMap = await generateWithAnthropic(text);
          break;
        default:
          conceptMap = await generateWithOpenAI(text);
      }

      // Set the current complexity level
      conceptMap.complexity = complexityLevel;
      
      // Ensure we have a valid index even if requested level doesn't exist
      const versionIndex = Math.min(complexityLevel - 1, conceptMap.versions.length - 1);
      
      console.log(`Setting complexity to level ${complexityLevel} (index ${versionIndex}), available levels: ${
        conceptMap.versions.map(v => v.level).join(', ')
      }`);
      
      conceptMap.nodes = conceptMap.versions[versionIndex].nodes;
      conceptMap.edges = conceptMap.versions[versionIndex].edges;

      return NextResponse.json(conceptMap);

    } catch (providerError) {
      console.error(`${provider} API error:`, providerError);
      return NextResponse.json({
        error: `Error generating concept map with ${provider}`,
        details: providerError instanceof Error ? providerError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}