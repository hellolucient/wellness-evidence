#!/usr/bin/env tsx

import { supabaseAdmin } from '../lib/db';
import { ragService } from '../lib/rag';
import { logger } from '../lib/logging';
import { Document } from '../types';

// Mock PubMed data for seeding
const mockDocuments: Document[] = [
  {
    id: 'pubmed-001',
    title: 'Effectiveness of Mindfulness-Based Stress Reduction on Anxiety and Depression: A Meta-Analysis',
    abstract: 'This meta-analysis examined the effectiveness of mindfulness-based stress reduction (MBSR) on anxiety and depression across 47 randomized controlled trials involving 3,515 participants. Results showed significant reductions in anxiety (g = 0.63, 95% CI [0.57, 0.69]) and depression (g = 0.59, 95% CI [0.53, 0.65]) compared to control groups. The effects were maintained at follow-up assessments.',
    authors: ['Smith, J.A.', 'Johnson, B.C.', 'Williams, D.E.'],
    journal: 'Journal of Clinical Psychology',
    publicationDate: '2023-01-15',
    doi: '10.1002/jclp.23456',
    pmid: '12345678',
    studyType: 'Meta-Analysis',
    sampleSize: 3515,
    conflictsOfInterest: [],
    keywords: ['mindfulness', 'anxiety', 'depression', 'meta-analysis', 'stress reduction'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pubmed-002',
    title: 'Yoga for Chronic Low Back Pain: A Randomized Controlled Trial',
    abstract: 'A 12-week randomized controlled trial examined the effects of yoga on chronic low back pain in 320 participants. The yoga group showed significant improvements in pain intensity (p < 0.001), functional disability (p < 0.001), and quality of life (p = 0.003) compared to the control group. Benefits were maintained at 6-month follow-up.',
    authors: ['Brown, K.L.', 'Davis, M.R.', 'Wilson, A.S.'],
    journal: 'Pain Medicine',
    publicationDate: '2023-03-20',
    doi: '10.1093/pm/pnac123',
    pmid: '87654321',
    studyType: 'Randomized Controlled Trial',
    sampleSize: 320,
    conflictsOfInterest: [],
    keywords: ['yoga', 'chronic pain', 'low back pain', 'randomized controlled trial'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pubmed-003',
    title: 'Meditation and Cardiovascular Health: A Systematic Review',
    abstract: 'This systematic review analyzed 23 studies investigating the effects of meditation on cardiovascular health. Meta-analysis revealed significant reductions in systolic blood pressure (mean difference: -4.8 mmHg, 95% CI [-7.2, -2.4]) and diastolic blood pressure (mean difference: -2.9 mmHg, 95% CI [-4.5, -1.3]) in meditation groups compared to controls.',
    authors: ['Garcia, P.M.', 'Lee, S.H.', 'Chen, W.'],
    journal: 'American Journal of Cardiology',
    publicationDate: '2023-02-10',
    doi: '10.1016/j.amjcard.2023.01.045',
    pmid: '98765432',
    studyType: 'Systematic Review',
    sampleSize: 1847,
    conflictsOfInterest: [],
    keywords: ['meditation', 'cardiovascular', 'blood pressure', 'systematic review'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pubmed-004',
    title: 'Acupuncture for Migraine Prevention: A Multicenter Randomized Trial',
    abstract: 'A multicenter randomized controlled trial evaluated acupuncture for migraine prevention in 480 patients. The acupuncture group experienced 2.3 fewer migraine days per month (95% CI [1.8, 2.8]) compared to the control group. Response rate was 68% in the acupuncture group versus 23% in controls (p < 0.001).',
    authors: ['Zhang, L.', 'Kim, J.H.', 'Anderson, R.T.'],
    journal: 'Headache',
    publicationDate: '2023-04-05',
    doi: '10.1111/head.14456',
    pmid: '11223344',
    studyType: 'Randomized Controlled Trial',
    sampleSize: 480,
    conflictsOfInterest: ['Funding from acupuncture equipment manufacturer'],
    keywords: ['acupuncture', 'migraine', 'prevention', 'randomized trial'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pubmed-005',
    title: 'Exercise and Mental Health: A Cohort Study of 10,000 Adults',
    abstract: 'A 5-year cohort study followed 10,000 adults to examine the relationship between exercise and mental health. Regular exercisers had 25% lower odds of developing depression (OR = 0.75, 95% CI [0.68, 0.82]) and 30% lower odds of anxiety disorders (OR = 0.70, 95% CI [0.63, 0.78]) compared to sedentary individuals.',
    authors: ['Thompson, E.M.', 'Rodriguez, A.C.', 'Patel, N.K.'],
    journal: 'Journal of Psychiatric Research',
    publicationDate: '2023-01-30',
    doi: '10.1016/j.jpsychires.2023.01.012',
    pmid: '55667788',
    studyType: 'Cohort Study',
    sampleSize: 10000,
    conflictsOfInterest: [],
    keywords: ['exercise', 'mental health', 'depression', 'anxiety', 'cohort study'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Check if documents already exist
    const { data: existingDocs, error: checkError } = await supabaseAdmin
      .from('documents')
      .select('id')
      .limit(1);

    if (checkError) {
      logger.logError(checkError as Error, { operation: 'check_existing_documents' });
      throw checkError;
    }

    if (existingDocs && existingDocs.length > 0) {
      logger.warn('Database already contains documents. Skipping seeding.');
      return;
    }

    // Insert documents
    let processedCount = 0;
    let errorCount = 0;

    for (const document of mockDocuments) {
      try {
        await ragService.ingestDocument(document);
        processedCount++;
        logger.info(`Processed document: ${document.title}`);
      } catch (error) {
        errorCount++;
        logger.logError(error as Error, { 
          operation: 'seed_document',
          documentId: document.id 
        });
      }
    }

    logger.info('Database seeding completed', {
      totalDocuments: mockDocuments.length,
      processedCount,
      errorCount
    });

    if (errorCount > 0) {
      logger.warn('Some documents failed to process', { errorCount });
    }

  } catch (error) {
    logger.logError(error as Error, { operation: 'seed_database' });
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.logError(error as Error, { operation: 'seed_database_main' });
      process.exit(1);
    });
}
