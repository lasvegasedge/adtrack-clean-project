import Anthropic from '@anthropic-ai/sdk';
import { BusinessCampaignWithROI } from '@shared/schema';

// Initialize Anthropic client if API key is available
let anthropicClient: Anthropic | null = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  console.log('Anthropic client initialized for AI Benchmark Tooltips');
}

export interface AIBenchmarkInsight {
  performance: {
    value: number;
    percentDifference: number;
    isPositive: boolean;
  };
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
  confidenceScore: number;
  industryBenchmark: number;
}

export async function generateBenchmarkInsights(
  businessCampaigns: BusinessCampaignWithROI[],
  competitorCampaigns: BusinessCampaignWithROI[],
  metricType: 'roi' | 'spend' | 'revenue',
  businessType?: string
): Promise<AIBenchmarkInsight> {
  // Default values if AI fails or isn't available
  const defaultInsight: AIBenchmarkInsight = {
    performance: {
      value: 0,
      percentDifference: 0,
      isPositive: false
    },
    trend: 'stable',
    recommendation: 'Based on your data, consider optimizing your campaigns for better performance.',
    confidenceScore: 0.7,
    industryBenchmark: 0
  };
  
  try {
    // Calculate basic metrics (this provides fallback if AI is unavailable)
    let yourValue = 0;
    let competitorAvg = 0;
    let topValue = 0;
    
    // Calculate your business metrics
    if (businessCampaigns.length > 0) {
      if (metricType === 'roi') {
        yourValue = businessCampaigns.reduce((sum, c) => sum + c.roi, 0) / businessCampaigns.length;
      } else if (metricType === 'spend') {
        yourValue = businessCampaigns.reduce((sum, c) => sum + parseFloat(c.amountSpent.toString()), 0) / businessCampaigns.length;
      } else { // revenue
        yourValue = businessCampaigns.reduce((sum, c) => {
          const earned = c.amountEarned ? parseFloat(c.amountEarned.toString()) : 0;
          return sum + earned;
        }, 0) / businessCampaigns.length;
      }
    }
    
    // Calculate competitor metrics
    if (competitorCampaigns.length > 0) {
      if (metricType === 'roi') {
        competitorAvg = competitorCampaigns.reduce((sum, c) => sum + c.roi, 0) / competitorCampaigns.length;
        topValue = Math.max(...competitorCampaigns.map(c => c.roi));
      } else if (metricType === 'spend') {
        competitorAvg = competitorCampaigns.reduce((sum, c) => sum + parseFloat(c.amountSpent.toString()), 0) / competitorCampaigns.length;
        topValue = Math.max(...competitorCampaigns.map(c => parseFloat(c.amountSpent.toString())));
      } else { // revenue
        competitorAvg = competitorCampaigns.reduce((sum, c) => {
          const earned = c.amountEarned ? parseFloat(c.amountEarned.toString()) : 0;
          return sum + earned;
        }, 0) / competitorCampaigns.length;
        topValue = Math.max(...competitorCampaigns.map(c => {
          return c.amountEarned ? parseFloat(c.amountEarned.toString()) : 0;
        }));
      }
    }
    
    // Calculate performance metrics
    const percentDifference = competitorAvg > 0 ? ((yourValue - competitorAvg) / competitorAvg) * 100 : 0;
    const isPositive = metricType === 'roi' || metricType === 'revenue' 
      ? yourValue >= competitorAvg
      : yourValue <= competitorAvg; // For spend, lower is better
    
    // Determine trend based on historical data if available
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (businessCampaigns.length > 1) {
      // Sort by date to compare recent vs older performance
      const sortedCampaigns = [...businessCampaigns].sort((a, b) => {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });
      
      // Split into recent vs older campaigns
      const midpoint = Math.floor(sortedCampaigns.length / 2);
      const recentCampaigns = sortedCampaigns.slice(0, midpoint);
      const olderCampaigns = sortedCampaigns.slice(midpoint);
      
      let recentAvg = 0;
      let olderAvg = 0;
      
      if (metricType === 'roi') {
        recentAvg = recentCampaigns.reduce((sum, c) => sum + c.roi, 0) / recentCampaigns.length;
        olderAvg = olderCampaigns.reduce((sum, c) => sum + c.roi, 0) / olderCampaigns.length;
      } else if (metricType === 'spend') {
        recentAvg = recentCampaigns.reduce((sum, c) => sum + parseFloat(c.amountSpent.toString()), 0) / recentCampaigns.length;
        olderAvg = olderCampaigns.reduce((sum, c) => sum + parseFloat(c.amountSpent.toString()), 0) / olderCampaigns.length;
      } else { // revenue
        recentAvg = recentCampaigns.reduce((sum, c) => {
          const earned = c.amountEarned ? parseFloat(c.amountEarned.toString()) : 0;
          return sum + earned;
        }, 0) / recentCampaigns.length;
        olderAvg = olderCampaigns.reduce((sum, c) => {
          const earned = c.amountEarned ? parseFloat(c.amountEarned.toString()) : 0;
          return sum + earned;
        }, 0) / olderCampaigns.length;
      }
      
      const trendDifference = ((recentAvg - olderAvg) / olderAvg) * 100;
      const trendThreshold = 5; // 5% change threshold
      
      if (metricType === 'spend') {
        // For spend, decreasing is positive
        trend = trendDifference < -trendThreshold ? 'up' : trendDifference > trendThreshold ? 'down' : 'stable';
      } else {
        // For ROI and revenue, increasing is positive
        trend = trendDifference > trendThreshold ? 'up' : trendDifference < -trendThreshold ? 'down' : 'stable';
      }
    }
    
    // Generate a recommendation based on calculated metrics
    let recommendation = defaultInsight.recommendation;
    if (metricType === 'roi') {
      if (percentDifference < -20) {
        recommendation = "Consider reviewing your campaign strategy to improve ROI. Focus on higher-converting channels.";
      } else if (percentDifference < 0) {
        recommendation = "Your ROI is slightly below competitors. Optimize your top-performing campaigns for better results.";
      } else {
        recommendation = "Your ROI is competitive. Maintain your strategy and consider scaling successful campaigns.";
      }
    } else if (metricType === 'spend') {
      if (percentDifference > 30) {
        recommendation = "You're spending significantly more than competitors. Evaluate campaign efficiency to reduce costs.";
      } else if (percentDifference < -30) {
        recommendation = "Consider increasing your ad budget to gain more market visibility.";
      } else {
        recommendation = "Your ad spend is within industry range. Focus on optimizing your budget allocation.";
      }
    } else { // revenue
      if (percentDifference < -20) {
        recommendation = "Your revenue generation is lower than competitors. Focus on improving conversion rates.";
      } else if (percentDifference < 0) {
        recommendation = "Slight revenue gap compared to competitors. Target higher-value customers to increase revenue.";
      } else {
        recommendation = "Your revenue performance is strong. Continue your current strategy while testing new audiences.";
      }
    }
    
    // Calculate confidence score based on data quality
    let confidenceScore = 0.7; // default
    if (businessCampaigns.length > 5 && competitorCampaigns.length > 10) {
      confidenceScore = 0.9; // More data = higher confidence
    } else if (businessCampaigns.length < 3 || competitorCampaigns.length < 5) {
      confidenceScore = 0.6; // Limited data = lower confidence
    }
    
    // Use Anthropic to refine insights if available
    if (anthropicClient) {
      try {
        // Extract relevant campaign data for AI analysis 
        const yourCampaignData = businessCampaigns.map(c => ({
          method: c.adMethod?.name || 'Unknown',
          roi: c.roi,
          spend: parseFloat(c.amountSpent.toString()),
          revenue: c.amountEarned ? parseFloat(c.amountEarned.toString()) : 0,
          startDate: c.startDate,
          endDate: c.endDate
        }));
        
        const competitorData = competitorCampaigns.map(c => ({
          method: c.adMethod?.name || 'Unknown',
          roi: c.roi,
          spend: parseFloat(c.amountSpent.toString()),
          revenue: c.amountEarned ? parseFloat(c.amountEarned.toString()) : 0,
          startDate: c.startDate,
          endDate: c.endDate
        }));
        
        // Create contextual prompt for AI
        const metricName = metricType === 'roi' ? 'ROI (Return on Investment)' : 
                          metricType === 'spend' ? 'Advertising Spend' : 'Revenue Generated';
        
        const aiPrompt = `
        You are an AI assistant specialized in marketing analytics, particularly for the ${businessType || 'general'} industry.
        
        I'll provide you with campaign performance data for a business and its competitors. For the "${metricName}" metric, please provide:
        1. A specific, actionable recommendation (at most 15 words) to improve performance
        2. An industry benchmark figure that's realistic for this metric in this industry
        3. A confidence score for your insights (between 0 and 1)
        
        CONTEXT:
        - Business's average ${metricName}: ${yourValue.toFixed(2)}${metricType === 'roi' ? '%' : '$'}
        - Competitors' average ${metricName}: ${competitorAvg.toFixed(2)}${metricType === 'roi' ? '%' : '$'}
        - Performance trend: ${trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
        - Percent difference from competitors: ${percentDifference.toFixed(1)}%
        
        YOUR BUSINESS CAMPAIGNS:
        ${JSON.stringify(yourCampaignData, null, 2)}
        
        COMPETITOR CAMPAIGNS:
        ${JSON.stringify(competitorData.slice(0, 5), null, 2)}
        
        Respond in JSON format with these keys:
        {
          "recommendation": "your specific recommendation",
          "industryBenchmark": number,
          "confidenceScore": number
        }
        `;
        
        // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        const response = await anthropicClient.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 1024,
          messages: [{ role: 'user', content: aiPrompt }],
          system: "You are a marketing analytics AI that provides concise, data-driven insights. Always respond in the exact JSON format requested with no additional commentary. Keep recommendations under 15 words."
        });
        
        const content = response.content[0].text;
        // Extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const aiResponse = JSON.parse(jsonMatch[0]);
          
          // Update our insight with AI-enhanced values
          if (aiResponse.recommendation) {
            recommendation = aiResponse.recommendation;
          }
          
          if (aiResponse.industryBenchmark !== undefined && !isNaN(aiResponse.industryBenchmark)) {
            // Use AI-suggested industry benchmark
            defaultInsight.industryBenchmark = aiResponse.industryBenchmark;
          }
          
          if (aiResponse.confidenceScore !== undefined && !isNaN(aiResponse.confidenceScore)) {
            confidenceScore = Math.max(0, Math.min(1, aiResponse.confidenceScore));
          }
        }
      } catch (aiError) {
        console.error('Error using Anthropic for benchmark insights:', aiError);
        // Continue with our calculated values if AI fails
      }
    }
    
    // Return the final insight
    return {
      performance: {
        value: yourValue,
        percentDifference: percentDifference,
        isPositive: isPositive
      },
      trend: trend,
      recommendation: recommendation,
      confidenceScore: confidenceScore,
      industryBenchmark: competitorAvg || defaultInsight.industryBenchmark
    };
  } catch (error) {
    console.error('Error generating benchmark insights:', error);
    return defaultInsight;
  }
}