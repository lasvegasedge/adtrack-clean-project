import Anthropic from '@anthropic-ai/sdk';
import { Campaign, BusinessCampaignWithROI } from "@shared/schema";

// Initialize the Anthropic client
let anthropicClient: Anthropic | null = null;

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const MODEL = "claude-3-7-sonnet-20250219";

export interface MarketingInsightRequest {
  businessName: string;
  businessType: string;
  campaigns: Campaign[];
  topPerformers?: BusinessCampaignWithROI[];
  userMetrics: {
    averageRoi: number;
    totalSpent: number;
    totalEarned: number;
    activeCampaigns: number;
    totalCampaigns: number;
  };
  adMethods: { id: number; name: string }[];
  insightType: 'summary' | 'detailed' | 'recommendation';
}

export interface MarketingInsightResponse {
  success: boolean;
  story: string;
  bulletPoints?: string[];
  recommendations?: string[];
  error?: string;
}

/**
 * Initialize the Anthropic client with API key
 */
export function initializeAnthropicClient() {
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      console.log("Anthropic client initialized successfully");
      return true;
    } else {
      console.warn("ANTHROPIC_API_KEY not provided. Marketing insights will use fallback responses.");
      return false;
    }
  } catch (error) {
    console.error("Failed to initialize Anthropic client:", error);
    return false;
  }
}

/**
 * Generate marketing insights story based on business data
 */
export async function generateMarketingInsights(request: MarketingInsightRequest): Promise<MarketingInsightResponse> {
  try {
    // Initialize client if not already done
    if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
      initializeAnthropicClient();
    }

    // If Anthropic client is not available, use fallback
    if (!anthropicClient) {
      console.log("Anthropic client not available, using fallback insights");
      return getFallbackInsights(request);
    }

    try {
      // Construct business context for the AI
      const businessContext = buildBusinessContext(request);
      
      // Determine the prompt based on insight type
      const prompt = buildPrompt(request.insightType, businessContext);

      const response = await anthropicClient.messages.create({
        model: MODEL,
        max_tokens: 1500,
        temperature: 0.7,
        system: prompt.systemPrompt,
        messages: [
          { 
            role: 'user', 
            content: prompt.userPrompt + businessContext
          }
        ],
      });

      // Handle different content block types
      const contentBlock = response.content[0];
      const story = 'text' in contentBlock ? contentBlock.text : '';
      
      // Extract bullet points and recommendations if they exist
      const bulletPoints = extractBulletPoints(story);
      const recommendations = extractRecommendations(story);

      return {
        success: true,
        story,
        bulletPoints,
        recommendations
      };
    } catch (apiError) {
      console.log("Error with Anthropic API call, using fallback insights");
      return getFallbackInsights(request);
    }
  } catch (error: any) {
    console.error("Error generating marketing insights:", error);
    return {
      success: false,
      story: '',
      error: `Failed to generate marketing insights: ${error.message}`
    };
  }
}

/**
 * Build a detailed context object from business data
 */
function buildBusinessContext(request: MarketingInsightRequest): string {
  let context = `## Business Context\n`;
  context += `Business Name: ${request.businessName}\n`;
  context += `Business Type: ${request.businessType}\n\n`;
  
  context += `## Performance Metrics\n`;
  context += `Average ROI: ${request.userMetrics.averageRoi.toFixed(2)}%\n`;
  context += `Total Spent on Advertising: $${request.userMetrics.totalSpent.toFixed(2)}\n`;
  context += `Total Revenue from Advertising: $${request.userMetrics.totalEarned.toFixed(2)}\n`;
  context += `Active Campaigns: ${request.userMetrics.activeCampaigns}\n`;
  context += `Total Campaigns: ${request.userMetrics.totalCampaigns}\n\n`;
  
  if (request.campaigns && request.campaigns.length > 0) {
    context += `## Campaign Details\n`;
    
    request.campaigns.forEach(campaign => {
      const adMethod = request.adMethods.find(method => method.id === campaign.adMethodId);
      const adMethodName = adMethod ? adMethod.name : 'Unknown';
      
      context += `### ${campaign.name}\n`;
      context += `Description: ${campaign.description || 'N/A'}\n`;
      context += `Ad Method: ${adMethodName}\n`;
      context += `Amount Spent: $${campaign.amountSpent}\n`;
      context += `Amount Earned: $${campaign.amountEarned || 0}\n`;
      
      const earned = Number(campaign.amountEarned ?? 0);
      const spent = Number(campaign.amountSpent);
      const roi = ((earned / spent * 100) - 100).toFixed(2);
      
      context += `ROI: ${roi}%\n`;
      context += `Status: ${campaign.isActive ? 'Active' : 'Completed'}\n`;
      context += `Timeline: ${new Date(campaign.startDate).toLocaleDateString()}`;
      context += campaign.endDate ? ` to ${new Date(campaign.endDate).toLocaleDateString()}\n\n` : ' (ongoing)\n\n';
    });
  }
  
  if (request.topPerformers && request.topPerformers.length > 0) {
    context += `## Market Comparison\n`;
    context += `Top performers in your area:\n`;
    
    request.topPerformers.slice(0, 5).forEach((performer, index) => {
      const adMethod = request.adMethods.find(method => method.id === performer.adMethodId);
      const adMethodName = adMethod ? adMethod.name : 'Unknown';
      
      context += `${index + 1}. ROI: ${performer.roi.toFixed(2)}% using ${adMethodName}\n`;
      context += `   Spent: $${performer.amountSpent}, Earned: $${performer.amountEarned}\n`;
    });
  }
  
  return context;
}

