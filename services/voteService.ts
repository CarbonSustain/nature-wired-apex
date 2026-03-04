import {
  CampaignVote,
  HederaInfo,
  GetCampaignVotesResponse,
  GetHederaInfoResponse,
} from '../types/vote';

const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
const VOTE_URL = `${API_BASE}/vote`;

export class VoteService {
  /**
   * Get campaign votes for a specific campaign and user
   */
  static async getCampaignVotes(campaignId: number, userId: number): Promise<CampaignVote[]> {
    const response = await fetch(`${VOTE_URL}/campaign-votes/${campaignId}?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result: GetCampaignVotesResponse = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch campaign votes');
    }
    
    return result.data || [];
  }

  /**
   * Get hedera information for a specific campaign and user
   */
  static async getHederaInfo(campaignId: number, userId: number): Promise<HederaInfo | null> {
    const response = await fetch(`${VOTE_URL}/hedera/${campaignId}?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result: GetHederaInfoResponse = await response.json();
    if (!response.ok) {
      // If hedera info doesn't exist, return null instead of throwing error
      if (response.status === 404) {
        return null;
      }
      throw new Error(result.message || 'Failed to fetch hedera information');
    }
    
    return result.data || null;
  }

  /**
   * Get approved campaigns with their votes and hedera information
   */
  static async getApprovedCampaigns(userId: number): Promise<any[]> {
    try {
      // First get all campaigns
      const campaignsResponse = await fetch(`${API_BASE}/campaign`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!campaignsResponse.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      
      const campaignsData = await campaignsResponse.json();
      const campaigns = campaignsData.data || [];
      
      // Filter for approved campaigns (you may need to adjust this based on your status logic)
      const approvedCampaigns = campaigns.filter((campaign: any) => 
        campaign.campaignStatusId === 3 || campaign.status === 'Approved' // Adjust based on your status mapping
      );
      
      // For each approved campaign, fetch votes and hedera info
      const enrichedCampaigns = await Promise.all(
        approvedCampaigns.map(async (campaign: any) => {
          try {
            const [votes, hederaInfo] = await Promise.all([
              this.getCampaignVotes(campaign.id, userId),
              this.getHederaInfo(campaign.id, userId)
            ]);
            
            return {
              ...campaign,
              votes,
              hederaInfo
            };
          } catch (error) {
            console.error(`Error fetching data for campaign ${campaign.id}:`, error);
            return {
              ...campaign,
              votes: [],
              hederaInfo: null
            };
          }
        })
      );
      
      return enrichedCampaigns;
    } catch (error) {
      console.error('Error fetching approved campaigns:', error);
      throw error;
    }
  }
} 