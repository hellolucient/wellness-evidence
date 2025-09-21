import { supabaseAdmin } from './db';
import { openaiService } from './openai';
import { textChunker } from './chunking';
import { logger } from './logging';
import { Document, Chunk, QueryResult, SearchRequest, EvidenceStrength } from '@/types';

export class RAGService {
  private static instance: RAGService;

  static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  async search(request: SearchRequest): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await openaiService.generateEmbedding(request.query);
      
      // Perform vector similarity search
      const { data: chunks, error } = await supabaseAdmin.rpc('search_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: request.limit || 10
      });

      if (error) {
        logger.logError(error as Error, { operation: 'vector_search' });
        throw error;
      }

      // Get document details for the chunks
      const documentIds = [...new Set(chunks.map((chunk: any) => chunk.document_id))];
      const { data: documents, error: docError } = await supabaseAdmin
        .from('documents')
        .select('*')
        .in('id', documentIds);

      if (docError) {
        logger.logError(docError as Error, { operation: 'fetch_documents' });
        throw docError;
      }

      // Combine chunks and documents
      const enrichedChunks = chunks.map((chunk: any) => ({
        ...chunk,
        document: documents.find(doc => doc.id === chunk.document_id)
      }));

      // Generate answer using RAG
      const context = enrichedChunks
        .map(chunk => `${chunk.document.title}\n${chunk.content}`)
        .join('\n\n');

      const answer = await openaiService.generateAnswer(request.query, context);

      // Generate evidence grade
      const evidenceGrade = await openaiService.generateEvidenceGrade(documents, answer);

      // Create citations
      const citations = enrichedChunks.map((chunk, index) => ({
        id: `citation-${index}`,
        documentId: chunk.document_id,
        chunkId: chunk.id,
        text: chunk.content.substring(0, 100) + '...',
        position: index + 1
      }));

      const duration = Date.now() - startTime;
      
      logger.logSearch(request.query, chunks.length, duration);

      return {
        answer,
        citations,
        evidenceStrength: evidenceGrade.strength as EvidenceStrength,
        documents: documents || [],
        chunks: enrichedChunks,
        searchMetadata: {
          query: request.query,
          totalResults: chunks.length,
          searchTime: duration,
          embeddingTime: 0, // Would track this separately in production
          retrievalTime: 0,
          generationTime: 0
        }
      };

    } catch (error) {
      logger.logError(error as Error, { 
        operation: 'search',
        query: request.query 
      });
      throw error;
    }
  }

  async ingestDocument(document: Document): Promise<void> {
    try {
      // Insert document
      const { error: docError } = await supabaseAdmin
        .from('documents')
        .upsert({
          id: document.id,
          title: document.title,
          abstract: document.abstract,
          authors: document.authors,
          journal: document.journal,
          publication_date: document.publicationDate,
          doi: document.doi,
          pmid: document.pmid,
          url: document.url,
          study_type: document.studyType,
          sample_size: document.sampleSize,
          conflicts_of_interest: document.conflictsOfInterest,
          keywords: document.keywords,
          created_at: document.createdAt,
          updated_at: document.updatedAt
        });

      if (docError) {
        logger.logError(docError as Error, { operation: 'insert_document' });
        throw docError;
      }

      // Chunk the document
      const chunks = textChunker.chunkDocument(document);

      // Generate embeddings for chunks
      const chunkTexts = chunks.map(chunk => chunk.content);
      const embeddings = await openaiService.generateEmbeddings(chunkTexts);

      // Insert chunks with embeddings
      const chunksWithEmbeddings = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index]
      }));

      const { error: chunkError } = await supabaseAdmin
        .from('chunks')
        .upsert(chunksWithEmbeddings.map(chunk => ({
          id: chunk.id,
          document_id: chunk.documentId,
          content: chunk.content,
          chunk_index: chunk.chunkIndex,
          embedding: chunk.embedding,
          metadata: chunk.metadata,
          created_at: chunk.createdAt
        })));

      if (chunkError) {
        logger.logError(chunkError as Error, { operation: 'insert_chunks' });
        throw chunkError;
      }

      logger.info('Document ingested successfully', {
        documentId: document.id,
        chunkCount: chunks.length
      });

    } catch (error) {
      logger.logError(error as Error, { 
        operation: 'ingestDocument',
        documentId: document.id 
      });
      throw error;
    }
  }

  async reembedChunk(chunkId: string): Promise<void> {
    try {
      // Get chunk content
      const { data: chunk, error: fetchError } = await supabaseAdmin
        .from('chunks')
        .select('content')
        .eq('id', chunkId)
        .single();

      if (fetchError) {
        logger.logError(fetchError as Error, { operation: 'fetch_chunk' });
        throw fetchError;
      }

      // Generate new embedding
      const embedding = await openaiService.generateEmbedding(chunk.content);

      // Update chunk with new embedding
      const { error: updateError } = await supabaseAdmin
        .from('chunks')
        .update({ embedding })
        .eq('id', chunkId);

      if (updateError) {
        logger.logError(updateError as Error, { operation: 'update_chunk_embedding' });
        throw updateError;
      }

      logger.info('Chunk re-embedded successfully', { chunkId });

    } catch (error) {
      logger.logError(error as Error, { 
        operation: 'reembedChunk',
        chunkId 
      });
      throw error;
    }
  }
}

export const ragService = RAGService.getInstance();
