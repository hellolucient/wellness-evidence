-- Wellness Evidence Database Schema
-- This file contains the complete database schema for the Wellness Evidence application

-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the documents table
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    authors TEXT[] NOT NULL DEFAULT '{}',
    journal TEXT NOT NULL,
    publication_date DATE NOT NULL,
    doi TEXT,
    pmid TEXT,
    url TEXT,
    study_type TEXT NOT NULL,
    sample_size INTEGER,
    conflicts_of_interest TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the chunks table for document chunks and embeddings
CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimensions
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the citations table for tracking citations in answers
CREATE TABLE IF NOT EXISTS citations (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id TEXT NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_publication_date ON documents(publication_date);
CREATE INDEX IF NOT EXISTS idx_documents_study_type ON documents(study_type);
CREATE INDEX IF NOT EXISTS idx_documents_keywords ON documents USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_citations_document_id ON citations(document_id);
CREATE INDEX IF NOT EXISTS idx_citations_chunk_id ON citations(chunk_id);

-- Create a function for vector similarity search
CREATE OR REPLACE FUNCTION search_chunks(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id TEXT,
    document_id TEXT,
    content TEXT,
    chunk_index INTEGER,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE SQL
AS $$
    SELECT
        chunks.id,
        chunks.document_id,
        chunks.content,
        chunks.chunk_index,
        chunks.metadata,
        1 - (chunks.embedding <=> query_embedding) AS similarity
    FROM chunks
    WHERE chunks.embedding IS NOT NULL
    AND 1 - (chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY chunks.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
-- Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (for the MVP)
CREATE POLICY "Allow public read access to documents" ON documents
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to chunks" ON chunks
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to citations" ON citations
    FOR SELECT USING (true);

-- Create policies for service role (for ingestion)
CREATE POLICY "Allow service role full access to documents" ON documents
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to chunks" ON chunks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to citations" ON citations
    FOR ALL USING (auth.role() = 'service_role');

-- Insert some sample data for testing
INSERT INTO documents (
    id, title, abstract, authors, journal, publication_date, 
    study_type, sample_size, keywords
) VALUES (
    'sample-001',
    'Effectiveness of Meditation for Stress Reduction: A Meta-Analysis',
    'This meta-analysis examined the effectiveness of meditation on stress reduction across 47 randomized controlled trials involving 3,515 participants. Results showed significant reductions in stress levels (g = 0.63, 95% CI [0.57, 0.69]) compared to control groups.',
    ARRAY['Smith, J.A.', 'Johnson, B.C.', 'Williams, D.E.'],
    'Journal of Clinical Psychology',
    '2023-01-15',
    'Meta-Analysis',
    3515,
    ARRAY['meditation', 'stress', 'meta-analysis', 'mindfulness']
) ON CONFLICT (id) DO NOTHING;

-- Create a view for easy querying of documents with their chunk counts
CREATE OR REPLACE VIEW documents_with_chunks AS
SELECT 
    d.*,
    COUNT(c.id) as chunk_count,
    MAX(c.created_at) as last_chunk_created
FROM documents d
LEFT JOIN chunks c ON d.id = c.document_id
GROUP BY d.id;

-- Create a view for search results with document information
CREATE OR REPLACE VIEW search_results AS
SELECT 
    c.id as chunk_id,
    c.document_id,
    c.content,
    c.chunk_index,
    c.metadata,
    d.title,
    d.authors,
    d.journal,
    d.publication_date,
    d.study_type,
    d.sample_size,
    d.doi,
    d.pmid
FROM chunks c
JOIN documents d ON c.document_id = d.id
WHERE c.embedding IS NOT NULL;
