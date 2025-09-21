// Prompt templates for different AI operations

export const PROMPTS = {
  SYSTEM_PROMPTS: {
    ANSWER_GENERATION: `You are an expert in evidence-based wellness research. Your task is to provide accurate, concise answers based on the provided research context. 

Guidelines:
- Always cite sources using inline numeric citations [1], [2], etc.
- Be objective and highlight any limitations or conflicting evidence
- Focus on actionable insights when appropriate
- If evidence is insufficient, clearly state this
- Use clear, accessible language while maintaining scientific accuracy
- Structure your response logically with clear conclusions`,

    EVIDENCE_GRADING: `You are an expert in evidence grading for wellness research. Rate evidence strength based on:

Study Quality Hierarchy (highest to lowest):
1. Meta-analyses and systematic reviews
2. Randomized controlled trials (RCTs)
3. Cohort studies
4. Case-control studies
5. Cross-sectional studies
6. Case studies

Additional Factors:
- Sample sizes (larger is better)
- Recency (newer is better, within 5 years preferred)
- Conflicts of interest (fewer is better)
- Consistency of findings across studies

Provide a score from 0-100 and brief reasoning for your assessment.`,

    CITATION_EXTRACTION: `Extract and format citations from the provided text. For each citation, provide:
- The source document title
- Authors
- Publication year
- Study type
- Key finding
- Any limitations or conflicts of interest`
  },

  USER_PROMPTS: {
    ANSWER_GENERATION: (query: string, context: string) => 
      `Query: ${query}

Research Context:
${context}

Please provide a comprehensive answer with proper citations. Focus on the most relevant and highest-quality evidence.`,

    EVIDENCE_GRADING: (documents: any[], answer: string) =>
      `Documents Summary:
${documents.map(doc => 
  `- ${doc.title} (${doc.study_type}, n=${doc.sample_size || 'N/A'}, ${new Date(doc.publication_date).getFullYear()})`
).join('\n')}

Generated Answer:
${answer}

Please grade the evidence strength and provide reasoning.`,

    CITATION_FORMATTING: (citations: any[]) =>
      `Format these citations for display:
${citations.map(citation => 
  `[${citation.position}] ${citation.text}`
).join('\n')}`
  },

  INGESTION_PROMPTS: {
    DOCUMENT_PROCESSING: `Process this research document and extract:
- Key findings
- Study methodology
- Sample characteristics
- Limitations
- Conflicts of interest
- Clinical implications`,

    CHUNK_SUMMARIZATION: `Summarize this text chunk while preserving:
- Key scientific concepts
- Quantitative data
- Methodological details
- Clinical outcomes`
  }
};

// Utility functions for prompt management
export class PromptManager {
  static formatAnswerPrompt(query: string, context: string): string {
    return PROMPTS.USER_PROMPTS.ANSWER_GENERATION(query, context);
  }

  static formatGradingPrompt(documents: any[], answer: string): string {
    return PROMPTS.USER_PROMPTS.EVIDENCE_GRADING(documents, answer);
  }

  static formatCitationPrompt(citations: any[]): string {
    return PROMPTS.USER_PROMPTS.CITATION_FORMATTING(citations);
  }

  static getSystemPrompt(type: keyof typeof PROMPTS.SYSTEM_PROMPTS): string {
    return PROMPTS.SYSTEM_PROMPTS[type];
  }
}
