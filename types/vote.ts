export interface CampaignVote {
  id: number;
  campaignId: number;
  userId: number;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  // Add other fields as needed based on your API response
}

export interface HederaInfo {
  campaignId: number;
  hash: string;
  transactionId: string;
  timestamp: string;
  status: string;
  // Add other fields as needed based on your API response
}

export interface GetCampaignVotesResponse {
  message?: string;
  data: CampaignVote[];
}

export interface GetHederaInfoResponse {
  message?: string;
  data: HederaInfo;
}

export interface ApprovedCampaign {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  votes: CampaignVote[];
  hederaInfo?: HederaInfo;
} 