# AI-Powered Campaign Recommendation Engine - Code Implementation

## Key Code Snippets

### 1. Recommendation Generation (Backend)

```typescript
// server/recommendationEngine.ts
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
    
    // [Database storage code omitted for brevity]
    
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
```

### 2. Database Storage Methods

```typescript
// server/storage.ts (Added to DatabaseStorage class)
async getRecommendationsForBusiness(businessId: number): Promise<AdRecommendation[]> {
  // Get the most recent recommendations first
  const recommendations = await db
    .select()
    .from(adRecommendations)
    .where(eq(adRecommendations.businessId, businessId))
    .orderBy(adRecommendations.generatedAt, 'desc');
    
  return recommendations;
}

async getRecommendationItems(recommendationId: number): Promise<AdRecommendationItem[]> {
  const items = await db
    .select()
    .from(adRecommendationItems)
    .where(eq(adRecommendationItems.recommendationId, recommendationId))
    .orderBy(adRecommendationItems.rank, 'asc');
    
  // Get ad method details for each item
  const adMethodIds = items.map(item => item.adMethodId);
  if (adMethodIds.length === 0) return items;
  
  const methods = await db
    .select()
    .from(adMethods)
    .where(inArray(adMethods.id, adMethodIds));
    
  // Join the ad methods with the items
  return items.map(item => {
    const adMethod = methods.find(m => m.id === item.adMethodId);
    return {
      ...item,
      adMethod
    };
  });
}

async markRecommendationAsViewed(recommendationId: number): Promise<boolean> {
  try {
    await db
      .update(adRecommendations)
      .set({ isViewed: true })
      .where(eq(adRecommendations.id, recommendationId));
    return true;
  } catch (error) {
    console.error("Error marking recommendation as viewed:", error);
    return false;
  }
}

async recordRecommendationInteraction(interaction: Partial<InsertUserRecommendationInteraction>): Promise<UserRecommendationInteraction> {
  const [result] = await db
    .insert(userRecommendationInteractions)
    .values(interaction)
    .returning();
  return result;
}
```

### 3. Frontend Component for Displaying Recommendations

```tsx
// client/src/components/dashboard/AdRecommendations.tsx (condensed)
const AdRecommendations: React.FC<AdRecommendationProps> = ({ businessId }) => {
  const { toast } = useToast();
  const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  
  // Fetch recommendation data
  const { 
    data: recommendation, 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['/api/ad-recommendations', businessId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/ad-recommendations/${businessId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      const data = await res.json();
      return data.success ? data.recommendation : null;
    },
    retry: 1,
  });

  // Generate new recommendations
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/ad-recommendations', { businessId });
      if (!res.ok) {
        throw new Error('Failed to generate recommendations');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'New recommendations have been generated',
        variant: 'default',
      });
      refetch();
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate recommendations',
        variant: 'destructive',
      });
    },
  });

  // Record user interaction with recommendation
  const interactionMutation = useMutation({
    mutationFn: async ({ 
      recommendationId, 
      interactionType, 
      feedback 
    }: { 
      recommendationId: number; 
      interactionType: string; 
      feedback?: string;
    }) => {
      const res = await apiRequest(
        'POST', 
        `/api/ad-recommendations/${recommendationId}/interaction`, 
        { interactionType, feedback }
      );
      if (!res.ok) {
        throw new Error('Failed to record interaction');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ad-recommendations', businessId] });
    },
  });

  // [UI Rendering Logic Condensed]
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>AI-Powered Ad Recommendations</CardTitle>
            <CardDescription>
              Personalized insights based on your campaign history and industry data
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Recommendation display logic omitted for brevity */}
      </CardContent>
    </Card>
  );
};
```

### 4. Dashboard Integration

```tsx
// client/src/pages/dashboard.tsx (updated sections)
export default function Dashboard() {
  // Existing code...
  
  // Fetch business data for the current user
  const { data: business } = useQuery({
    queryKey: ['/api/user', user?.id, 'business'],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/user/${user.id}/business`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });
  
  // Added new tour step
  const onboardingSteps: Step[] = [
    // Existing steps...
    {
      target: '.ad-recommendations-section',
      content: 'Get AI-powered ad recommendations tailored to your business. Our system analyzes your campaigns and suggests the most effective advertising methods.',
      placement: 'top',
    },
    // Other steps...
  ];
  
  // In the JSX return:
  return (
    <AppLayout title="Dashboard">
      {/* Existing components */}
      
      {business && (
        <div className="ad-recommendations-section mb-6" ref={recommendationsRef}>
          <AdRecommendations businessId={business.id} />
        </div>
      )}
      
      {/* Rest of the dashboard */}
    </AppLayout>
  );
}
```

## Integration Flow

1. User loads dashboard page
2. Business data is fetched
3. AdRecommendations component is initialized with business ID
4. Component either:
   - Shows existing recommendations (if any)
   - Shows empty state with Generate button
5. User can:
   - Generate new recommendations
   - View different budget scenarios
   - Implement or dismiss recommendations
   - Refresh recommendations

All user interactions are tracked in the database for improving future recommendations.