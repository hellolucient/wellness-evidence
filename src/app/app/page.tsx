'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { ResultCard } from '@/components/ResultCard';
import { EvidenceCard } from '@/components/EvidenceBadge';
import { LoadingState, EmptyState, ErrorState, SkeletonCard } from '@/components/LoadingState';
import { QueryResult } from '@/types';
import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAnswer = async () => {
    if (!results?.answer) return;
    
    try {
      await navigator.clipboard.writeText(results.answer);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadAnswer = () => {
    if (!results?.answer) return;
    
    const blob = new Blob([results.answer], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wellness-evidence-${query.replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Wellness Evidence Search
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Search for evidence-based wellness information from peer-reviewed research
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar 
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder="e.g., 'Does meditation reduce anxiety?' or 'Benefits of yoga for back pain'"
          />
        </div>

        {/* Results */}
        <div className="space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <LoadingState message="Searching research databases..." />
              <div className="grid gap-4 md:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          )}

          {error && (
            <ErrorState 
              error={error}
              onRetry={() => handleSearch(query)}
            />
          )}

          {results && (
            <>
              {/* Answer Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Evidence-Based Answer</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyAnswer}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadAnswer}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                      {results.answer}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Evidence Assessment */}
              <EvidenceCard
                strength={results.evidenceStrength}
                score={85} // This would come from the actual grading
                reasoning="Based on meta-analyses and randomized controlled trials with large sample sizes"
              />

              {/* Search Metadata */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Found {results.documents.length} relevant studies in {results.searchMetadata.searchTime}ms
              </div>

              {/* Results Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {results.documents.map((document) => (
                  <ResultCard
                    key={document.id}
                    document={document}
                    citations={results.citations}
                  />
                ))}
              </div>
            </>
          )}

          {!isLoading && !error && !results && query && (
            <EmptyState
              title="No evidence found"
              description="Try rephrasing your question or using different keywords."
            />
          )}

          {!isLoading && !error && !results && !query && (
            <EmptyState
              title="Start your search"
              description="Enter a wellness question above to find evidence-based answers from research."
            />
          )}
        </div>
      </div>
    </div>
  );
}
