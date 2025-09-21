#!/usr/bin/env tsx

import { supabaseAdmin } from '../lib/db';
import { logger } from '../lib/logging';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  try {
    logger.info('Setting up database schema...');

    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            logger.debug('Skipping statement (already exists)', { statement: statement.substring(0, 50) + '...' });
            successCount++;
          } else {
            logger.logError(error as Error, { 
              operation: 'execute_schema_statement',
              statement: statement.substring(0, 100) + '...'
            });
            errorCount++;
          }
        } else {
          successCount++;
          logger.debug('Executed statement successfully', { statement: statement.substring(0, 50) + '...' });
        }
      } catch (error) {
        logger.logError(error as Error, { 
          operation: 'execute_schema_statement',
          statement: statement.substring(0, 100) + '...'
        });
        errorCount++;
      }
    }

    logger.info('Database schema setup completed', {
      totalStatements: statements.length,
      successCount,
      errorCount
    });

    if (errorCount > 0) {
      logger.warn('Some schema statements failed', { errorCount });
    }

    // Test the setup by checking if tables exist
    const { data: tables, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['documents', 'chunks', 'citations']);

    if (tableError) {
      logger.logError(tableError as Error, { operation: 'check_tables' });
    } else {
      logger.info('Database tables verified', { 
        tables: tables?.map(t => t.table_name) || [] 
      });
    }

  } catch (error) {
    logger.logError(error as Error, { operation: 'setup_database' });
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase()
    .then(() => {
      logger.info('Database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.logError(error as Error, { operation: 'setup_database_main' });
      process.exit(1);
    });
}
