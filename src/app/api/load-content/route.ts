import { NextRequest, NextResponse } from 'next/server';
import { YoutubeLoader } from '@langchain/community/document_loaders/web/youtube';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import type { Document } from 'langchain/document';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  ContentSourceType,
  ContentLoaderRegistry,
  YoutubeLoaderParams,
  UrlLoaderParams,
  FileLoaderParams,
  ContentLoaderResult,
  YoutubeLoaderResult,
  UrlLoaderResult,
  PdfLoaderResult,
  processDocuments
} from '@/types/content-loaders';

// Helper to log messages
const log = (message: string, data?: any) => {
  console.log(`[API:load-content] ${message}`, data ? data : '');
};

// Content loader factory - makes it easy to add new loaders in the future
const getContentLoader = (sourceType: string) => {
  const loaders: ContentLoaderRegistry = {
    youtube: async (params: YoutubeLoaderParams): Promise<YoutubeLoaderResult> => {
      // Extract video ID if full URL is provided
      let videoId = params.url;
      const match = params.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match && match[1]) {
        videoId = match[1];
      }
      
      log(`Loading YouTube transcript for video ID: ${videoId}`);
      
      // Use LangChain's YouTube loader
      const loader = YoutubeLoader.createFromUrl(`https://youtu.be/${videoId}`, {
        language: 'en',
        addVideoInfo: true,
      });
      
      const docs = await loader.load();
      log(`Loaded ${docs.length} document(s) from YouTube`);
      
      // Use the helper to process documents
      const { content, title } = processDocuments(docs, 'YouTube Video');
      
      // Get video info if available
      const videoInfo = docs.length > 0 && docs[0].metadata.videoInfo ? 
        docs[0].metadata.videoInfo : { title: 'YouTube Video' };
      
      return { 
        content,
        title: videoInfo.title,
        source: 'youtube',
        videoId
      };
    },
    
    url: async (params: UrlLoaderParams): Promise<UrlLoaderResult> => {
      log(`Loading content from web URL: ${params.url}`);
      
      // Use LangChain's Cheerio loader for web pages
      const loader = new CheerioWebBaseLoader(params.url);
      const docs = await loader.load();
      
      log(`Loaded ${docs.length} document(s) from URL`);
      
      // Use the helper to process documents
      const { content, title } = processDocuments(docs, 'Web Page');
      
      return { 
        content,
        title,
        source: 'url'
      };
    },
    
    pdf: async (params: FileLoaderParams): Promise<PdfLoaderResult> => {
      log(`Processing PDF file: ${params.fileName}`);
      
      // Use LangChain's PDF loader
      const loader = new PDFLoader(params.filePath);
      const docs = await loader.load();
      
      log(`Loaded ${docs.length} document(s) from PDF`);
      
      // Use the helper to process documents
      const { content, title } = processDocuments(docs, params.fileName || 'PDF Document');
      
      return { 
        content,
        title,
        source: 'pdf'
      };
    }
    
    // Additional loaders can be added here in the future
  };
  
  return loaders[sourceType as ContentSourceType] || null;
};

// Helper to parse multipart form data
async function parseFormData(req: NextRequest) {
  log('Parsing form data for file upload');
  
  // In Next.js App Router, we need to read the FormData differently
  const formData = await req.formData();
  const sourceType = formData.get('sourceType') as string;
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  log(`Received file upload: ${file.name} (${Math.round(file.size/1024)}KB)`);
  
  // Convert the file to an ArrayBuffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Create a temporary file path
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, file.name || 'upload.pdf');
  
  // Write the file to disk
  await fs.promises.writeFile(tempFilePath, buffer);
  
  return {
    sourceType,
    filePath: tempFilePath,
    fileName: file.name
  };
}

export async function POST(req: NextRequest) {
  try {
    log('Received content load request');
    
    // Handle JSON requests (YouTube and URL loading)
    if (req.headers.get('content-type')?.includes('application/json')) {
      log('Processing JSON request for URL-based content');
      const body = await req.json();
      const { sourceType, url } = body;
      
      if (!sourceType || !url) {
        return NextResponse.json({ error: 'Source type and URL are required' }, { status: 400 });
      }
      
      log(`Processing ${sourceType} content from URL: ${url}`);
      
      const loader = getContentLoader(sourceType);
      if (!loader) {
        return NextResponse.json({ error: `Unsupported source type: ${sourceType}` }, { status: 400 });
      }
      
      const result = await loader({ url });
      log(`Successfully loaded content from ${sourceType}`, { 
        contentLength: result.content.length,
        title: result.title
      });
      
      return NextResponse.json(result);
    }
    // Handle multipart form data (file uploads)
    else if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      log('Processing multipart form data for file upload');
      
      const { sourceType, filePath, fileName } = await parseFormData(req);
      
      log(`Processing ${sourceType} content from file: ${fileName}`);
      
      const loader = getContentLoader(sourceType);
      if (!loader) {
        // Clean up the temporary file in case of error
        await fs.promises.unlink(filePath);
        return NextResponse.json({ error: `Unsupported source type: ${sourceType}` }, { status: 400 });
      }
      
      try {
        const result = await loader({ filePath, fileName });
        
        // Clean up the temporary file
        await fs.promises.unlink(filePath);
        
        log(`Successfully loaded content from ${sourceType} file`, { 
          contentLength: result.content.length,
          title: result.title
        });
        
        return NextResponse.json(result);
      } catch (error) {
        // Clean up the temporary file in case of error
        await fs.promises.unlink(filePath);
        throw error;
      }
    }
    else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error loading content:', error);
    return NextResponse.json({ 
      error: `Failed to load content: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 