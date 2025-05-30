import Anthropic from '@anthropic-ai/sdk';
import { 
  Campaign, 
  BusinessCampaignWithROI, 
  AdRecommendation, 
  AdRecommendationItem,
  AdMethod,
  Business,
  adRecommendations,
  adRecommendationItems,
  userRecommendationInteractions
} from '@shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';

// Initialize the Anthropic client (reference to client initialized in marketingInsights.ts)
declare global {
  var anthropicClient: Anthropic | null;
}

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const MODEL = "claude-3-7-sonnet-20250219";

// Interface for recommendation request
export interface RecommendationRequest {
  userId: number;
  businessId: number;
  businessName: string;
  businessType: string;
  campaigns: Campaign[];
  adMethods: AdMethod[];
  topPerformers: BusinessCampaignWithROI[];
  userMetrics: {
    averageRoi: number;
    totalSpent: number;
    totalEarned: number;
    activeCampaigns: number;
    totalCampaigns: number;
  };
  geographicData?: {
    latitude: number;
    longitude: number;
    zipCode: string;
    radius: number; // in miles
  };
}

// Interface for recommendation response
export interface RecommendationResponse {
  success: boolean;
  recommendationId?: number;
  summary?: string;
  error?: string;
  recommendations?: AdRecommendationItem[];
  confidenceScore?: number;
}

// Main function to generate recommendations
export async function generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
  try {
    if (!global.anthropicClient) {
      console.warn('Anthropic client not initialized, using fallback recommendations');
      return getFallbackRecommendations(request);
    }

    // Create a context object with all the business data
    const businessContext = buildBusinessContext(request);
    
    // Generate main recommendation data using Anthropic Claude
    const prompt = buildRecommendationPrompt(businessContext);
    
    // Call Anthropic API
    const response = await global.anthropicClient.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: prompt.systemPrompt,
      messages: [
        { role: 'user', content: prompt.userPrompt }
      ],
    });

    // Parse the recommendations from the AI response
    const aiResponseContent = response.content[0];
    if (typeof aiResponseContent !== 'object' || !('text' in aiResponseContent)) {
      throw new Error('Unexpected response format from Anthropic API');
    }
    const aiResponse = aiResponseContent.text;
    const recommendationData = parseRecommendationData(aiResponse);
    
    if (!recommendationData) {
      throw new Error('Failed to parse recommendation data from AI response');
    }

    // Create recommendation in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Recommendations expire after 7 days
    
    // Insert the main recommendation record
    const [recommendationRecord] = await db.insert(adRecommendations)
      .values({
        businessId: request.businessId,
        generatedAt: new Date(),
        expiresAt: expiresAt,
        isViewed: false,
        summaryText: recommendationData.summary,
        confidenceScore: recommendationData.confidenceScore
      })
      .returning();
    
    // Insert individual recommendation items
    const recommendationItems: AdRecommendationItem[] = [];
    
    for (const item of recommendationData.recommendations) {
      // Convert recommendedBudget to string as expected by database schema
      const recommendedBudgetStr = item.recommendedBudget.toString();
      
      const [recommendationItem] = await db.insert(adRecommendationItems)
        .values({
          recommendationId: recommendationRecord.id,
          adMethodId: item.adMethodId,
          rank: item.rank,
          predictedRoi: item.predictedRoi,
          recommendedBudget: recommendedBudgetStr,
          rationale: item.rationale,
          confidenceScore: item.confidenceScore,
          scenarioData: item.scenarioData
        })
        .returning();
        
      recommendationItems.push(recommendationItem);
    }
    
    return {
      success: true,
      recommendationId: recommendationRecord.id,
      summary: recommendationData.summary,
      recommendations: recommendationItems,
      confidenceScore: recommendationData.confidenceScore
    };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Build a detailed context object from business data
function buildBusinessContext(request: RecommendationRequest): string {
  // Format campaigns list
  const campaignsInfo = request.campaigns.map(campaign => {
    const adMethodName = request.adMethods.find(method => method.id === campaign.adMethodId)?.name || 'Unknown';
    
    return {
      name: campaign.name,
      adMethod: adMethodName,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      amountSpent: parseFloat(campaign.amountSpent as string),
      amountEarned: parseFloat(campaign.amountEarned as string),
      ROI: calculateROI(parseFloat(campaign.amountEarned as string), parseFloat(campaign.amountSpent as string))
    };
  });

  // Format top performers list
  const topPerformersInfo = request.topPerformers.map(performer => {
    return {
      campaignName: performer.name,
      businessType: performer.business?.businessType || 'Unknown',
      adMethod: performer.adMethod?.name || 'Unknown',
      roi: performer.roi
    };
  });

  // Available ad methods that the business hasn't used yet
  const unusedAdMethods = request.adMethods.filter(method => 
    !request.campaigns.some(campaign => campaign.adMethodId === method.id)
  );

  // Create context object
  const context = {
    businessName: request.businessName,
    businessType: request.businessType,
    userMetrics: request.userMetrics,
    campaigns: campaignsInfo,
    topPerformers: topPerformersInfo,
    availableAdMethods: request.adMethods.map(method => method.name),
    unusedAdMethods: unusedAdMethods.map(method => method.name),
    geographicData: request.geographicData
  };

  return JSON.stringify(context, null, 2);
}

