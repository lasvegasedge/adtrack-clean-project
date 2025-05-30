import { useAchievements } from "@/hooks/use-achievements";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Award, ChevronRight, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function AchievementSummary() {
  const { 
    achievements, 
    isLoadingAchievements, 
    points, 
    isLoadingPoints,
    checkAchievements,
    isCheckingAchievements
  } = useAchievements();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [showConfetti, setShowConfetti] = useState(false);

  const completedCount = achievements.filter(a => a.isCompleted).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Get the next achievement to highlight
  const nextAchievement = achievements
    .filter(a => !a.isCompleted)
    .sort((a, b) => {
      // Sort by progress percentage
      const aProgress = a.type ? (a.progress / a.type.criteria.threshold) : 0;
      const bProgress = b.type ? (b.progress / b.type.criteria.threshold) : 0;
      return bProgress - aProgress;
    })[0];

  // Calculate progress percentage for the next achievement
  const nextAchievementProgress = nextAchievement?.type 
    ? Math.min(100, Math.round((nextAchievement.progress / nextAchievement.type.criteria.threshold) * 100))
    : 0;

  const handleCheckAchievements = async () => {
    try {
      // This will be handled by the mutation in useAchievements hook
      checkAchievements();
    } catch (error) {
      toast({
        title: "Error checking achievements",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  if (isLoadingAchievements || isLoadingPoints) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center">
              <Trophy className="w-4 h-4 mr-1.5 text-primary" />
              Achievements
            </h3>
            <div className="bg-muted animate-pulse h-6 w-16 rounded-md"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
            <div className="h-2 w-full bg-muted animate-pulse rounded-full"></div>
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center">
            <Trophy className="w-4 h-4 mr-1.5 text-primary" />
            Achievements
          </h3>
          <div className="bg-muted rounded-md px-2 py-0.5 text-sm font-medium flex items-center">
            <Award className="w-3.5 h-3.5 mr-1 text-primary" />
            {points} Points
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{completedCount}/{totalCount}</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {nextAchievement && nextAchievement.type ? (
            <div className="bg-muted/50 rounded-md p-2.5 text-sm">
              <div className="font-medium mb-1">Next Achievement:</div>
              <div className="flex justify-between items-center mb-1">
                <span>{nextAchievement.type.name}</span>
                <span className="text-xs font-medium">{nextAchievementProgress}%</span>
              </div>
              <Progress value={nextAchievementProgress} className="h-1.5" />
            </div>
          ) : (
            <div className="bg-muted/50 rounded-md p-2.5 text-sm text-center">
              <span className="text-muted-foreground">All achievements completed!</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleCheckAchievements}
              disabled={isCheckingAchievements}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isCheckingAchievements ? 'animate-spin' : ''}`} />
              {isCheckingAchievements ? 'Checking...' : 'Check'}
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full"
              onClick={() => setLocation('/achievements')}
            >
              <Award className="w-3.5 h-3.5 mr-1.5" />
              View All
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}