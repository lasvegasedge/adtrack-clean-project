import OpenAI from "openai";
import { Campaign, BusinessCampaignWithROI } from "@shared/schema";

// Initialize the OpenAI client only if API key is available
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    console.warn("OPENAI_API_KEY not provided. Chatbot will use fallback responses.");
  }
} catch (error) {
  console.warn("Failed to initialize OpenAI client:", error);
}

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

interface ChatbotRequest {
  message: string;
  campaigns?: Campaign[];
  businessType?: string;
  adMethods?: { id: number; name: string }[];
  topPerformers?: BusinessCampaignWithROI[];
  userMetrics?: {
    averageRoi: number;
    totalSpent: number;
    totalEarned: number;
  };
}

export async function generateMarketingAdvice(request: ChatbotRequest): Promise<string> {
  try {
    // If OpenAI is not available, use fallback responses
    if (!openai) {
      return getFallbackResponse(request.message, request);
    }

    // Construct context for the AI based on available data
    let systemPrompt = `You are AdTrack's Marketing Advisor, an expert marketing consultant specializing in ROI optimization, advertising strategy, and campaign performance. 
    
    Your task is to provide personalized, actionable marketing advice to business owners based on their campaign data and industry.
    
    Keep responses concise, practical, and focused on concrete actions they can take to improve their marketing ROI.
    
    Always be encouraging, constructive, and speak directly to the business owner using "you" language.`;
    
    let contextData = "";
    
    if (request.businessType) {
      contextData += `\nBusiness Type: ${request.businessType}`;
    }
    
    if (request.campaigns && request.campaigns.length > 0) {
      contextData += "\n\nCampaign Data:";
      request.campaigns.forEach(campaign => {
        contextData += `\n- Name: ${campaign.name}`;
        contextData += `\n  Description: ${campaign.description || 'N/A'}`;
        contextData += `\n  Amount Spent: $${campaign.amountSpent}`;
        contextData += `\n  Amount Earned: $${campaign.amountEarned || 0}`;
        const earned = Number(campaign.amountEarned ?? 0);
        const spent = Number(campaign.amountSpent);
        contextData += `\n  ROI: ${((earned / spent * 100) - 100).toFixed(2)}%`;
        contextData += `\n  Status: ${campaign.isActive ? 'Active' : 'Completed'}`;
        contextData += `\n  Start Date: ${new Date(campaign.startDate).toLocaleDateString()}`;
        contextData += campaign.endDate ? `\n  End Date: ${new Date(campaign.endDate).toLocaleDateString()}` : '';
        contextData += `\n  Ad Method: ${campaign.adMethodId}`;
      });
    }
    
    if (request.userMetrics) {
      contextData += "\n\nOverall Metrics:";
      contextData += `\n- Average ROI: ${request.userMetrics.averageRoi.toFixed(2)}%`;
      contextData += `\n- Total Spent: $${request.userMetrics.totalSpent.toFixed(2)}`;
      contextData += `\n- Total Earned: $${request.userMetrics.totalEarned.toFixed(2)}`;
    }
    
    if (request.topPerformers && request.topPerformers.length > 0) {
      contextData += "\n\nTop Performers in Area:";
      request.topPerformers.slice(0, 3).forEach((campaign, index) => {
        contextData += `\n- Rank #${index + 1}`;
        contextData += `\n  ROI: ${campaign.roi.toFixed(2)}%`;
        contextData += `\n  Ad Method: ${campaign.adMethodId}`;
        contextData += `\n  Amount Spent: $${campaign.amountSpent}`;
      });
    }
    
    if (request.adMethods && request.adMethods.length > 0) {
      contextData += "\n\nAvailable Ad Methods:";
      request.adMethods.forEach(method => {
        contextData += `\n- ${method.name} (ID: ${method.id})`;
      });
    }

    try {
      if (!openai) {
        throw new Error("OpenAI client not initialized");
      }
      
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt + (contextData ? `\n\nHere is the context about the business and their campaigns:${contextData}` : ""),
          },
          {
            role: "user",
            content: request.message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0].message.content || "I'm sorry, I couldn't generate any advice at the moment.";
    } catch (openaiError) {
      console.error("Error from OpenAI API:", openaiError);
      return getFallbackResponse(request.message, request);
    }
  } catch (error: any) {
    console.error("Error generating marketing advice:", error);
    return `I'm sorry, I'm having trouble analyzing your data right now. Please try again later.`;
  }
}