// Calculate ROI percentage
function calculateROI(revenue: number, cost: number): number {
  if (cost === 0) return 0;
  return ((revenue - cost) / cost) * 100;
}

// Build the system and user prompts for the AI
function buildRecommendationPrompt(businessContext: string): { systemPrompt: string, userPrompt: string } {
  const systemPrompt = `You are an expert marketing advisor specializing in providing data-driven advertising recommendations. 
Your task is to analyze business campaign performance data and recommend the best advertising methods for optimal ROI.

Generate three specific advertising method recommendations with detailed rationales, predicted ROI ranges, and recommended budget allocations.
Your recommendations must be based on:
1. The business's own historical campaign performance
2. Similar businesses' performance with various ad methods
3. The business type and industry best practices
4. Geographic insights if available

For each recommendation, provide:
- The specific ad method name (must be from the available list)
- A rank from 1-3 (1 being highest priority)
- A predicted ROI percentage range
- A recommended budget allocation (specific dollar amount)
- A detailed rationale explaining why this method would work well
- A confidence score (0.1-1.0) representing your certainty in this recommendation

Also provide an overall summary and an overall confidence score for your recommendations.

Format your response as valid JSON with this structure:
{
  "summary": "A concise summary of your overall recommendations and strategy",
  "confidenceScore": 0.85,
  "recommendations": [
    {
      "adMethodId": 1,
      "adMethodName": "Social Media Ads",
      "rank": 1,
      "predictedRoi": 120.5,
      "recommendedBudget": 500.00,
      "rationale": "Detailed explanation of the recommendation",
      "confidenceScore": 0.9,
      "scenarioData": {
        "conservative": { "budget": 300, "predictedRoi": 100 },
        "moderate": { "budget": 500, "predictedRoi": 120 },
        "aggressive": { "budget": 800, "predictedRoi": 140 }
      }
    },
    ...
  ]
}`;

  const userPrompt = `Please provide advertising recommendations based on this business data:

${businessContext}

Analyze the data carefully and generate three specific advertising method recommendations that would maximize ROI for this business.`;

  return { systemPrompt, userPrompt };
}

// Parse the recommendation data from the AI response
function parseRecommendationData(aiResponse: string): {
  summary: string;
  confidenceScore: number;
  recommendations: {
    adMethodId: number;
    adMethodName: string;
    rank: number;
    predictedRoi: number;
    recommendedBudget: number;
    rationale: string;
    confidenceScore: number;
    scenarioData: {
      conservative: { budget: number; predictedRoi: number; };
      moderate: { budget: number; predictedRoi: number; };
      aggressive: { budget: number; predictedRoi: number; };
    };
  }[];
} | null {
  try {
    // Find JSON object in the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const jsonStr = jsonMatch[0];
    const data = JSON.parse(jsonStr);
    
    // Validate required fields
    if (!data.summary || !data.confidenceScore || !Array.isArray(data.recommendations)) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing recommendation data:', error);
    return null;
  }
}

