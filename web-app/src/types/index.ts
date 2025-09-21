
export type FactCheckResult = {
  source: string;
  url: string;
  summary: string;
};

export type AnalyzedClaim = {
  claim_text: string;
  web_search_results: string;
  fact_checking_results: FactCheckResult[];
  conclusion: string;
};

export type AnalysisResult = {
  analyzed_claims: AnalyzedClaim[];
  tag: string;
  overall_summary: string;
};
