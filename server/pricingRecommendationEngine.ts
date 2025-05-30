import Anthropic from '@anthropic-ai/sdk';
import { Campaign, PricingRecommendation, AdMethod } from '@shared/schema';
import { storage } from './storage';

// Initialize Anthropic client
const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025

interface BusinessCampaignWithROI {
  id: number;
  businessId: number;
  businessName: string;
  adMethodId: number;
  adMethodName: string;
  amount: number; // Spent on campaign
  revenue: number; // Earned from campaign
  roi: number; // ROI as percentage
  startDate: Date;
  endDate?: Date | null;
  active: boolean;
}

interface GeographicData {
  latitude: number;
  longitude: number;
  zipCode: string;
  radius: number; // In miles
}

interface UserMetrics {
  averageRoi: number;
  totalSpent: number;
  totalEarned: number;
  activeCampaigns: number;
  totalCampaigns: number;
}

interface PricingRecommendationRequest {
  userId: number;
  businessId: number;
  businessName: string;
  businessType: string;
  campaigns: Campaign[];
  adMethods: AdMethod[];
  topPerformers: BusinessCampaignWithROI[];
  adMethodId: number;
  userMetrics: UserMetrics;
  geographicData?: GeographicData;
}

interface PricingRecommendationResponse {
  success: boolean;
  error?: string;
  recommendations?: Omit<PricingRecommendation, 'id'>[];
}

export async function generatePricingRecommendations(
  request: PricingRecommendationRequest
): Promise<PricingRecommendationResponse> {
  try {
    // Ensure the API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        success: false,
        error: 'API key not configured. Please contact support.',
      };
    }

    // Find the requested ad method
    const adMethod = request.adMethods.find(method => method.id === request.adMethodId);
    if (!adMethod) {
      return {
        success: false,
        error: 'Invalid ad method specified',
      };
    }

    // Get historical performance for this business and ad method
    const historicalCampaigns = request.campaigns.filter(
      campaign => campaign.adMethodId === request.adMethodId
    );

    // Get competitor performance for this ad method
    const competitorCampaigns = request.topPerformers.filter(
      campaign => campaign.adMethodId === request.adMethodId
    );

    // Prepare the prompt for Anthropic
    const prompt = generatePrompt(
      request.businessName,
      request.businessType,
      adMethod.name,
      historicalCampaigns,
      competitorCampaigns,
      request.userMetrics
    );

    // Call Anthropic API
    const response = await anthropicClient.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      system: 'You are an AI assistant that specializes in pricing recommendations for advertising campaigns. You provide detailed, actionable recommendations based on historical data and market trends. Format your responses as JSON.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse the response
    const responseBlock = response.content[0];
    if (!responseBlock || responseBlock.type !== 'text') {
      console.error('Invalid response format from Anthropic API');
      return {
        success: false,
        error: 'Failed to generate pricing recommendation (invalid response format)',
      };
    }
    
    const responseContent = responseBlock.text;
    
    // Extract the JSON from the response
    const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || 
                      responseContent.match(/{[\s\S]*}/);
                      
    if (!jsonMatch) {
      console.error('Failed to extract JSON from response:', responseContent);
      return {
        success: false,
        error: 'Failed to generate pricing recommendation (invalid format)',
      };
    }
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse recommendation JSON:', error);
      return {
        success: false,
        error: 'Failed to parse recommendation data',
      };
    }

    // Create timestamp for records
    const now = new Date();
    
    // Create recommendation objects using expected schema
    const recommendations = [
      {
        businessId: request.businessId,
        userId: request.userId,
        adMethodId: request.adMethodId,
        businessType: request.businessType,
        recommendedBudget: (parsedResponse.suggestedBudget || 500).toFixed(2),
        recommendedBidAmount: ((parsedResponse.suggestedBudget || 500) * 0.2).toFixed(2),
        expectedRoi: (parsedResponse.expectedROI || request.userMetrics.averageRoi).toFixed(2),
        confidenceScore: '0.90',
        rationale: parsedResponse.rationale || `Based on your historical performance and market data, a budget of $${(parsedResponse.suggestedBudget || 500).toFixed(2)} is recommended for ${adMethod.name} campaigns.`,
        scenarioBudgets: JSON.stringify({
          low: {
            budget: (parsedResponse.budgetRange?.min || (parsedResponse.suggestedBudget * 0.8) || 400).toFixed(2),
            expectedRoi: ((parsedResponse.expectedROI || request.userMetrics.averageRoi) * 0.9).toFixed(2)
          },
          recommended: {
            budget: (parsedResponse.suggestedBudget || 500).toFixed(2),
            expectedRoi: (parsedResponse.expectedROI || request.userMetrics.averageRoi).toFixed(2)
          },
          high: {
            budget: (parsedResponse.budgetRange?.max || (parsedResponse.suggestedBudget * 1.2) || 600).toFixed(2),
            expectedRoi: ((parsedResponse.expectedROI || request.userMetrics.averageRoi) * 1.1).toFixed(2)
          }
        }),
        createdAt: now,
        updatedAt: now,
        implementedAt: null,
        isImplemented: false,
        implementationDetails: JSON.stringify({
          steps: parsedResponse.implementationSteps || [
            `Allocate $${(parsedResponse.suggestedBudget || 500).toFixed(2)} to your next ${adMethod.name} campaign`,
            'Monitor performance weekly and adjust if necessary',
            'Compare results with your historical data after 30 days',
          ]
        }),
        userFeedback: null,
        interactionHistory: JSON.stringify({
          views: 0,
          lastViewed: null
        }),
        dismissedAt: null,
      },
    ];

    return {
      success: true,
      recommendations,
    };
  } catch (error) {
    console.error('Error generating pricing recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

function generatePrompt(
  businessName: string,
  businessType: string,
  adMethodName: string,
  historicalCampaigns: Campaign[],
  competitorCampaigns: BusinessCampaignWithROI[],
  userMetrics: UserMetrics
): string {
  // Format historical campaign data
  const historicalData = historicalCampaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    amount: parseFloat(campaign.amountSpent),
    revenue: campaign.amountEarned ? parseFloat(campaign.amountEarned) : 0,
    roi: campaign.amountEarned && campaign.amountSpent 
      ? ((parseFloat(campaign.amountEarned) - parseFloat(campaign.amountSpent)) / parseFloat(campaign.amountSpent)) * 100 
      : 0,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    active: campaign.isActive,
  }));
  
  // Format competitor campaign data
  const competitorData = competitorCampaigns.map(campaign => ({
    amount: campaign.amount,
    revenue: campaign.revenue,
    roi: campaign.roi,
    active: campaign.active,
  }));

  return `
I need a pricing recommendation for ${businessName}, a ${businessType} business, for their ${adMethodName} advertising campaigns.

BUSINESS METRICS:
- Average ROI across all campaigns: ${userMetrics.averageRoi.toFixed(2)}%
- Total ad spend to date: $${userMetrics.totalSpent.toFixed(2)}
- Total revenue from ads: $${userMetrics.totalEarned.toFixed(2)}
- Active campaigns: ${userMetrics.activeCampaigns}
- Total campaigns: ${userMetrics.totalCampaigns}

HISTORICAL CAMPAIGNS (${adMethodName}):
${JSON.stringify(historicalData, null, 2)}

COMPETITOR PERFORMANCE (${adMethodName}):
${JSON.stringify(competitorData, null, 2)}

Based on this data, please provide a pricing recommendation with the following structure:
1. Suggested budget for ${adMethodName} campaigns (amount in USD)
2. Budget range (min and max amounts in USD)
3. Expected ROI (percentage)
4. Rationale for the recommendation
5. Implementation steps (list of actions)

Respond in this JSON format:
\`\`\`json
{
  "suggestedBudget": 1000,
  "budgetRange": {
    "min": 800,
    "max": 1200
  },
  "expectedROI": 25,
  "rationale": "Your detailed explanation...",
  "implementationSteps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ]
}
\`\`\`
`;
}

