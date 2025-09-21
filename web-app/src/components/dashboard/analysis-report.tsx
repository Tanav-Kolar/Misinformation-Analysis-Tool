
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  ShieldAlert,
  Upload,
  Info,
  Globe,
  BookCheck,
  Link,
  ShieldQuestion,
} from 'lucide-react';
import type { AnalysisResult, AnalyzedClaim, FactCheckResult } from '@/types';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

type AnalysisReportProps = {
  analysis: any;
};

export function AnalysisReport({ analysis }: AnalysisReportProps) {
  const { analysis_details, text_input, url_input, created_at } = analysis;
  const { analyzed_claims, tag, overall_summary }: AnalysisResult =
    analysis_details;

  const getTitle = () => {
    if (text_input) {
      return text_input.length > 50
        ? `${text_input.substring(0, 50)}...`
        : text_input;
    }
    if (url_input) {
      return url_input;
    }
    return 'Image Analysis';
  };

  const getClaimIcon = (conclusion: string) => {
    switch (conclusion.toLowerCase()) {
      case 'true':
        return <CheckCircle2 className="text-green-600" />;
      case 'false':
        return <ShieldAlert className="text-destructive" />;
      default:
        return <ShieldQuestion className="text-yellow-600" />;
    }
  };

  const getTagInfo = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'true':
        return {
          variant: 'default',
          className:
            'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
          icon: <CheckCircle2 className="text-green-600" />,
        };
      case 'false':
        return {
          variant: 'destructive',
          className:
            'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
          icon: <ShieldAlert className="text-destructive" />,
        };
      default:
        return {
          variant: 'secondary',
          className:
            'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
          icon: <ShieldQuestion className="text-yellow-600" />,
        };
    }
  };

  const tagInfo = getTagInfo(tag);

  const handleDownload = () => {
    let reportContent = `
Analysis Report
===============
Title: ${getTitle()}
Date: ${new Date(created_at).toLocaleDateString()}
Overall Tag: ${tag}

Overall Summary
---------------
${overall_summary}

Analyzed Claims
---------------
`;

    analyzed_claims.forEach((claim, index) => {
      reportContent += `
Claim ${index + 1}: ${claim.claim_text}
Conclusion: ${claim.conclusion}
Evidence: ${claim.web_search_results}
`;
      if (claim.fact_checking_results?.length > 0) {
        reportContent += '\nFact-Checking Results:\n';
        claim.fact_checking_results.forEach(fc => {
          reportContent += `- ${fc.source}: ${fc.summary} (${fc.url})\n`;
        });
      }
      reportContent += '---\n';
    });

    const blob = new Blob([reportContent.trim()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-report-${analysis.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {tagInfo.icon}
          Analysis Report
        </CardTitle>
        <Button variant="outline" onClick={handleDownload}>
          <Upload />
          Download Report
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <Info />
            Overall Summary
          </h3>
          <Card className={cn('transition-colors', tagInfo.className)}>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold">{getTitle()}</h4>
                <Badge variant={tagInfo.variant}>{tag}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Date: {new Date(created_at).toLocaleDateString()}
              </p>
              <Separator className="my-4" />
              <p className="text-base leading-relaxed">{overall_summary}</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <BookCheck />
            Detailed Analysis
          </h3>
          <div className="space-y-4">
            {analyzed_claims?.map((claim: AnalyzedClaim, index: number) => (
              <Card key={index} className="transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {getClaimIcon(claim.conclusion)}
                    </div>
                    <div className="flex-grow">
                      <p className="text-lg leading-snug">{claim.claim_text}</p>
                      <CardDescription className="mt-1">
                        Conclusion: {claim.conclusion}
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pl-6">
                  {claim.web_search_results && (
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 font-semibold text-muted-foreground">
                        <Globe className="size-4" />
                        Web Search Evidence
                      </h4>
                      <p className="text-sm">
                        {claim.web_search_results}
                      </p>
                    </div>
                  )}

                  {claim.fact_checking_results?.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 font-semibold text-muted-foreground">
                        <BookCheck className="size-4" />
                        Fact-Checking Results
                      </h4>
                      <div className="space-y-4">
                        {claim.fact_checking_results.map(
                          (fc: FactCheckResult, fcIndex: number) => (
                            <div
                              key={fcIndex}
                              className="rounded-md border bg-muted/30 p-4"
                            >
                              <p className="font-semibold">{fc.source}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {fc.summary}
                              </p>
                              {fc.url && (
                                <a
                                  href={fc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                                >
                                  <Link className="size-3" />
                                  View Source
                                </a>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
