import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy, TrendingUp, Clock, Target } from "lucide-react";

interface AchievementCardProps {
  achievement: {
    id: number;
    progress: number | null;
    isCompleted: boolean | null;
    userId: number;
    achievementTypeId: number;
    dateEarned?: string | null;
    type?: {
      id: number;
      name: string;
      description: string;
      icon: string;
      category?: string;
      criteria: {
        type: string;
        threshold: number;
      };
      points: number;
    };
  };
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  if (!achievement.type) return null;
  
  const progress = achievement.progress || 0;
  const isCompleted = achievement.isCompleted || false;
  
  const progressPercent = Math.min(
    100,
    Math.round((progress / achievement.type.criteria.threshold) * 100)
  );
  
  const getIconComponent = () => {
    switch (achievement.type?.icon) {
      case "award":
        return <Award className="h-6 w-6 text-primary" />;
      case "trophy":
        return <Trophy className="h-6 w-6 text-amber-500" />;
      case "trending-up":
        return <TrendingUp className="h-6 w-6 text-emerald-500" />;
      case "target":
        return <Target className="h-6 w-6 text-rose-500" />;
      default:
        return <Award className="h-6 w-6 text-primary" />;
    }
  };
  
  const getCriteriaTypeLabel = () => {
    switch (achievement.type?.criteria.type) {
      case "campaignCount":
        return "campaigns created";
      case "activeCampaignCount":
        return "active campaigns";
      case "totalSpent":
        return "total ad spend";
      case "totalEarned":
        return "total revenue";
      case "averageRoi":
        return "average ROI";
      default:
        return achievement.type?.criteria.type;
    }
  };
  
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 ${
      isCompleted ? "border-primary" : "opacity-75"
    }`}>
      {isCompleted && (
        <div className="absolute top-0 right-0">
          <Badge variant="default" className="m-2">
            <Trophy className="h-3 w-3 mr-1" /> Completed
          </Badge>
        </div>
      )}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          {getIconComponent()}
          <CardTitle className="text-lg">{achievement.type.name}</CardTitle>
        </div>
        <Badge variant="outline" className="text-sm">
          {achievement.type.points} points
        </Badge>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">{achievement.type.description}</CardDescription>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">
              {progress} / {achievement.type.criteria.threshold} {getCriteriaTypeLabel()}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="pt-1 text-xs text-muted-foreground">
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {isCompleted ? "Completed" : "In progress"}
        </div>
      </CardFooter>
    </Card>
  );
}