// Fallback function for when the API is not available
function generateFallbackRecommendation(
  request: PricingRecommendationRequest
): PricingRecommendationResponse {
  const adMethod = request.adMethods.find(method => method.id === request.adMethodId);

  if (!adMethod) {
    return {
      success: false,
      error: 'Invalid ad method specified',
    };
  }

  // Calculate the average spend for this ad method
  const relevantCampaigns = request.campaigns.filter(
    campaign => campaign.adMethodId === request.adMethodId
  );
  
  const avgSpend = relevantCampaigns.length
    ? relevantCampaigns.reduce((sum, campaign) => sum + parseFloat(campaign.amountSpent), 0) / relevantCampaigns.length
    : 500; // Default starting point
    
  const recommendedBudget = avgSpend * 1.1; // Slightly higher than historical average
  
  // Current timestamp for createdAt and updatedAt fields
  const now = new Date();
  
  return {
    success: true,
    recommendations: [
      {
        businessId: request.businessId,
        userId: request.userId,
        adMethodId: request.adMethodId,
        businessType: request.businessType,
        recommendedBudget: recommendedBudget.toFixed(2),
        recommendedBidAmount: (recommendedBudget * 0.2).toFixed(2),
        expectedRoi: (request.userMetrics.averageRoi * 1.05).toFixed(2),
        confidenceScore: '0.85',
        rationale: `Based on your historical performance with ${adMethod.name} campaigns, a budget of $${recommendedBudget.toFixed(2)} is recommended to maintain and slightly improve your current results.`,
        scenarioBudgets: JSON.stringify({
          low: {
            budget: (recommendedBudget * 0.8).toFixed(2),
            expectedRoi: (request.userMetrics.averageRoi * 0.95).toFixed(2)
          },
          recommended: {
            budget: recommendedBudget.toFixed(2),
            expectedRoi: (request.userMetrics.averageRoi * 1.05).toFixed(2)
          },
          high: {
            budget: (recommendedBudget * 1.2).toFixed(2),
            expectedRoi: (request.userMetrics.averageRoi * 1.15).toFixed(2)
          }
        }),
        createdAt: now,
        updatedAt: now,
        implementedAt: null,
        isImplemented: false,
        implementationDetails: JSON.stringify({
          steps: [
            `Allocate $${recommendedBudget.toFixed(2)} to your next ${adMethod.name} campaign`,
            'Monitor performance weekly and adjust if necessary',
            'Compare results with your historical data after 30 days',
          ]
        }),
        userFeedback: null,
        interactionHistory: JSON.stringify({
          views: 0,
          lastViewed: null
        }),
        dismissedAt: null,
      },
    ],
  };
}