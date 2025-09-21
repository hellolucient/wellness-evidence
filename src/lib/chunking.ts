import { Document, Chunk, ChunkMetadata } from '@/types';

export interface ChunkingOptions {
  maxChunkSize?: number;
  overlapSize?: number;
  preserveSentences?: boolean;
}

export class TextChunker {
  private static instance: TextChunker;

  static getInstance(): TextChunker {
    if (!TextChunker.instance) {
      TextChunker.instance = new TextChunker();
    }
    return TextChunker.instance;
  }

  chunkDocument(
    document: Document,
    options: ChunkingOptions = {}
  ): Chunk[] {
    const {
      maxChunkSize = 1000,
      overlapSize = 200,
      preserveSentences = true
    } = options;

    const chunks: Chunk[] = [];
    
    // Chunk the abstract
    const abstractChunks = this.chunkText(
      document.abstract,
      maxChunkSize,
      overlapSize,
      preserveSentences
    );

    abstractChunks.forEach((content, index) => {
      chunks.push({
        id: `${document.id}-abstract-${index}`,
        documentId: document.id,
        content,
        chunkIndex: index,
        metadata: {
          section: 'abstract',
          wordCount: content.split(/\s+/).length
        },
        createdAt: new Date().toISOString()
      });
    });

    return chunks;
  }

  chunkText(
    text: string,
    maxChunkSize: number = 1000,
    overlapSize: number = 200,
    preserveSentences: boolean = true
  ): string[] {
    if (!text || text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxChunkSize;
      
      if (preserveSentences && end < text.length) {
        // Find the last sentence boundary within the chunk
        const lastPeriod = text.lastIndexOf('.', end);
        const lastExclamation = text.lastIndexOf('!', end);
        const lastQuestion = text.lastIndexOf('?', end);
        
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (lastSentenceEnd > start + maxChunkSize * 0.5) {
          end = lastSentenceEnd + 1;
        }
      }

      const chunk = text.slice(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }

      // Move start position with overlap
      start = end - overlapSize;
      if (start >= text.length) break;
    }

    return chunks;
  }

  // Advanced chunking for different document sections
  chunkBySections(document: Document): Chunk[] {
    const chunks: Chunk[] = [];
    let chunkIndex = 0;

    // Abstract chunking
    const abstractChunks = this.chunkText(document.abstract, 800, 100);
    abstractChunks.forEach((content) => {
      chunks.push({
        id: `${document.id}-abstract-${chunkIndex}`,
        documentId: document.id,
        content,
        chunkIndex: chunkIndex++,
        metadata: {
          section: 'abstract',
          wordCount: content.split(/\s+/).length
        },
        createdAt: new Date().toISOString()
      });
    });

    // If we had full text, we would chunk other sections here
    // For now, we'll focus on abstracts since that's what PubMed provides

    return chunks;
  }

  // Utility method to clean and normalize text
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
  }

  // Extract key phrases for better search
  extractKeyPhrases(text: string, maxPhrases: number = 10): string[] {
    // Simple key phrase extraction - in production, you might use NLP libraries
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxPhrases)
      .map(([word]) => word);
  }
}

export const textChunker = TextChunker.getInstance();
