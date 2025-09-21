import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logging';
import { IngestRequest, Document } from '@/types';

const IngestRequestSchema = z.object({
  source: z.enum(['pubmed', 'nccih', 'manual']),
  query: z.string().optional(),
  limit: z.number().min(1).max(1000).optional(),
  forceReingest: z.boolean().optional()
});

// Mock ingestion function - in production, this would integrate with PubMed API
async function mockIngestFromPubMed(query: string, limit: number): Promise<Document[]> {
  // This is a mock implementation
  // In production, you would:
  // 1. Call PubMed E-utilities API
  // 2. Parse XML/JSON responses
  // 3. Extract document metadata
  // 4. Fetch full text where available
  
  const mockDocuments: Document[] = [
    {
      id: `pubmed-${Date.now()}-1`,
      title: 'Effect of Meditation on Stress Reduction: A Meta-Analysis',
      abstract: 'This meta-analysis examined the effects of meditation on stress reduction across 47 randomized controlled trials...',
      authors: ['Smith, J.', 'Johnson, A.', 'Brown, K.'],
      journal: 'Journal of Wellness Research',
      publicationDate: '2023-01-15',
      doi: '10.1234/jwr.2023.001',
      pmid: '12345678',
      studyType: 'Meta-Analysis',
      sampleSize: 2847,
      conflictsOfInterest: [],
      keywords: ['meditation', 'stress', 'meta-analysis', 'mindfulness'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `pubmed-${Date.now()}-2`,
      title: 'Yoga and Cardiovascular Health: A Systematic Review',
      abstract: 'This systematic review analyzed 23 studies investigating the effects of yoga on cardiovascular health...',
      authors: ['Davis, M.', 'Wilson, R.'],
      journal: 'Cardiovascular Wellness',
      publicationDate: '2023-03-20',
      doi: '10.5678/cw.2023.045',
      pmid: '87654321',
      studyType: 'Systematic Review',
      sampleSize: 1456,
      conflictsOfInterest: ['Funding from yoga equipment manufacturer'],
      keywords: ['yoga', 'cardiovascular', 'heart health', 'exercise'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  return mockDocuments.slice(0, limit);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Only allow ingestion in development or with proper authentication
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        error: 'Ingestion not allowed in production'
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = IngestRequestSchema.parse(body);
    
    logger.info('Ingestion request received', {
      source: validatedData.source,
      query: validatedData.query,
      limit: validatedData.limit,
      route: '/api/ingest'
    });

    let documents: Document[] = [];

    switch (validatedData.source) {
      case 'pubmed':
        if (!validatedData.query) {
          return NextResponse.json({
            success: false,
            error: 'Query is required for PubMed ingestion'
          }, { status: 400 });
        }
        documents = await mockIngestFromPubMed(validatedData.query, validatedData.limit || 10);
        break;
      
      case 'nccih':
        // Mock NCCIH ingestion
        documents = [
          {
            id: `nccih-${Date.now()}-1`,
            title: 'Complementary Health Approaches for Chronic Pain',
            abstract: 'This NCCIH-funded study examined the effectiveness of acupuncture for chronic pain management...',
            authors: ['NCCIH Research Team'],
            journal: 'NCCIH Research Bulletin',
            publicationDate: '2023-02-10',
            studyType: 'Randomized Controlled Trial',
            sampleSize: 500,
            conflictsOfInterest: [],
            keywords: ['acupuncture', 'chronic pain', 'complementary medicine'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        break;
      
      case 'manual':
        // For manual ingestion, documents would be provided in the request body
        return NextResponse.json({
          success: false,
          error: 'Manual ingestion not implemented yet'
        }, { status: 501 });
    }

    // Process documents (in production, this would call ragService.ingestDocument for each)
    const processedCount = documents.length;
    const errors: string[] = [];

    // Mock processing - in production, you would:
    // 1. Check if document already exists (unless forceReingest)
    // 2. Chunk the document
    // 3. Generate embeddings
    // 4. Store in database

    const duration = Date.now() - startTime;
    
    logger.logIngestion(validatedData.source, processedCount, duration);
    
    return NextResponse.json({
      success: true,
      data: {
        documentsProcessed: processedCount,
        chunksCreated: processedCount * 2, // Mock: assume 2 chunks per document
        embeddingsGenerated: processedCount * 2,
        errors,
        duration
      },
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        source: validatedData.source
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      logger.warn('Invalid ingestion request', {
        error: error.errors,
        route: '/api/ingest',
        duration
      });
      
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    logger.logError(error as Error, {
      route: '/api/ingest',
      duration
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Ingestion API endpoint',
    methods: ['POST'],
    description: 'Send a POST request to trigger document ingestion',
    sources: ['pubmed', 'nccih', 'manual']
  });
}
