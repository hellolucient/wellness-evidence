import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ragService } from '@/lib/rag';
import { logger } from '@/lib/logging';
import { SearchRequest } from '@/types';

const SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().min(1).max(50).optional(),
  filters: z.object({
    studyTypes: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    minSampleSize: z.number().min(1).optional(),
    excludeConflicts: z.boolean().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const validatedData = SearchRequestSchema.parse(body);
    
    logger.info('Search request received', {
      query: validatedData.query,
      limit: validatedData.limit,
      route: '/api/search'
    });

    const result = await ragService.search(validatedData as SearchRequest);
    
    const duration = Date.now() - startTime;
    
    logger.logRequest('POST', '/api/search', duration, 200);
    
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        duration
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      logger.warn('Invalid search request', {
        error: error.errors,
        route: '/api/search',
        duration
      });
      
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    logger.logError(error as Error, {
      route: '/api/search',
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
    message: 'Search API endpoint',
    methods: ['POST'],
    description: 'Send a POST request with query and optional filters'
  });
}