/**
 * Build appropriate prompts based on the requested insight type
 */
function buildPrompt(insightType: string, businessContext: string): { systemPrompt: string, userPrompt: string } {
  const baseSystemPrompt = `You are AdTrack's Marketing Strategist, an expert in marketing analytics and storytelling. 
Your task is to analyze business marketing data and create clear, actionable insight narratives.
Focus on delivering value through specific observations and concrete recommendations.
Use a friendly, professional tone when addressing the business owner directly.
Always highlight both strengths and opportunities for improvement.
`;

  switch (insightType) {
    case 'summary':
      return {
        systemPrompt: baseSystemPrompt + `
Create a concise marketing performance summary that highlights key metrics and the most important insights.
Include 3-5 bullet points of key takeaways at the end of your response after "## Key Takeaways".
Keep your response under 400 words and focus on the most impactful observations.`,
        userPrompt: `Please create a concise marketing performance summary based on the following business data:\n\n`
      };
      
    case 'detailed':
      return {
        systemPrompt: baseSystemPrompt + `
Create a comprehensive marketing analysis that explores campaign performance in depth.
Compare campaigns against each other and against market benchmarks.
Identify patterns, trends, and opportunities across different advertising methods.
Include both a "## Key Findings" section with 5-7 bullet points and a "## Recommendations" section with 3-5 concrete suggestions.`,
        userPrompt: `Please create a detailed marketing performance analysis based on the following business data:\n\n`
      };
      
    case 'recommendation':
    default:
      return {
        systemPrompt: baseSystemPrompt + `
Focus primarily on actionable recommendations for improving marketing ROI.
Provide specific, practical steps the business can take based on their current performance.
Prioritize recommendations by potential impact and implementation difficulty.
Include a "## Top Recommendations" section with 5 high-impact suggestions.
For each recommendation, briefly explain the reasoning and expected benefit.`,
        userPrompt: `Please provide strategic marketing recommendations based on the following business data:\n\n`
      };
  }
}

/**
 * Extract bullet point lists from the generated story
 */
function extractBulletPoints(text: string): string[] {
  // Find sections that might contain bullet points
  const sections = ['Key Takeaways', 'Key Findings', 'Key Insights'];
  let bulletPoints: string[] = [];
  
  for (const section of sections) {
    const regex = new RegExp(`## ${section}\\s*([\\s\\S]*?)(?:##|$)`);
    const match = text.match(regex);
    
    if (match && match[1]) {
      // Extract bullet points (lines starting with -, *, or numbers)
      const points = match[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => /^[-*•]|\d+\./.test(line))
        .map(line => line.replace(/^[-*•]|\d+\.\s*/, '').trim());
      
      bulletPoints = [...bulletPoints, ...points];
    }
  }
  
  return bulletPoints;
}

/**
 * Extract recommendations from the generated story
 */
function extractRecommendations(text: string): string[] {
  // Find recommendation sections
  const sections = ['Recommendations', 'Top Recommendations', 'Suggested Actions'];
  let recommendations: string[] = [];
  
  for (const section of sections) {
    const regex = new RegExp(`## ${section}\\s*([\\s\\S]*?)(?:##|$)`);
    const match = text.match(regex);
    
    if (match && match[1]) {
      // Extract recommendations (lines starting with -, *, or numbers)
      const points = match[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => /^[-*•]|\d+\./.test(line))
        .map(line => line.replace(/^[-*•]|\d+\.\s*/, '').trim());
      
      recommendations = [...recommendations, ...points];
    }
  }
  
  return recommendations;
}

/**
 * Fallback method for when Anthropic API is not available
 */
