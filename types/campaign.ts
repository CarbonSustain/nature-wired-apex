export interface Campaign {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  // Add other fields as needed
}

export type VotingStyle = 'TOKEN_BASED' | 'STORY_FEATURE' | 'THEMED_BADGES';

export interface GetCampaignsResponse {
  message?: string;
  data: Campaign[];
}

export interface GetCampaignResponse {
  message?: string;
  data?: Campaign;
}