// Fallback recommendations when AI is not available
export async function getFallbackRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
  try {
    // Sort campaigns by ROI to find the best performing ad methods
    const campaignsWithROI = request.campaigns.map(campaign => {
      const spent = parseFloat(campaign.amountSpent as string) || 0;
      const earned = parseFloat(campaign.amountEarned as string) || 0;
      const roi = spent > 0 ? ((earned - spent) / spent) * 100 : 0;
      
      return {
        ...campaign,
        roi,
        adMethod: request.adMethods.find(method => method.id === campaign.adMethodId)
      };
    }).sort((a, b) => b.roi - a.roi);
    
    // Get top performing ad method
    const topMethod = campaignsWithROI.length > 0 ? 
      campaignsWithROI[0].adMethod : 
      request.adMethods[0];
    
    // Get second best method or a random one if not enough campaigns
    const secondMethod = campaignsWithROI.length > 1 ? 
      campaignsWithROI[1].adMethod : 
      request.adMethods.find(m => m.id !== topMethod?.id) || request.adMethods[1];
    
    // For third, use a method they haven't tried yet, or another random one
    const usedMethodIds = request.campaigns.map(c => c.adMethodId);
    const unusedMethods = request.adMethods.filter(m => !usedMethodIds.includes(m.id));
    
    const thirdMethod = unusedMethods.length > 0 ? 
      unusedMethods[0] : 
      request.adMethods.find(m => m.id !== topMethod?.id && m.id !== secondMethod?.id) || request.adMethods[2] || request.adMethods[0];
    
    // Calculate average spending to suggest recommended budgets
    const avgSpending = request.campaigns.length > 0 ? 
      request.campaigns.reduce((sum, camp) => sum + (parseFloat(camp.amountSpent as string) || 0), 0) / request.campaigns.length : 
      500; // Default value if no campaigns
    
    // Create a dummy summary for fallback recommendations
    const summary = `Based on your campaign history and industry benchmarks, we recommend focusing on ${topMethod?.name || "Social Media Ads"} as your primary advertising channel. Consider allocating resources to ${secondMethod?.name || "Email Marketing"} as well, while exploring ${thirdMethod?.name || "Local Newspaper"} as a new opportunity to diversify your marketing mix.`;
    
    // IMPORTANT: Save the fallback recommendations to the database
    // Create the expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Insert the main recommendation record
    const [recommendationRecord] = await db.insert(adRecommendations)
      .values({
        businessId: request.businessId,
        generatedAt: new Date(),
        expiresAt: expiresAt,
        isViewed: false,
        summaryText: summary,
        confidenceScore: 0.7
      })
      .returning();
    
    // Create recommendation items for the top 3 methods
    const recommendationItems = [];
    
    if (topMethod) {
      const [item1] = await db.insert(adRecommendationItems)
        .values({
          recommendationId: recommendationRecord.id,
          adMethodId: topMethod.id,
          rank: 1,
          predictedRoi: 75, // Fallback value
          recommendedBudget: (avgSpending * 1.2).toString(), // 20% more than average
          rationale: `${topMethod.name} has shown the best historical performance for your business. We recommend continuing and potentially increasing your investment in this channel.`,
          confidenceScore: 0.8,
          scenarioData: JSON.stringify({
            conservative: { budget: avgSpending, predictedRoi: 65 },
            moderate: { budget: avgSpending * 1.2, predictedRoi: 75 },
            aggressive: { budget: avgSpending * 1.5, predictedRoi: 80 }
          })
        })
        .returning();
      recommendationItems.push(item1);
    }
    
    if (secondMethod) {
      const [item2] = await db.insert(adRecommendationItems)
        .values({
          recommendationId: recommendationRecord.id,
          adMethodId: secondMethod.id,
          rank: 2,
          predictedRoi: 60, // Fallback value
          recommendedBudget: (avgSpending * 0.8).toString(), // 80% of average
          rationale: `${secondMethod.name} provides good diversification for your marketing mix. We recommend maintaining a steady investment in this channel to complement your primary marketing efforts.`,
          confidenceScore: 0.7,
          scenarioData: JSON.stringify({
            conservative: { budget: avgSpending * 0.6, predictedRoi: 55 },
            moderate: { budget: avgSpending * 0.8, predictedRoi: 60 },
            aggressive: { budget: avgSpending, predictedRoi: 65 }
          })
        })
        .returning();
      recommendationItems.push(item2);
    }
    
    if (thirdMethod) {
      const [item3] = await db.insert(adRecommendationItems)
        .values({
          recommendationId: recommendationRecord.id,
          adMethodId: thirdMethod.id,
          rank: 3,
          predictedRoi: 50, // Fallback value
          recommendedBudget: (avgSpending * 0.5).toString(), // 50% of average
          rationale: unusedMethods.length > 0 
            ? `${thirdMethod.name} is a new channel you haven't tried yet. Allocating a portion of your budget to this method could uncover new opportunities for growth.`
            : `${thirdMethod.name} can provide additional reach to complement your primary channels. We recommend a modest investment to test and optimize this channel.`,
          confidenceScore: 0.6,
          scenarioData: JSON.stringify({
            conservative: { budget: avgSpending * 0.3, predictedRoi: 45 },
            moderate: { budget: avgSpending * 0.5, predictedRoi: 50 },
            aggressive: { budget: avgSpending * 0.7, predictedRoi: 55 }
          })
        })
        .returning();
      recommendationItems.push(item3);
    }
    
    // Return success with recommendation ID and items
    return {
      success: true,
      recommendationId: recommendationRecord.id,
      summary,
      recommendations: recommendationItems,
      confidenceScore: 0.7
    };
  } catch (error) {
    console.error('Error generating fallback recommendations:', error);
    return {
      success: false,
      error: 'Failed to generate recommendations'
    };
  }
}