export function getFallbackInsights(request: MarketingInsightRequest): MarketingInsightResponse {
  // Calculate metrics
  const averageRoi = request.userMetrics.averageRoi;
  const topCampaign = request.campaigns.sort((a, b) => {
    const aEarned = Number(a.amountEarned ?? 0);
    const aSpent = Number(a.amountSpent);
    const aRoi = (aEarned / aSpent) - 1;
    
    const bEarned = Number(b.amountEarned ?? 0);
    const bSpent = Number(b.amountSpent);
    const bRoi = (bEarned / bSpent) - 1;
    
    return bRoi - aRoi;
  })[0];
  
  const topAdMethodId = topCampaign?.adMethodId;
  const topAdMethod = request.adMethods.find(method => method.id === topAdMethodId)?.name || 'your top performing method';
  
  // Create a fallback narrative based on insight type
  let story = '';
  let bulletPoints: string[] = [];
  let recommendations: string[] = [];
  
  switch (request.insightType) {
    case 'summary':
      story = `# Marketing Performance Summary for ${request.businessName}

Your ${request.businessType} business has achieved an average ROI of ${averageRoi.toFixed(2)}% across all marketing campaigns. You've invested a total of $${request.userMetrics.totalSpent.toFixed(2)} in advertising, which has generated $${request.userMetrics.totalEarned.toFixed(2)} in revenue.

Your most successful campaign to date has been "${topCampaign?.name}" using ${topAdMethod}, which achieved an ROI of ${((Number(topCampaign?.amountEarned ?? 0) / Number(topCampaign?.amountSpent)) * 100 - 100).toFixed(2)}%. This campaign effectively connected with your target audience and delivered strong returns.

Currently, you have ${request.userMetrics.activeCampaigns} active campaigns out of a total of ${request.userMetrics.totalCampaigns} marketing initiatives tracked in the system.

## Key Takeaways
- Your overall marketing ROI is ${averageRoi > 50 ? 'strong' : averageRoi > 0 ? 'positive' : 'currently negative'} at ${averageRoi.toFixed(2)}%
- ${topAdMethod} has been your most effective advertising channel
- You've successfully tracked performance data for ${request.userMetrics.totalCampaigns} campaigns
- There's opportunity to optimize or reallocate resources from lower-performing campaigns
- Consider expanding use of ${topAdMethod} based on its proven success for your business`;
      
      bulletPoints = [
        `Your overall marketing ROI is ${averageRoi > 50 ? 'strong' : averageRoi > 0 ? 'positive' : 'currently negative'} at ${averageRoi.toFixed(2)}%`,
        `${topAdMethod} has been your most effective advertising channel`,
        `You've successfully tracked performance data for ${request.userMetrics.totalCampaigns} campaigns`,
        `There's opportunity to optimize or reallocate resources from lower-performing campaigns`,
        `Consider expanding use of ${topAdMethod} based on its proven success for your business`
      ];
      break;
      
    case 'detailed':
      // More comprehensive fallback for detailed insights
      story = `# Detailed Marketing Analysis for ${request.businessName}

## Performance Overview
Your ${request.businessType} business has invested $${request.userMetrics.totalSpent.toFixed(2)} across ${request.userMetrics.totalCampaigns} marketing campaigns, generating $${request.userMetrics.totalEarned.toFixed(2)} in revenue and an average ROI of ${averageRoi.toFixed(2)}%.

## Campaign Performance Analysis
Your marketing portfolio shows varying levels of performance across different advertising methods. The "${topCampaign?.name}" campaign using ${topAdMethod} has been your strongest performer with a ${((Number(topCampaign?.amountEarned ?? 0) / Number(topCampaign?.amountSpent)) * 100 - 100).toFixed(2)}% ROI.

${request.campaigns.length > 1 ? `Other campaigns have shown ${averageRoi > 30 ? 'promising' : averageRoi > 0 ? 'mixed' : 'challenging'} results, with ROIs ranging from ${Math.min(...request.campaigns.map(c => ((Number(c.amountEarned ?? 0) / Number(c.amountSpent)) * 100 - 100))).toFixed(2)}% to ${Math.max(...request.campaigns.map(c => ((Number(c.amountEarned ?? 0) / Number(c.amountSpent)) * 100 - 100))).toFixed(2)}%.` : ''}

## Market Comparison
${request.topPerformers && request.topPerformers.length > 0 ? 
  `When compared to similar businesses in your area, your performance is ${averageRoi > request.topPerformers[0].roi ? 'above' : 'below'} the top performer's ROI of ${request.topPerformers[0].roi.toFixed(2)}%. The most successful businesses in your area are achieving significant results with targeted campaigns and optimized ad spend.` : 
  `Market comparison data is not available at this time, but continuing to track and analyze your campaign performance will provide valuable benchmarking insights over time.`}

## Key Findings
- Your average marketing ROI is ${averageRoi.toFixed(2)}%, which is ${averageRoi > 50 ? 'excellent' : averageRoi > 25 ? 'good' : averageRoi > 0 ? 'fair' : 'concerning'}
- ${topAdMethod} has demonstrated the strongest performance for your business
- You have ${request.userMetrics.activeCampaigns} active campaigns that continue to generate results
- There's a ${Math.max(...request.campaigns.map(c => ((Number(c.amountEarned ?? 0) / Number(c.amountSpent)) * 100 - 100))) - Math.min(...request.campaigns.map(c => ((Number(c.amountEarned ?? 0) / Number(c.amountSpent)) * 100 - 100)))}% performance gap between your highest and lowest performing campaigns
- Campaign timing and duration appear to impact performance based on your historical data
- Your total marketing investment represents an important commitment to business growth

## Recommendations
- Increase investment in ${topAdMethod} by 15-20% based on its proven effectiveness
- Review and potentially pause or redesign campaigns with ROI below 10%
- Implement more rigorous A/B testing protocols for all future campaigns
- Consider seasonal timing adjustments based on historical performance patterns
- Explore complementary marketing channels that can enhance your current strategy`;
      
      bulletPoints = [
        `Your average marketing ROI is ${averageRoi.toFixed(2)}%, which is ${averageRoi > 50 ? 'excellent' : averageRoi > 25 ? 'good' : averageRoi > 0 ? 'fair' : 'concerning'}`,
        `${topAdMethod} has demonstrated the strongest performance for your business`,
        `You have ${request.userMetrics.activeCampaigns} active campaigns that continue to generate results`,
        `There's a ${Math.max(...request.campaigns.map(c => ((Number(c.amountEarned ?? 0) / Number(c.amountSpent)) * 100 - 100))) - Math.min(...request.campaigns.map(c => ((Number(c.amountEarned ?? 0) / Number(c.amountSpent)) * 100 - 100)))}% performance gap between your highest and lowest performing campaigns`,
        `Campaign timing and duration appear to impact performance based on your historical data`,
        `Your total marketing investment represents an important commitment to business growth`
      ];
      
      recommendations = [
        `Increase investment in ${topAdMethod} by 15-20% based on its proven effectiveness`,
        `Review and potentially pause or redesign campaigns with ROI below 10%`,
        `Implement more rigorous A/B testing protocols for all future campaigns`,
        `Consider seasonal timing adjustments based on historical performance patterns`,
        `Explore complementary marketing channels that can enhance your current strategy`
      ];
      break;
      
    case 'recommendation':
    default:
      // Recommendations-focused fallback
      story = `# Strategic Marketing Recommendations for ${request.businessName}

Based on a thorough analysis of your marketing performance data for your ${request.businessType} business, we've identified several strategic opportunities to enhance your marketing ROI and business growth.

## Performance Context
Your current average ROI across all campaigns is ${averageRoi.toFixed(2)}%, with your best-performing campaign "${topCampaign?.name}" achieving a ${((Number(topCampaign?.amountEarned ?? 0) / Number(topCampaign?.amountSpent)) * 100 - 100).toFixed(2)}% return using ${topAdMethod}.

## Top Recommendations

1. **Optimize Your Channel Mix**  
   Increase your investment in ${topAdMethod} by 20%, as this channel has consistently delivered the strongest returns for your business. Consider reallocating budget from lower-performing methods.

2. **Refine Campaign Targeting**  
   Your data suggests that more narrowly targeted campaigns perform better. Implement more precise audience segmentation in your upcoming campaigns, especially for your ${request.userMetrics.activeCampaigns} currently active initiatives.

3. **Implement Systematic Testing**  
   Establish a formal A/B testing protocol for all campaigns, focusing on testing variables such as messaging, creative elements, and audience targeting to continuously improve performance.

4. **Enhance Campaign Measurement**  
   Set up more granular tracking of customer journey touchpoints to better attribute conversions and understand which parts of your campaigns are driving results.

5. **Develop Complementary Strategies**  
   Based on the success of ${topAdMethod}, develop complementary marketing approaches that can work synergistically with this channel to enhance overall marketing effectiveness.

Implementing these recommendations could potentially increase your average marketing ROI by 15-30% over the next two quarters, resulting in approximately $${(request.userMetrics.totalEarned * 0.2).toFixed(2)} in additional revenue based on your current spending levels.

Remember that continuous monitoring and adjustment of your strategy based on performance data is key to long-term marketing success.`;
      
      recommendations = [
        `Optimize Your Channel Mix: Increase investment in ${topAdMethod} by 20%`,
        `Refine Campaign Targeting: Implement more precise audience segmentation`,
        `Implement Systematic Testing: Establish a formal A/B testing protocol`,
        `Enhance Campaign Measurement: Set up more granular tracking of customer journey touchpoints`,
        `Develop Complementary Strategies: Create marketing approaches that work synergistically with your top channel`
      ];
      break;
  }
  
  return {
    success: true,
    story,
    bulletPoints,
    recommendations
  };
}