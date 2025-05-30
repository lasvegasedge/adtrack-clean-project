import { AchievementsList } from "@/components/achievements/AchievementsList";
import AppLayout from "@/components/layout/AppLayout";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements } from "@/hooks/use-achievements";
import { Shield, Trophy, Award, Sparkles, Target, TrendingUp } from "lucide-react";

export default function AchievementsPage() {
  const { points, isLoadingPoints } = useAchievements();

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
            <p className="text-muted-foreground mt-1">
              Complete actions and campaigns to earn achievements and points
            </p>
          </div>
          <div className="bg-gradient-to-r from-primary/90 to-primary rounded-lg p-4 shadow-md text-white flex items-center gap-3">
            <Trophy className="h-8 w-8" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-90">Total Score</p>
              <p className="text-2xl font-bold">
                {isLoadingPoints ? "..." : points} points
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>All Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>Completed</span>
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>In Progress</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-6">
            <AchievementsList />
          </TabsContent>
          <TabsContent value="completed" className="space-y-6">
            <CompletedAchievements />
          </TabsContent>
          <TabsContent value="in-progress" className="space-y-6">
            <InProgressAchievements />
          </TabsContent>
        </Tabs>

        <div className="mt-10 bg-muted/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Sparkles className="h-10 w-10 text-primary shrink-0" />
            <div>
              <h2 className="text-xl font-bold">How Achievements Work</h2>
              <div className="space-y-3 mt-3">
                <p>
                  Achievements help track your progress and reward your marketing success in AdTrack. 
                  Complete various activities to unlock achievements and earn points.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Complete Campaigns</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Create and complete advertising campaigns to earn campaign-related achievements.
                    </p>
                  </div>
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Improve ROI</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Achieve higher ROI on your marketing campaigns to unlock performance achievements.
                    </p>
                  </div>
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Collect Points</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Earn points by unlocking achievements, which can be used for future features and rewards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function CompletedAchievements() {
  const { achievements, isLoadingAchievements } = useAchievements();
  
  const completedAchievements = achievements.filter(a => a.isCompleted);
  
  if (isLoadingAchievements) {
    return <div>Loading...</div>;
  }
  
  return completedAchievements.length === 0 ? (
    <div className="border rounded-lg p-8 text-center">
      <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
      <h3 className="text-lg font-medium">No completed achievements yet</h3>
      <p className="text-muted-foreground mt-1">
        Keep working on your campaigns to complete achievements.
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {completedAchievements.map((achievement) => (
        <AchievementCard key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}

function InProgressAchievements() {
  const { achievements, isLoadingAchievements } = useAchievements();
  
  const inProgressAchievements = achievements.filter(a => !a.isCompleted);
  
  if (isLoadingAchievements) {
    return <div>Loading...</div>;
  }
  
  return inProgressAchievements.length === 0 ? (
    <div className="border rounded-lg p-8 text-center">
      <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
      <h3 className="text-lg font-medium">No achievements in progress</h3>
      <p className="text-muted-foreground mt-1">
        Your achievement journey is yet to begin. Create a campaign to get started!
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {inProgressAchievements.map((achievement) => (
        <AchievementCard key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}