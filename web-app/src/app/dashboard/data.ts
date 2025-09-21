
export type AnalysisStatus = 'verified' | 'flagged' | 'unverifiable';

export type AnalysisHistoryItem = {
  id: number;
  title: string;
  type: string;
  date: string;
  confidence: number;
  status: AnalysisStatus;
};

export const analysisHistory: AnalysisHistoryItem[] = [
  {
    id: 1,
    title: 'Climate change article from news site',
    type: 'Url',
    date: '2025-09-18',
    confidence: 92,
    status: 'verified',
  },
  {
    id: 2,
    title: 'Social media image about vaccines',
    type: 'Image',
    date: '2025-09-17',
    confidence: 15,
    status: 'flagged',
  },
  {
    id: 3,
    title: 'Health claim about natural remedies',
    type: 'Text',
    date: '2025-09-16',
    confidence: 45,
    status: 'unverifiable',
  },
  {
    id: 4,
    title: 'Economic forecast video',
    type: 'Video',
    date: '2025-09-15',
    confidence: 78,
    status: 'verified',
  },
];

export const sources = [
  {
    name: 'Reuters Fact Check',
    description: 'Comprehensive fact-checking analysis',
  },
  {
    name: 'Associated Press',
    description: 'Original reporting and verification',
  },
];

export const trendsData = [
  { month: 'Jan', Politics: 120, Health: 150, Finance: 110 },
  { month: 'Feb', Politics: 140, Health: 130, Finance: 120 },
  { month: 'Mar', Politics: 160, Health: 180, Finance: 130 },
  { month: 'Apr', Politics: 180, Health: 160, Finance: 140 },
  { month: 'May', Politics: 200, Health: 190, Finance: 150 },
  { month: 'Jun', Politics: 220, Health: 210, Finance: 170 },
  { month: 'Jul', Politics: 250, Health: 200, Finance: 180 },
  { month: 'Aug', Politics: 230, Health: 220, Finance: 190 },
  { month: 'Sep', Politics: 200, Health: 240, Finance: 200 },
];
