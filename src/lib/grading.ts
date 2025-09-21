import { EvidenceStrength, StudyType, EvidenceGrade } from '@/types';

export class EvidenceGrader {
  private static instance: EvidenceGrader;

  static getInstance(): EvidenceGrader {
    if (!EvidenceGrader.instance) {
      EvidenceGrader.instance = new EvidenceGrader();
    }
    return EvidenceGrader.instance;
  }

  gradeEvidence(documents: any[]): EvidenceGrade {
    if (documents.length === 0) {
      return {
        strength: 'Insufficient',
        score: 0,
        factors: {
          studyTypes: [],
          sampleSizes: [],
          recency: 0,
          conflictsOfInterest: false,
          metaAnalysisPresent: false,
          rctPresent: false
        },
        reasoning: 'No evidence available'
      };
    }

    const factors = this.analyzeFactors(documents);
    const score = this.calculateScore(factors);
    const strength = this.determineStrength(score, factors);

    return {
      strength,
      score,
      factors,
      reasoning: this.generateReasoning(factors, strength)
    };
  }

  private analyzeFactors(documents: any[]) {
    const studyTypes = documents.map(doc => doc.study_type);
    const sampleSizes = documents.map(doc => doc.sample_size).filter(size => size);
    const conflictsOfInterest = documents.some(doc => 
      doc.conflicts_of_interest && doc.conflicts_of_interest.length > 0
    );

    // Calculate average recency (years since publication)
    const currentYear = new Date().getFullYear();
    const publicationYears = documents.map(doc => {
      const year = new Date(doc.publication_date).getFullYear();
      return currentYear - year;
    });
    const avgRecency = publicationYears.reduce((sum, year) => sum + year, 0) / publicationYears.length;

    return {
      studyTypes,
      sampleSizes,
      recency: avgRecency,
      conflictsOfInterest,
      metaAnalysisPresent: studyTypes.includes('Meta-Analysis'),
      rctPresent: studyTypes.includes('Randomized Controlled Trial')
    };
  }

  private calculateScore(factors: any): number {
    let score = 0;

    // Study type scoring (40 points max)
    if (factors.metaAnalysisPresent) score += 40;
    else if (factors.rctPresent) score += 30;
    else if (factors.studyTypes.includes('Systematic Review')) score += 25;
    else if (factors.studyTypes.includes('Cohort Study')) score += 20;
    else if (factors.studyTypes.includes('Case-Control Study')) score += 15;
    else score += 10;

    // Sample size scoring (25 points max)
    if (factors.sampleSizes.length > 0) {
      const avgSampleSize = factors.sampleSizes.reduce((sum: number, size: number) => sum + size, 0) / factors.sampleSizes.length;
      if (avgSampleSize >= 1000) score += 25;
      else if (avgSampleSize >= 500) score += 20;
      else if (avgSampleSize >= 100) score += 15;
      else score += 10;
    }

    // Recency scoring (20 points max)
    if (factors.recency <= 2) score += 20;
    else if (factors.recency <= 5) score += 15;
    else if (factors.recency <= 10) score += 10;
    else score += 5;

    // Conflict of interest penalty (15 points max)
    if (!factors.conflictsOfInterest) score += 15;
    else score += 5;

    return Math.min(score, 100);
  }

  private determineStrength(score: number, factors: any): EvidenceStrength {
    if (score >= 80 && factors.metaAnalysisPresent) return 'Strong';
    if (score >= 70 && (factors.metaAnalysisPresent || factors.rctPresent)) return 'Strong';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Weak';
    return 'Insufficient';
  }

  private generateReasoning(factors: any, strength: EvidenceStrength): string {
    const reasons = [];

    if (factors.metaAnalysisPresent) {
      reasons.push('Meta-analysis provides highest level of evidence');
    } else if (factors.rctPresent) {
      reasons.push('Randomized controlled trials provide strong evidence');
    }

    if (factors.sampleSizes.length > 0) {
      const avgSampleSize = factors.sampleSizes.reduce((sum: number, size: number) => sum + size, 0) / factors.sampleSizes.length;
      if (avgSampleSize >= 500) {
        reasons.push('Large sample sizes increase reliability');
      }
    }

    if (factors.recency <= 5) {
      reasons.push('Recent studies reflect current knowledge');
    }

    if (factors.conflictsOfInterest) {
      reasons.push('Some studies have conflicts of interest');
    }

    return reasons.join('; ') || 'Limited evidence available';
  }
}

export const evidenceGrader = EvidenceGrader.getInstance();
