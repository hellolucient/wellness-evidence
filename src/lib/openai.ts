import OpenAI from 'openai';
import { logger } from './logging';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenAIService {
  private static instance: OpenAIService;

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  async generateEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<number[]> {
    const startTime = Date.now();
    
    try {
      const response = await openai.embeddings.create({
        model: options.model || 'text-embedding-3-small',
        input: text,
        dimensions: options.dimensions || 1536,
      });

      const duration = Date.now() - startTime;
      logger.debug('Embedding generated', { 
        textLength: text.length, 
        duration,
        model: options.model || 'text-embedding-3-small'
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.logError(error as Error, { 
        operation: 'generateEmbedding',
        textLength: text.length 
      });
      throw error;
    }
  }

  async generateEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<number[][]> {
    const startTime = Date.now();
    
    try {
      const response = await openai.embeddings.create({
        model: options.model || 'text-embedding-3-small',
        input: texts,
        dimensions: options.dimensions || 1536,
      });

      const duration = Date.now() - startTime;
      logger.debug('Batch embeddings generated', { 
        count: texts.length, 
        duration,
        model: options.model || 'text-embedding-3-small'
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      logger.logError(error as Error, { 
        operation: 'generateEmbeddings',
        count: texts.length 
      });
      throw error;
    }
  }

  async generateAnswer(
    query: string,
    context: string,
    options: ChatOptions = {}
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      const response = await openai.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert in evidence-based wellness research. Your task is to provide accurate, concise answers based on the provided research context. Always cite sources using inline numeric citations [1], [2], etc. Be objective and highlight any limitations or conflicting evidence.`
          },
          {
            role: 'user',
            content: `Query: ${query}\n\nContext:\n${context}\n\nPlease provide a comprehensive answer with proper citations.`
          }
        ],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 1000,
      });

      const duration = Date.now() - startTime;
      logger.debug('Answer generated', { 
        queryLength: query.length,
        contextLength: context.length,
        duration,
        model: options.model || 'gpt-4o-mini'
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      logger.logError(error as Error, { 
        operation: 'generateAnswer',
        queryLength: query.length,
        contextLength: context.length 
      });
      throw error;
    }
  }

  async generateEvidenceGrade(
    documents: any[],
    answer: string
  ): Promise<{ strength: string; score: number; reasoning: string }> {
    const startTime = Date.now();
    
    try {
      const documentSummary = documents.map(doc => ({
        title: doc.title,
        studyType: doc.study_type,
        sampleSize: doc.sample_size,
        publicationDate: doc.publication_date,
        conflictsOfInterest: doc.conflicts_of_interest
      }));

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert in evidence grading. Rate the evidence strength as Strong, Moderate, Weak, or Insufficient based on:
            - Study types (meta-analyses and RCTs are strongest)
            - Sample sizes (larger is better)
            - Recency (newer is better)
            - Conflicts of interest (fewer is better)
            - Consistency of findings
            
            Provide a score from 0-100 and brief reasoning.`
          },
          {
            role: 'user',
            content: `Documents: ${JSON.stringify(documentSummary)}\n\nAnswer: ${answer}\n\nGrade this evidence.`
          }
        ],
        temperature: 0.2,
        max_tokens: 300,
      });

      const duration = Date.now() - startTime;
      logger.debug('Evidence grade generated', { 
        documentCount: documents.length,
        duration 
      });

      const content = response.choices[0].message.content || '';
      
      // Parse the response to extract strength, score, and reasoning
      const strengthMatch = content.match(/(Strong|Moderate|Weak|Insufficient)/i);
      const scoreMatch = content.match(/(\d+)/);
      
      return {
        strength: strengthMatch?.[1] || 'Insufficient',
        score: parseInt(scoreMatch?.[1] || '0'),
        reasoning: content
      };
    } catch (error) {
      logger.logError(error as Error, { 
        operation: 'generateEvidenceGrade',
        documentCount: documents.length 
      });
      throw error;
    }
  }
}

export const openaiService = OpenAIService.getInstance();