// Fallback responses for demonstration when OpenAI API is not available
function getFallbackResponse(message: string, request?: ChatbotRequest): string {
  const lowerMessage = message.toLowerCase();
  
  // Check for high ROI in campaigns if available
  let highestRoiCampaign = null;
  if (request?.campaigns && request.campaigns.length > 0) {
    highestRoiCampaign = request.campaigns.reduce((highest, current) => {
      const currentEarned = Number(current.amountEarned ?? 0);
      const currentSpent = Number(current.amountSpent);
      const currentRoi = (currentEarned / currentSpent) - 1;
      
      const highestEarned = Number(highest?.amountEarned ?? 0);
      const highestSpent = Number(highest?.amountSpent ?? 1);
      const highestRoi = (highestEarned / highestSpent) - 1;
      
      return currentRoi > highestRoi ? current : highest;
    }, request.campaigns[0]);
  }
  
  // Pattern matching for common marketing questions
  if (lowerMessage.includes("improve") && lowerMessage.includes("roi")) {
    return "Based on my analysis, you can improve your ROI by:\n\n" +
      "1. Focus more on targeted audience segmentation\n" +
      "2. Optimize your ad creative with A/B testing\n" +
      "3. Consider reallocating budget from lower-performing campaigns\n" +
      "4. Track conversion metrics more closely to identify drop-off points\n\n" +
      "Implement these changes gradually and measure the results after each modification.";
  }
  
  if (lowerMessage.includes("best") && (lowerMessage.includes("ad method") || lowerMessage.includes("advertising method"))) {
    if (highestRoiCampaign) {
      return `Based on your historical data, your most effective advertising method appears to be the one used in your "${highestRoiCampaign.name}" campaign. This campaign achieved a higher ROI compared to your other campaigns.\n\nI recommend analyzing what made this specific campaign successful and applying those strategies to your other marketing efforts.`;
    }
    return "The most effective advertising methods typically vary by industry and target audience. For your specific business, I recommend:\n\n" +
      "1. Digital advertising for precise targeting and measurable results\n" +
      "2. Content marketing to establish authority and drive organic traffic\n" +
      "3. Email campaigns for direct customer engagement\n\n" +
      "Start with small test campaigns across these channels to determine what works best for your specific audience.";
  }
  
  if (lowerMessage.includes("budget") || lowerMessage.includes("spend")) {
    return "When determining your marketing budget, consider these factors:\n\n" +
      "1. Industry benchmarks suggest allocating 7-15% of your revenue for established businesses and 20-30% for startups\n" +
      "2. Distribute your budget across multiple channels, with more allocation to those with proven ROI\n" +
      "3. Set aside 20-30% for testing new channels and strategies\n\n" +
      "Review and adjust your budget quarterly based on performance data.";
  }
  
  if (lowerMessage.includes("compare") && lowerMessage.includes("competitor")) {
    if (request?.topPerformers && request.topPerformers.length > 0) {
      const topPerformer = request.topPerformers[0];
      return `Looking at the top performers in your area, I notice businesses achieving ROIs of approximately ${topPerformer.roi.toFixed(1)}% using similar marketing approaches. The key differences appear to be in their execution and targeting strategies.\n\nConsider benchmarking your campaigns against these performers by focusing on more precise audience targeting and testing different creative approaches.`;
    }
    return "When comparing to competitors, look beyond just the advertising methods they use and analyze:\n\n" +
      "1. Their messaging and unique value proposition\n" +
      "2. The channels where they have the strongest presence\n" +
      "3. Their content strategy and customer engagement approach\n\n" +
      "Focus on differentiating your brand while learning from their successful strategies.";
  }
  
  if (lowerMessage.includes("different") && lowerMessage.includes("ad method")) {
    return "Exploring new advertising methods can yield great results. Consider:\n\n" +
      "1. If you're primarily using digital ads, try incorporating content marketing or email campaigns\n" +
      "2. If you haven't explored video marketing, this medium is showing strong engagement rates across industries\n" +
      "3. Partner marketing or co-promotions can help you reach new audiences\n\n" +
      "Start with small tests of new methods alongside your proven channels to minimize risk.";
  }
  
  // Default response for any other questions
  return "As your marketing advisor, I recommend focusing on these key principles for successful campaigns:\n\n" +
    "1. Clear audience targeting to ensure your message reaches the right people\n" +
    "2. Consistent measurement and optimization based on performance data\n" +
    "3. A mix of both short-term activation campaigns and long-term brand building\n" +
    "4. Regular testing of new approaches while maintaining your core effective strategies\n\n" +
    "Let me know if you'd like more specific advice about a particular aspect of your marketing strategy!";
}