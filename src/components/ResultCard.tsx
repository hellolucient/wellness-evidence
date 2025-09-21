'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Document, Citation } from '@/types';
import { ExternalLink, Calendar, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultCardProps {
  document: Document;
  citations: Citation[];
  className?: string;
}

export function ResultCard({ document, citations, className }: ResultCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAuthors = (authors: string[]) => {
    if (authors.length <= 2) {
      return authors.join(', ');
    }
    return `${authors[0]} et al.`;
  };

  const relevantCitations = citations.filter(citation => 
    citation.documentId === document.id
  );

  return (
    <Card className={cn("w-full hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg leading-tight">
            {document.title}
          </CardTitle>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="text-xs">
              {document.studyType}
            </Badge>
            {document.doi && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => window.open(`https://doi.org/${document.doi}`, '_blank')}
                aria-label="Open DOI"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{formatAuthors(document.authors)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(document.publicationDate)}</span>
          </div>
          {document.sampleSize && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>n={document.sampleSize}</span>
            </div>
          )}
        </div>

        <div className="text-sm leading-relaxed">
          <p className="line-clamp-3">{document.abstract}</p>
        </div>

        {document.conflictsOfInterest && document.conflictsOfInterest.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Conflicts of Interest:
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {document.conflictsOfInterest.join(', ')}
            </p>
          </div>
        )}

        {document.keywords && document.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.keywords.slice(0, 5).map((keyword, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {document.keywords.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{document.keywords.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {relevantCitations.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Relevant Citations:</p>
            <div className="space-y-2">
              {relevantCitations.map((citation, index) => (
                <div key={citation.id} className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    [{citation.position}]
                  </span>
                  <span className="ml-2">{citation.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
