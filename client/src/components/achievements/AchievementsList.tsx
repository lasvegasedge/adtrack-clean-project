import { useAchievements } from "@/hooks/use-achievements";
import { AchievementCard } from "./AchievementCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AchievementsList() {
  const {
    achievements,
    isLoadingAchievements,
    checkAchievements,
    isCheckingAchievements,
    points
  } = useAchievements();

  if (isLoadingAchievements) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Achievements</h2>
          <div className="bg-muted rounded-md px-3 py-1">
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Achievements</h2>
        <div className="flex items-center gap-4">
          <div className="bg-muted rounded-md px-3 py-1 flex items-center">
            <Award className="w-4 h-4 mr-2 text-primary" />
            <span className="font-medium">{points} Points</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => checkAchievements()}
            disabled={isCheckingAchievements}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingAchievements ? 'animate-spin' : ''}`} />
            {isCheckingAchievements ? 'Checking...' : 'Check for new achievements'}
          </Button>
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <Award className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No achievements yet</h3>
          <p className="text-muted-foreground mt-1">
            Create campaigns and improve your ROI to unlock achievements and earn points.
          </p>
          <Button 
            variant="default" 
            className="mt-4" 
            onClick={() => checkAchievements()}
            disabled={isCheckingAchievements}
          >
            Check for achievements
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
}