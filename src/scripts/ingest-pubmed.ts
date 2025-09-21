#!/usr/bin/env tsx

import { ragService } from '../lib/rag';
import { logger } from '../lib/logging';
import { Document } from '../types';

// Mock PubMed API integration
// In production, this would use the actual PubMed E-utilities API
async function fetchFromPubMed(query: string, limit: number = 10): Promise<Document[]> {
  logger.info(`Fetching from PubMed: "${query}" (limit: ${limit})`);
  
  // Mock implementation - in production you would:
  // 1. Call PubMed E-utilities API (esearch + efetch)
  // 2. Parse XML responses
  // 3. Extract metadata and abstracts
  // 4. Handle rate limiting and pagination
  
  const mockResults: Document[] = [
    {
      id: `pubmed-${Date.now()}-1`,
      title: `Effect of ${query} on Health Outcomes: A Systematic Review`,
      abstract: `This systematic review examined the effects of ${query} on various health outcomes across multiple studies. The analysis included randomized controlled trials and observational studies. Results showed significant improvements in primary outcomes with moderate effect sizes.`,
      authors: ['Research Team A', 'Smith, J.', 'Johnson, B.'],
      journal: 'Journal of Evidence-Based Medicine',
      publicationDate: '2023-06-15',
      doi: `10.1000/jebm.${Date.now()}`,
      pmid: `${Math.floor(Math.random() * 90000000) + 10000000}`,
      studyType: 'Systematic Review',
      sampleSize: Math.floor(Math.random() * 2000) + 100,
      conflictsOfInterest: [],
      keywords: query.toLowerCase().split(' ').concat(['systematic review', 'health outcomes']),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `pubmed-${Date.now()}-2`,
      title: `Randomized Controlled Trial of ${query} Intervention`,
      abstract: `A randomized controlled trial evaluated the effectiveness of ${query} intervention in 250 participants over 12 weeks. The intervention group showed significant improvements compared to the control group in primary and secondary outcomes.`,
      authors: ['Clinical Research Group', 'Davis, M.', 'Wilson, R.'],
      journal: 'Clinical Trials Journal',
      publicationDate: '2023-05-20',
      doi: `10.2000/ctj.${Date.now()}`,
      pmid: `${Math.floor(Math.random() * 90000000) + 10000000}`,
      studyType: 'Randomized Controlled Trial',
      sampleSize: 250,
      conflictsOfInterest: [],
      keywords: query.toLowerCase().split(' ').concat(['randomized controlled trial', 'intervention']),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  return mockResults.slice(0, limit);
}

async function ingestFromPubMed(query: string, limit: number = 10) {
  try {
    logger.info('Starting PubMed ingestion...', { query, limit });

    // Fetch documents from PubMed
    const documents = await fetchFromPubMed(query, limit);

    if (documents.length === 0) {
      logger.warn('No documents found for query', { query });
      return;
    }

    // Process each document
    let processedCount = 0;
    let errorCount = 0;

    for (const document of documents) {
      try {
        await ragService.ingestDocument(document);
        processedCount++;
        logger.info(`Ingested document: ${document.title}`);
      } catch (error) {
        errorCount++;
        logger.logError(error as Error, { 
          operation: 'ingest_document',
          documentId: document.id 
        });
      }
    }

    logger.info('PubMed ingestion completed', {
      query,
      totalDocuments: documents.length,
      processedCount,
      errorCount
    });

    if (errorCount > 0) {
      logger.warn('Some documents failed to ingest', { errorCount });
    }

  } catch (error) {
    logger.logError(error as Error, { operation: 'ingest_from_pubmed' });
    process.exit(1);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: tsx ingest-pubmed.ts <query> [limit]');
    console.log('Example: tsx ingest-pubmed.ts "meditation anxiety" 5');
    process.exit(1);
  }

  const query = args[0];
  const limit = args[1] ? parseInt(args[1], 10) : 10;

  if (isNaN(limit) || limit < 1 || limit > 100) {
    console.error('Limit must be a number between 1 and 100');
    process.exit(1);
  }

  await ingestFromPubMed(query, limit);
}

// Run the ingestion
if (require.main === module) {
  main()
    .then(() => {
      logger.info('PubMed ingestion completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.logError(error as Error, { operation: 'ingest_pubmed_main' });
      process.exit(1);
    });
}
