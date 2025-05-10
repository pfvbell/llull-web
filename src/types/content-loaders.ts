import type { Document } from 'langchain/document';

// Content source types
export type ContentSourceType = 'manual' | 'youtube' | 'pdf' | 'url';

// Loader parameter types
export interface YoutubeLoaderParams {
  url: string;
}

export interface UrlLoaderParams {
  url: string;
}

export interface FileLoaderParams {
  filePath: string;
  fileName: string;
}

// Loader result types
export interface ContentLoaderResult {
  content: string;
  title: string;
  source: ContentSourceType;
  metadata?: Record<string, any>;
}

export interface YoutubeLoaderResult extends ContentLoaderResult {
  source: 'youtube';
  videoId: string;
}

export interface UrlLoaderResult extends ContentLoaderResult {
  source: 'url';
}

export interface PdfLoaderResult extends ContentLoaderResult {
  source: 'pdf';
}

// Content loader function type
export type ContentLoaderFunction<P, R extends ContentLoaderResult> = (params: P) => Promise<R>;

// Registry interface for easy addition of new loaders
export interface ContentLoaderRegistry {
  youtube: ContentLoaderFunction<YoutubeLoaderParams, YoutubeLoaderResult>;
  url: ContentLoaderFunction<UrlLoaderParams, UrlLoaderResult>;
  pdf: ContentLoaderFunction<FileLoaderParams, PdfLoaderResult>;
  [key: string]: ContentLoaderFunction<any, ContentLoaderResult>;
}

// Helper for processing LangChain documents
export function processDocuments(docs: Document[], defaultTitle: string = 'Content'): {content: string, title: string} {
  const content = docs.map(doc => doc.pageContent).join('\n\n');
  const title = docs.length > 0 && docs[0].metadata.title ? docs[0].metadata.title : defaultTitle;
  
  return { content, title };
} 