'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EvidenceStrength } from '@/types';
import { cn } from '@/lib/utils';

interface EvidenceBadgeProps {
  strength: EvidenceStrength;
  className?: string;
}

const strengthConfig = {
  Strong: {
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    label: 'Strong Evidence'
  },
  Moderate: {
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    label: 'Moderate Evidence'
  },
  Weak: {
    variant: 'outline' as const,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    label: 'Weak Evidence'
  },
  Insufficient: {
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    label: 'Insufficient Evidence'
  }
};

export function EvidenceBadge({ strength, className }: EvidenceBadgeProps) {
  const config = strengthConfig[strength];
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

interface EvidenceCardProps {
  strength: EvidenceStrength;
  score: number;
  reasoning: string;
  className?: string;
}

export function EvidenceCard({ strength, score, reasoning, className }: EvidenceCardProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Evidence Assessment</CardTitle>
          <EvidenceBadge strength={strength} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Score:</span>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-sm font-mono">{score}/100</span>
        </div>
        <div>
          <span className="text-sm font-medium">Reasoning:</span>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
