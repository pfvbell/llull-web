import { NextRequest, NextResponse } from 'next/server';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

interface RequestBody {
  keyword: string;
  searchTerm: string;
  semanticTags?: string[];
  limit?: number;
}

// Create OAuth 1.0a credentials
const oauth = new OAuth({
  consumer: {
    key: process.env.NOUN_PROJECT_KEY || '',
    secret: process.env.NOUN_PROJECT_SECRET || ''
  },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString: string, key: string) {
    return crypto
      .createHmac('sha1', key)
      .update(baseString)
      .digest('base64');
  }
});

let apiCallCount = 0;

// Concept map to map abstract terms to more concrete icon search terms
const conceptMap: Record<string, string> = {
  'treaty': 'document',
  'agreement': 'document',
  'war': 'sword',
  'photosynthesis': 'leaf',
  'cell': 'biology',
  'water': 'droplet',
  'molecule': 'chemistry',
  'atom': 'science'
};

async function fetchNounProject(query: string, limit = 5) {
  apiCallCount++;
  
  try {
    // Use the working API endpoint format
    const url = `https://api.thenounproject.com/v2/icon?query=${encodeURIComponent(query)}&limit=${limit}`;
    
    const requestData = {
      url,
      method: 'GET'
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData));
    console.log(`[get-noun-project-icon] API Call #${apiCallCount} - Fetching URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        ...authHeader,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`[get-noun-project-icon] API Call #${apiCallCount} - Noun Project API error:`, {
        status: response.status,
        statusText: response.statusText,
        url
      });
      return null;
    }

    const data = await response.json();
    console.log(`[get-noun-project-icon] API Call #${apiCallCount} - Retrieved ${data.icons?.length || 0} icons for '${query}'`);
    
    if (data.icons) {
      data.icons = data.icons.slice(0, limit);
    }
    return data;
  } catch (error) {
    console.error(`[get-noun-project-icon] API Call #${apiCallCount} - Fetch error:`, error);
    return null;
  }
}

async function findBestIcons(
  keyword: string, 
  searchTerm: string = '', 
  semanticTags: string[] = [], 
  limit: number = 5
) {
  const icons = [];
  console.log(`[get-noun-project-icon] Starting icon search with:`, { keyword, searchTerm, semanticTags });

  // Try the primary search term first
  if (searchTerm) {
    console.log(`[get-noun-project-icon] Trying primary search term: ${searchTerm}`);
    const data = await fetchNounProject(searchTerm, 3);
    if (data?.icons?.length > 0) {
      icons.push(...data.icons.map((icon: any) => ({
        id: icon.id,
        term: searchTerm,
        preview_url: icon.preview_url || icon.thumbnail_url || '',
        attribution: {
          name: icon.attribution?.name || 'Noun Project',
          url: icon.attribution?.url || 'https://thenounproject.com'
        }
      })));
    }
  }

  // Try alternative semantic tags if we still need more icons
  if (icons.length < limit && semanticTags && semanticTags.length > 0) {
    for (let i = 0; i < 2 && i < semanticTags.length && icons.length < limit; i++) {
      const tag = semanticTags[i];
      console.log(`[get-noun-project-icon] Trying alternative search term: ${tag}`);
      
      // Check if we have a mapped term for this semantic tag
      const mappedTag = conceptMap[tag.toLowerCase()] || tag;
      
      const data = await fetchNounProject(mappedTag, 1);
      if (data?.icons?.length > 0) {
        const icon = data.icons[0];
        icons.push({
          id: icon.id,
          term: tag,
          preview_url: icon.preview_url || icon.thumbnail_url || '',
          attribution: {
            name: icon.attribution?.name || 'Noun Project',
            url: icon.attribution?.url || 'https://thenounproject.com'
          }
        });
      }
    }
  }

  // If still no icons found, try fallbacks
  if (icons.length === 0) {
    console.log('[get-noun-project-icon] No icons found, trying fallbacks');
    const fallbackTerms = ['icon', 'symbol', 'badge', 'mark', 'emblem'];
    
    for (const term of fallbackTerms) {
      if (icons.length > 0) break;
      
      const data = await fetchNounProject(term, 1);
      if (data?.icons?.length > 0) {
        const icon = data.icons[0];
        icons.push({
          id: icon.id,
          term: term,
          preview_url: icon.preview_url || icon.thumbnail_url || '',
          attribution: {
            name: icon.attribution?.name || 'Noun Project',
            url: icon.attribution?.url || 'https://thenounproject.com'
          }
        });
      }
    }
  }

  return icons;
}

export async function POST(request: NextRequest) {
  try {
    // Check API keys
    if (!process.env.NOUN_PROJECT_KEY || !process.env.NOUN_PROJECT_SECRET) {
      console.error('[get-noun-project-icon] Missing Noun Project API credentials');
      return NextResponse.json(
        { error: 'Noun Project API credentials not configured' },
        { status: 500 }
      );
    }

    const body = await request.json() as RequestBody;
    const { keyword, searchTerm, semanticTags = [], limit = 5 } = body;

    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      );
    }

    // Reset API call counter for each request
    apiCallCount = 0;
    console.log(`[get-noun-project-icon] Searching for "${searchTerm}" icons (related to "${keyword}")`);

    const icons = await findBestIcons(keyword, searchTerm, semanticTags, limit);
    console.log(`[get-noun-project-icon] Total Noun Project API calls for this request: ${apiCallCount}`);
    
    if (!icons || icons.length === 0) {
      // If no icons found through API, return a placeholder icon
      const titleInitial = keyword.charAt(0).toUpperCase();
      return NextResponse.json({
        keyword,
        searchTerm,
        icons: [{
          id: `placeholder-${keyword}`,
          term: searchTerm,
          isPlaceholder: true,
          titleInitial
        }]
      });
    }

    return NextResponse.json({
      keyword,
      searchTerm,
      icons: icons.slice(0, limit),
      apiCalls: apiCallCount
    });
  } catch (error) {
    console.error('[get-noun-project-icon] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch icons',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 