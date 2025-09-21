#!/usr/bin/env tsx

import { supabaseAdmin } from '../lib/db';
import { openaiService } from '../lib/openai';
import { logger } from '../lib/logging';

async function reembedChunks() {
  try {
    logger.info('Starting chunk re-embedding...');

    // Get all chunks without embeddings or with old embeddings
    const { data: chunks, error: fetchError } = await supabaseAdmin
      .from('chunks')
      .select('id, content')
      .or('embedding.is.null,updated_at.lt.2024-01-01'); // Re-embed if no embedding or old embedding

    if (fetchError) {
      logger.logError(fetchError as Error, { operation: 'fetch_chunks_for_reembedding' });
      throw fetchError;
    }

    if (!chunks || chunks.length === 0) {
      logger.info('No chunks found that need re-embedding');
      return;
    }

    logger.info(`Found ${chunks.length} chunks to re-embed`);

    // Process chunks in batches to avoid rate limits
    const batchSize = 10;
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      try {
        // Generate embeddings for the batch
        const contents = batch.map(chunk => chunk.content);
        const embeddings = await openaiService.generateEmbeddings(contents);

        // Update chunks with new embeddings
        const updates = batch.map((chunk, index) => ({
          id: chunk.id,
          embedding: embeddings[index],
          updated_at: new Date().toISOString()
        }));

        const { error: updateError } = await supabaseAdmin
          .from('chunks')
          .upsert(updates);

        if (updateError) {
          logger.logError(updateError as Error, { operation: 'update_chunk_embeddings' });
          errorCount += batch.length;
        } else {
          processedCount += batch.length;
          logger.info(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
        }

        // Add a small delay to avoid rate limits
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        logger.logError(error as Error, { 
          operation: 'process_reembedding_batch',
          batchStart: i,
          batchSize: batch.length
        });
        errorCount += batch.length;
      }
    }

    logger.info('Chunk re-embedding completed', {
      totalChunks: chunks.length,
      processedCount,
      errorCount
    });

    if (errorCount > 0) {
      logger.warn('Some chunks failed to re-embed', { errorCount });
    }

  } catch (error) {
    logger.logError(error as Error, { operation: 'reembed_chunks' });
    process.exit(1);
  }
}

// Run the re-embedding
if (require.main === module) {
  reembedChunks()
    .then(() => {
      logger.info('Re-embedding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.logError(error as Error, { operation: 'reembed_chunks_main' });
      process.exit(1);
    });
}
