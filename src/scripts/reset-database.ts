#!/usr/bin/env tsx

import { supabaseAdmin } from '../lib/db';
import { logger } from '../lib/logging';

async function resetDatabase() {
  try {
    logger.info('Starting database reset...');

    // Delete all citations first (foreign key constraint)
    const { error: citationsError } = await supabaseAdmin
      .from('citations')
      .delete()
      .neq('id', 'dummy'); // Delete all records

    if (citationsError) {
      logger.logError(citationsError as Error, { operation: 'delete_citations' });
      throw citationsError;
    }

    // Delete all chunks
    const { error: chunksError } = await supabaseAdmin
      .from('chunks')
      .delete()
      .neq('id', 'dummy'); // Delete all records

    if (chunksError) {
      logger.logError(chunksError as Error, { operation: 'delete_chunks' });
      throw chunksError;
    }

    // Delete all documents
    const { error: documentsError } = await supabaseAdmin
      .from('documents')
      .delete()
      .neq('id', 'dummy'); // Delete all records

    if (documentsError) {
      logger.logError(documentsError as Error, { operation: 'delete_documents' });
      throw documentsError;
    }

    logger.info('Database reset completed successfully');

  } catch (error) {
    logger.logError(error as Error, { operation: 'reset_database' });
    process.exit(1);
  }
}

// Run the reset
if (require.main === module) {
  resetDatabase()
    .then(() => {
      logger.info('Database reset completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.logError(error as Error, { operation: 'reset_database_main' });
      process.exit(1);
    });
}
