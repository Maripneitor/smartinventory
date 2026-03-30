export interface AIAnalysisResult {
  name: string;
  category: string;
  confidence: number;
  suggestedTags: string[];
  description: string;
}
