import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface RequestBody {
  text: string;
  provider?: 'openai' | 'anthropic';
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

const getStoryboardSystemPrompt = () => `
You are an expert in creating visual storyboards that help people remember complex information. I need you to create a sequence of scenes that represent the key concepts from the provided text.

Guidelines:
1. Break down the content into 4-12 sequential scenes that capture the most important concepts. Make sure each scene is chunked small enough that it could be visualised by a single symbol.
2. For each scene:
   - Create a clear, concise title
   - Write brief explanatory text (1-3 sentences)
   - Provide 1-3 icon search terms that visually represent the scene
   - For each icon search term, provide 2-4 alternative search terms

3. The scenes should flow logically and build upon each other to tell a coherent story.
4. Focus on creating visual mental hooks that will aid memory retention.

You MUST use the function "create_storyboard_scenes" to provide your response.
`;

const anthropicToolSpec = [
  {
    name: "create_storyboard_scenes",
    description: "Create a storyboard with scenes to help memorize the content",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: {
          type: "string" as const,
          description: "The main topic or title of the storyboard"
        },
        scene_descriptions: {
          type: "array" as const,
          description: "The scenes that make up the storyboard",
          items: {
            type: "object" as const,
            properties: {
              title: {
                type: "string" as const,
                description: "A concise title for this scene"
              },
              content_text: {
                type: "string" as const,
                description: "1-3 sentences explaining the key concept in this scene"
              },
              icon_search: {
                type: "array" as const,
                description: "Search terms for finding appropriate icons",
                items: {
                  type: "object" as const,
                  properties: {
                    primary_term: {
                      type: "string" as const,
                      description: "The primary search term for an icon"
                    },
                    alternative_terms: {
                      type: "array" as const,
                      items: {
                        type: "string" as const
                      },
                      description: "Alternative search terms if the primary doesn't yield good results"
                    }
                  },
                  required: ["primary_term", "alternative_terms"]
                }
              }
            },
            required: ["title", "content_text", "icon_search"]
          }
        }
      },
      required: ["topic", "scene_descriptions"]
    }
  }
];

async function generateWithAnthropic(text: string) {
  try {
    const sanitizedText = text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\u00A0/g, ' ')
      .trim();

    console.log('[generate-icon-storyboard] Sending request to Anthropic API...');
    
    const response = await providers.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      system: getStoryboardSystemPrompt(),
      messages: [
        { 
          role: "user", 
          content: `Create a visual storyboard to help memorize this content: ${sanitizedText}`
        }
      ],
      tools: anthropicToolSpec
    });

    console.log('[generate-icon-storyboard] Received response from Anthropic');

    // Extract function call from response
    const functionCall = response.content.find(
      content => content.type === 'tool_use'
    );

    if (!functionCall || functionCall.type !== 'tool_use') {
      throw new Error('No function call found in Anthropic response');
    }

    console.log('[generate-icon-storyboard] Function call found:', functionCall.name);
    console.log('[generate-icon-storyboard] Function arguments type:', typeof functionCall.input);
    
    // For debugging, log a preview of the input
    console.log('[generate-icon-storyboard] Function arguments preview:', 
      JSON.stringify(functionCall.input).substring(0, 100) + '...');

    // Extract the storyboard data from the function call arguments
    return {
      function_call: {
        name: functionCall.name,
        arguments: functionCall.input
      }
    };
  } catch (error) {
    console.error('[generate-icon-storyboard] Anthropic API error:', error);
    throw error;
  }
}

async function generateWithOpenAI(text: string) {
  try {
    console.log('[generate-icon-storyboard] Sending request to OpenAI API...');
    
    const response = await providers.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: getStoryboardSystemPrompt() 
        },
        { 
          role: 'user', 
          content: `Create a visual storyboard to help memorize this content: ${text}` 
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_storyboard_scenes",
            description: "Create a storyboard with scenes to help memorize the content",
            parameters: {
              type: "object",
              properties: {
                topic: {
                  type: "string",
                  description: "The main topic or title of the storyboard"
                },
                scene_descriptions: {
                  type: "array",
                  description: "The scenes that make up the storyboard",
                  items: {
                    type: "object",
                    properties: {
                      title: {
                        type: "string",
                        description: "A concise title for this scene"
                      },
                      content_text: {
                        type: "string",
                        description: "1-3 sentences explaining the key concept in this scene"
                      },
                      icon_search: {
                        type: "array",
                        description: "Search terms for finding appropriate icons",
                        items: {
                          type: "object",
                          properties: {
                            primary_term: {
                              type: "string",
                              description: "The primary search term for an icon"
                            },
                            alternative_terms: {
                              type: "array",
                              items: {
                                type: "string"
                              },
                              description: "Alternative search terms if the primary doesn't yield good results"
                            }
                          },
                          required: ["primary_term", "alternative_terms"]
                        }
                      }
                    },
                    required: ["title", "content_text", "icon_search"]
                  }
                }
              },
              required: ["topic", "scene_descriptions"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "create_storyboard_scenes" } }
    });

    console.log('[generate-icon-storyboard] Received response from OpenAI');

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No function call found in OpenAI response');
    }

    console.log('[generate-icon-storyboard] Function arguments type:', 
      typeof toolCall.function.arguments);
    
    // For debugging, log a preview of the arguments
    console.log('[generate-icon-storyboard] Function arguments preview:', 
      toolCall.function.arguments.substring(0, 100) + '...');

    // Parse the JSON string if it's a string
    let parsedArgs;
    try {
      parsedArgs = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error('[generate-icon-storyboard] Failed to parse JSON arguments:', e);
      parsedArgs = null;
    }

    return {
      function_call: {
        name: toolCall.function.name,
        arguments: parsedArgs || toolCall.function.arguments
      }
    };
  } catch (error) {
    console.error('[generate-icon-storyboard] OpenAI API error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json() as RequestBody;
    
    const { 
      text, 
      provider = DEFAULT_PROVIDER,
    } = requestBody;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log(`[generate-icon-storyboard] Generating storyboard with ${provider} for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    try {
      let result;
      switch (provider) {
        case 'anthropic':
          result = await generateWithAnthropic(text);
          break;
        default:
          result = await generateWithOpenAI(text);
      }

      return NextResponse.json(result);
    } catch (providerError) {
      console.error(`[generate-icon-storyboard] ${provider} API error:`, providerError);
      return NextResponse.json({
        error: `Error generating storyboard with ${provider}`,
        details: providerError instanceof Error ? providerError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[generate-icon-storyboard] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 