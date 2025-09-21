export interface Document {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  doi?: string;
  pmid?: string;
  url?: string;
  studyType: StudyType;
  sampleSize?: number;
  conflictsOfInterest?: string[];
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
  metadata: ChunkMetadata;
  createdAt: string;
}

export interface ChunkMetadata {
  section: 'abstract' | 'methods' | 'results' | 'discussion' | 'conclusion';
  pageNumber?: number;
  wordCount: number;
}

export interface Citation {
  id: string;
  documentId: string;
  chunkId: string;
  text: string;
  position: number;
}

export interface QueryResult {
  answer: string;
  citations: Citation[];
  evidenceStrength: EvidenceStrength;
  documents: Document[];
  chunks: Chunk[];
  searchMetadata: SearchMetadata;
}

export interface SearchMetadata {
  query: string;
  totalResults: number;
  searchTime: number;
  embeddingTime: number;
  retrievalTime: number;
  generationTime: number;
}

export type EvidenceStrength = 'Strong' | 'Moderate' | 'Weak' | 'Insufficient';

export type StudyType = 
  | 'Meta-Analysis'
  | 'Systematic Review'
  | 'Randomized Controlled Trial'
  | 'Cohort Study'
  | 'Case-Control Study'
  | 'Cross-Sectional Study'
  | 'Case Study'
  | 'Review'
  | 'Other';

export interface EvidenceGrade {
  strength: EvidenceStrength;
  score: number; // 0-100
  factors: {
    studyTypes: StudyType[];
    sampleSizes: number[];
    recency: number; // years since publication
    conflictsOfInterest: boolean;
    metaAnalysisPresent: boolean;
    rctPresent: boolean;
  };
  reasoning: string;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  filters?: SearchFilters;
}

export interface SearchFilters {
  studyTypes?: StudyType[];
  dateRange?: {
    start: string;
    end: string;
  };
  minSampleSize?: number;
  excludeConflicts?: boolean;
}

export interface IngestRequest {
  source: 'pubmed' | 'nccih' | 'manual';
  query?: string;
  limit?: number;
  forceReingest?: boolean;
}

export interface IngestResult {
  success: boolean;
  documentsProcessed: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  errors: string[];
  duration: number;
}
