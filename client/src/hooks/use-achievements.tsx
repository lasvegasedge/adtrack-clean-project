import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserAchievement, AchievementType } from "@shared/schema";

export function useAchievements() {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: achievements = [],
    isLoading: isLoadingAchievements,
    error: achievementsError,
    refetch: refetchAchievements,
  } = useQuery<UserAchievement[]>({
    queryKey: ["/api/user", user?.id, "achievements"],
    queryFn: async ({ signal }) => {
      if (!user?.id) return [];
      try {
        const response = await fetch(`/api/user/${user?.id}/achievements`, { signal });
        if (!response.ok) {
          throw new Error('Failed to fetch achievements');
        }
        
        // Check content type to handle HTML responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.warn("Received HTML response instead of JSON for achievements");
          return [];
        }
        
        try {
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        } catch (e) {
          console.error("Error parsing achievements JSON:", e);
          return [];
        }
      } catch (error) {
        console.error("Achievement fetch error:", error);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: false,
  });

  const {
    data: pointsData = { points: 0 },
    isLoading: isLoadingPoints,
    error: pointsError,
    refetch: refetchPoints,
  } = useQuery<{ points: number }>({
    queryKey: ["/api/user", user?.id, "points"],
    queryFn: async ({ signal }) => {
      if (!user?.id) return { points: 0 };
      try {
        const response = await fetch(`/api/user/${user?.id}/points`, { signal });
        if (!response.ok) {
          throw new Error('Failed to fetch points');
        }
        
        // Check content type to handle HTML responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.warn("Received HTML response instead of JSON for points");
          return { points: 0 };
        }
        
        try {
          const data = await response.json();
          return typeof data === 'object' && 'points' in data ? data : { points: 0 };
        } catch (e) {
          console.error("Error parsing points JSON:", e);
          return { points: 0 };
        }
      } catch (error) {
        console.error("Points fetch error:", error);
        return { points: 0 };
      }
    },
    enabled: !!user?.id,
    retry: false,
  });

  const checkAchievementsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      try {
        const response = await fetch(`/api/user/${user.id}/check-achievements`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check content type to handle HTML responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.warn("Received HTML response instead of JSON for check-achievements");
          return [];
        }
        
        try {
          const data = await response.json();
          queryClient.invalidateQueries({ queryKey: ['/api/user', user.id, 'achievements'] });
          return Array.isArray(data) ? data : [];
        } catch (e) {
          console.error("Error parsing check-achievements JSON:", e);
          return [];
        }
      } catch (error) {
        console.error("Check achievements error:", error);
        throw error; // Rethrow to trigger onError handler
      }
    },
    onSuccess: (data: UserAchievement[]) => {
      // Invalidate both achievements and points queries
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "points"] });

      // Show toast for new achievements if there are any
      if (data.length > 0) {
        data.forEach((achievement) => {
          toast({
            title: "Achievement Unlocked! 🏆",
            description: `${achievement.type?.name}: ${achievement.type?.description}`,
            variant: "default",
            duration: 5000,
          });
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to check achievements",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    achievements,
    isLoadingAchievements,
    achievementsError,
    refetchAchievements,
    points: pointsData.points || 0,
    isLoadingPoints,
    pointsError,
    refetchPoints,
    checkAchievements: checkAchievementsMutation.mutate,
    isCheckingAchievements: checkAchievementsMutation.isPending,
  };
}