export interface AIAnalysisResult {
  name: string;
  category: string;
  description: string;
  tags: string[];
  specifications?: Record<string, any>;
  confidence: number;
  needsReview: boolean;
  alternativeNames?: string[];
}
